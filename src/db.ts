import { supabase, isSupabaseConfigured } from './supabase-client';
import { Transaction } from './types';

// ==========================================
// OFFLINE FALLBACK (Session storage)
// Use sessionStorage instead of localStorage to reduce persistent exposure of user data.
// ==========================================
const localDb = {
  getTransactions: (userId: string): Transaction[] => {
    try {
      const key = `blutracker_tx_${userId}`;
      const all = sessionStorage.getItem(key) || '[]';
      return JSON.parse(all);
    } catch {
      return [];
    }
  },
  saveTransactions: (userId: string, txs: Transaction[]) => {
    const key = `blutracker_tx_${userId}`;
    sessionStorage.setItem(key, JSON.stringify(txs));
  },
  getUser: () => {
    try {
      const u = sessionStorage.getItem('blutracker_auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any) => {
    if (user) {
      sessionStorage.setItem('blutracker_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('blutracker_auth_user');
    }
  }
};

// Helper to validate userId (must be UUID v4 format)
function validateUserId(userId: string) {
  const uuidV4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
  return uuidV4.test(userId);
}

// ==========================================
// SUPABASE DATABASE OPERATIONS
// ==========================================

export const db = {
  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!isSupabaseConfigured) {
      return localDb.getTransactions(userId);
    }

    if (!validateUserId(userId)) {
      console.error('Invalid userId format when fetching transactions');
      return [];
    }

    // Use user-scoped query and rely on Supabase Row Level Security (RLS) to enforce owner access
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return localDb.getTransactions(userId);
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title || '',
      amount: Number(row.amount) || 0,
      type: row.type || 'expense',
      category: row.category || 'General',
      date: row.date,
      time: row.time || '00:00',
      classification: row.classification || 'personal',
      ownerId: row.owner_id || row.user_id || userId,
      isDebt: row.is_debt || false,
      debtType: row.debt_type || 'borrow',
      isSettled: row.is_settled || false,
    }));
  },

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      ownerId: userId,
    };

    if (!isSupabaseConfigured) {
      const items = localDb.getTransactions(userId);
      items.push(newTx);
      localDb.saveTransactions(userId, items);
      return newTx;
    }

    const payload = {
      id: newTx.id,
      title: newTx.title,
      amount: newTx.amount,
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
      time: newTx.time,
      classification: newTx.classification,
      user_id: userId,
      owner_id: userId,
      is_debt: newTx.isDebt || false,
      debt_type: newTx.debtType || 'borrow',
      is_settled: newTx.isSettled || false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('transactions').insert([payload]);
    if (error) throw error;

    return newTx;
  },

  async updateTransaction(userId: string, txId: string, updates: Partial<Transaction>): Promise<void> {
    if (!isSupabaseConfigured) {
      const items = localDb.getTransactions(userId);
      const idx = items.findIndex(t => t.id === txId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...updates };
        localDb.saveTransactions(userId, items);
      }
      return;
    }

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.time !== undefined) payload.time = updates.time;
    if (updates.classification !== undefined) payload.classification = updates.classification;
    if (updates.isDebt !== undefined) payload.is_debt = updates.isDebt;
    if (updates.debtType !== undefined) payload.debt_type = updates.debtType;
    if (updates.isSettled !== undefined) payload.is_settled = updates.isSettled;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('transactions').update(payload).eq('id', txId);
    if (error) throw error;
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const items = localDb.getTransactions(userId).filter(t => t.id !== txId);
      localDb.saveTransactions(userId, items);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('Transaksi tidak ditemukan atau tidak memiliki akses');
    }
  },

  async deleteTransactions(userId: string, txIds: string[]): Promise<void> {
    if (!isSupabaseConfigured) {
      const items = localDb.getTransactions(userId).filter(t => !txIds.includes(t.id));
      localDb.saveTransactions(userId, items);
      return;
    }

    if (txIds.length === 0) return;

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .in('id', txIds)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('Tidak ada transaksi yang dapat dihapus');
    }
  },

  async deleteAllTransactions(userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localDb.saveTransactions(userId, []);
      return;
    }

    if (!validateUserId(userId)) {
      throw new Error('Invalid userId');
    }

    // Use eq and rely on RLS rather than string interpolation
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
    if (error) throw error;
  },

  // Realtime subscription
  subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
    if (!isSupabaseConfigured) {
      // Poll sessionStorage every 2 seconds
      const interval = setInterval(() => {
        callback(localDb.getTransactions(userId));
      }, 2000);
      return () => clearInterval(interval);
    }

    // Initial fetch
    this.getTransactions(userId).then(callback);

    // Realtime subscription
    const channel = supabase
      .channel(`transactions_${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => this.getTransactions(userId).then(callback)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export { localDb };
