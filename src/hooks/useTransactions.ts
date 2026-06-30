import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '../types';
import { db, flushQueue } from '../offlineDb';
import { AppUser } from '../auth';
import { INITIAL_TRANSACTIONS, CATEGORIES_BY_TYPE, CATEGORY_MIGRATION_MAP } from '../constants';

export function useTransactions(user: AppUser | null, authReady: boolean) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('blutracker_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    const hasVisited = localStorage.getItem('blutracker_visited');
    if (!hasVisited) {
      localStorage.setItem('blutracker_visited', 'true');
      return INITIAL_TRANSACTIONS;
    }
    return [];
  });

  // Persist to localStorage when logged out
  useEffect(() => {
    if (authReady && !user) {
      localStorage.setItem('blutracker_transactions', JSON.stringify(transactions));
    }
  }, [transactions, user, authReady]);

  // On login: sync local -> Supabase, then load + subscribe
  useEffect(() => {
    if (!user) return;

    // Migrate local transactions to Supabase on first login
    const localSaved = localStorage.getItem('blutracker_transactions');
    if (localSaved) {
      try {
        const localTransactions: Transaction[] = JSON.parse(localSaved);
        localTransactions.forEach(async (t) => {
          await db.addTransaction(user.uid, t);
        });
        localStorage.removeItem('blutracker_transactions');
      } catch (e) {
        console.error('Sync error:', e);
      }
    }

    db.getTransactions(user.uid).then(setTransactions);

    const unsubscribe = db.subscribeToTransactions(user.uid, setTransactions);

    // Android fix: Supabase Realtime WebSocket can drop when app goes to background
    // (screen off / app switch). Re-fetch when the app returns to foreground or
    // network comes back, so the UI doesn't get stuck showing stale "belum tersinkron".
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        db.getTransactions(user.uid).then(setTransactions);
        flushQueue(user.uid);
      }
    };
    const handleOnline = () => {
      db.getTransactions(user.uid).then(setTransactions);
      flushQueue(user.uid);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  // Category migration (runs silently in background, once per id per session)
  const migratedIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || transactions.length === 0) return;
    transactions.forEach((t) => {
      if (migratedIds.current.has(t.id)) return;
      const validCats = CATEGORIES_BY_TYPE[t.type] || [];
      if (validCats.includes(t.category)) return;
      migratedIds.current.add(t.id);
      const newCat = CATEGORY_MIGRATION_MAP[t.category] || 'Lainnya';
      if (newCat !== t.category) {
        db.updateTransaction(user.uid, t.id, { category: newCat }).catch((e) =>
          console.error('Category migration failed:', t.id, e)
        );
      }
    });
  }, [transactions, user]);

  const addTransaction = useCallback(async (txData: Omit<Transaction, 'id' | 'ownerId'> & { id?: string }) => {
    if (!user) {
      const saved: Transaction = { ...txData, id: txData.id || crypto.randomUUID(), ownerId: 'local' } as Transaction;
      setTransactions((prev) => [...prev, saved]);
      return saved;
    }
    return db.addTransaction(user.uid, txData as any);
  }, [user]);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    if (!user) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      return;
    }
    return db.updateTransaction(user.uid, id, data);
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    return db.deleteTransaction(user.uid, id);
  }, [user]);

  const deleteTransactions = useCallback(async (ids: string[]) => {
    if (!user) {
      setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
      return;
    }
    return db.deleteTransactions(user.uid, ids);
  }, [user]);

  return {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
  };
}
