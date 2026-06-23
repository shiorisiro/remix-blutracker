import { db as remoteDb } from './db';
import { isSupabaseConfigured } from './supabase-client';
import { dexieDb, SyncQueueItem, SyncOp, CachedTransaction } from './dexieClient';
import { Transaction } from './types';

// Dipakai useSyncStatus.ts buat nge-render icon sync di Profil tanpa polling terus-terusan.
export const syncEvents = new EventTarget();
function notifyQueueChanged() {
  syncEvents.dispatchEvent(new Event('queue-changed'));
}

let activeUserId: string | undefined;
let backgroundTimerStarted = false;

// ============================================================
// Cache helpers
// ============================================================

async function applyPendingOverlay(userId: string, base: Transaction[]): Promise<Transaction[]> {
  const queue = await dexieDb.syncQueue.where('userId').equals(userId).sortBy('createdAt');
  let result = [...base];
  for (const item of queue) {
    if (item.op === 'add') {
      if (!result.some(t => t.id === item.txId)) {
        result.push({ ...item.payload, id: item.txId });
      }
    } else if (item.op === 'update') {
      result = result.map(t => (t.id === item.txId ? { ...t, ...item.payload } : t));
    } else if (item.op === 'delete') {
      result = result.filter(t => t.id !== item.txId);
    }
  }
  return result;
}

async function readCache(userId: string): Promise<Transaction[]> {
  const rows = await dexieDb.transactions.where('ownerId').equals(userId).toArray();
  const overlaid = await applyPendingOverlay(userId, rows);
  return overlaid.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

async function writeServerSnapshot(userId: string, txs: Transaction[]) {
  await dexieDb.transactions.where('ownerId').equals(userId).delete();
  await dexieDb.transactions.bulkPut(txs.map(t => ({ ...t, ownerId: userId } as CachedTransaction)));
}

async function patchLocalCache(userId: string, txId: string, patch: Partial<Transaction> | null) {
  if (patch === null) {
    await dexieDb.transactions.delete(txId);
    return;
  }
  const existing = await dexieDb.transactions.get(txId);
  await dexieDb.transactions.put({ ...(existing || {}), ...patch, id: txId, ownerId: userId } as CachedTransaction);
}

// ============================================================
// Sync queue
// ============================================================

async function enqueue(item: { userId: string; txId: string; op: SyncOp; payload?: any }) {
  // Kalau ada 'add' yang masih nunggu buat row yang sama, gabungkan saja - jangan bikin
  // operasi terpisah buat row yang server-nya sendiri belum pernah tau row itu ada.
  const pendingAdd = await dexieDb.syncQueue
    .where('txId')
    .equals(item.txId)
    .filter(q => q.userId === item.userId && q.op === 'add')
    .first();

  if (pendingAdd) {
    if (item.op === 'update') {
      await dexieDb.syncQueue.update(pendingAdd.id!, { payload: { ...pendingAdd.payload, ...item.payload } });
      notifyQueueChanged();
      return;
    }
    if (item.op === 'delete') {
      await dexieDb.syncQueue.delete(pendingAdd.id!);
      notifyQueueChanged();
      return;
    }
  }

  await dexieDb.syncQueue.add({ ...item, createdAt: Date.now(), retries: 0 } as SyncQueueItem);
  notifyQueueChanged();
}

export async function flushQueue(userId?: string) {
  const uid = userId || activeUserId;
  if (!uid || !isSupabaseConfigured || typeof navigator === 'undefined' || !navigator.onLine) return;

  const items = await dexieDb.syncQueue.where('userId').equals(uid).sortBy('createdAt');
  if (items.length === 0) return;

  syncEvents.dispatchEvent(new Event('flush-start'));
  try {
    for (const item of items) {
      try {
        if (item.op === 'add') {
          await remoteDb.addTransaction(uid, { ...item.payload, id: item.txId });
        } else if (item.op === 'update') {
          await remoteDb.updateTransaction(uid, item.txId, item.payload);
        } else if (item.op === 'delete') {
          await remoteDb.deleteTransaction(uid, item.txId);
        }
        await dexieDb.syncQueue.delete(item.id!);
        notifyQueueChanged();
      } catch (e) {
        console.error('Sinkronisasi gagal, akan dicoba lagi nanti:', e);
        await dexieDb.syncQueue.update(item.id!, { retries: item.retries + 1 });
        break; // jaga urutan - jangan lompat ke operasi berikutnya kalau yang ini gagal
      }
    }
  } finally {
    syncEvents.dispatchEvent(new Event('flush-end'));
  }
}

function ensureBackgroundSync(userId: string) {
  activeUserId = userId;
  if (backgroundTimerStarted || typeof window === 'undefined') return;
  backgroundTimerStarted = true;
  setInterval(() => flushQueue(), 30000);
  window.addEventListener('online', () => flushQueue());
}

// ============================================================
// Drop-in replacement untuk db.ts - signature sama persis
// ============================================================

export const db = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    ensureBackgroundSync(userId);
    const cached = await readCache(userId);

    if (navigator.onLine && isSupabaseConfigured) {
      remoteDb
        .getTransactions(userId)
        .then(fresh => writeServerSnapshot(userId, fresh))
        .catch(() => {});
    }

    return cached;
  },

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
    ensureBackgroundSync(userId);
    const id = tx.id || crypto.randomUUID();
    const newTx: Transaction = { ...tx, id } as Transaction;

    await patchLocalCache(userId, id, newTx);

    if (navigator.onLine && isSupabaseConfigured) {
      try {
        await remoteDb.addTransaction(userId, { ...tx, id });
        return newTx;
      } catch (e) {
        console.error('Gagal kirim transaksi ke server, disimpan untuk sinkronisasi nanti:', e);
      }
    }
    await enqueue({ userId, txId: id, op: 'add', payload: tx });
    return newTx;
  },

  async updateTransaction(userId: string, txId: string, updates: Partial<Transaction>): Promise<void> {
    ensureBackgroundSync(userId);
    await patchLocalCache(userId, txId, updates);

    if (navigator.onLine && isSupabaseConfigured) {
      try {
        await remoteDb.updateTransaction(userId, txId, updates);
        return;
      } catch (e) {
        console.error('Gagal kirim perubahan ke server, disimpan untuk sinkronisasi nanti:', e);
      }
    }
    await enqueue({ userId, txId, op: 'update', payload: updates });
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    ensureBackgroundSync(userId);
    await patchLocalCache(userId, txId, null);

    if (navigator.onLine && isSupabaseConfigured) {
      try {
        await remoteDb.deleteTransaction(userId, txId);
        return;
      } catch (e) {
        console.error('Gagal hapus di server, disimpan untuk sinkronisasi nanti:', e);
      }
    }
    await enqueue({ userId, txId, op: 'delete' });
  },

  async deleteTransactions(userId: string, txIds: string[]): Promise<void> {
    ensureBackgroundSync(userId);
    for (const txId of txIds) {
      await patchLocalCache(userId, txId, null);
    }

    if (navigator.onLine && isSupabaseConfigured) {
      try {
        await remoteDb.deleteTransactions(userId, txIds);
        return;
      } catch (e) {
        console.error('Gagal hapus di server, disimpan untuk sinkronisasi nanti:', e);
      }
    }
    for (const txId of txIds) {
      await enqueue({ userId, txId, op: 'delete' });
    }
  },

  async deleteAllTransactions(userId: string): Promise<void> {
    ensureBackgroundSync(userId);
    await dexieDb.transactions.where('ownerId').equals(userId).delete();
    await dexieDb.syncQueue.where('userId').equals(userId).delete();
    notifyQueueChanged();

    if (navigator.onLine && isSupabaseConfigured) {
      try {
        await remoteDb.deleteAllTransactions(userId);
      } catch (e) {
        console.error('Gagal hapus semua transaksi di server:', e);
      }
    }
  },

  subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
    ensureBackgroundSync(userId);

    // Selalu kirim cache lokal dulu - instan, dan jalan walau offline.
    readCache(userId).then(callback);

    const ingestServerSnapshot = async (txs: Transaction[]) => {
      await writeServerSnapshot(userId, txs);
      const merged = await applyPendingOverlay(userId, txs);
      callback(merged);
    };

    if (!isSupabaseConfigured) {
      return remoteDb.subscribeToTransactions(userId, ingestServerSnapshot);
    }

    let unsubscribeRemote: (() => void) | null = null;
    const startRemote = () => {
      if (unsubscribeRemote || !navigator.onLine) return;
      unsubscribeRemote = remoteDb.subscribeToTransactions(userId, ingestServerSnapshot);
    };
    const stopRemote = () => {
      if (unsubscribeRemote) {
        unsubscribeRemote();
        unsubscribeRemote = null;
      }
    };

    if (navigator.onLine) startRemote();

    const onOnline = () => {
      startRemote();
      flushQueue(userId);
    };
    const onOffline = () => stopRemote();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stopRemote();
    };
  },
};
