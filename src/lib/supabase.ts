import { supabase, isSupabaseConfigured } from '../supabase';

export { isSupabaseConfigured };

export function getSupabase() {
  if (!isSupabaseConfigured) {
    return null;
  }
  return supabase;
}

// ==========================================
// LOCAL STORAGE AUTONOMOUS FALLBACK ENGINE
// ==========================================
export const localDb = {
  getTransactions: (userId: string): any[] => {
    try {
      const all = localStorage.getItem(`dinarspay_tx_${userId}`) || '[]';
      return JSON.parse(all);
    } catch {
      return [];
    }
  },
  saveTransactions: (userId: string, txs: any[]) => {
    localStorage.setItem(`dinarspay_tx_${userId}`, JSON.stringify(txs));
  },
  getUser: (): any => {
    try {
      const u = localStorage.getItem('dinarspay_auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any) => {
    if (user) {
      localStorage.setItem('dinarspay_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dinarspay_auth_user');
    }
  },
  getUsersList: (): any[] => {
    try {
      const all = localStorage.getItem('dinarspay_users_registry') || '[]';
      return JSON.parse(all);
    } catch {
      return [];
    }
  },
  saveUserToRegistry: (user: any) => {
    try {
      const list = localDb.getUsersList();
      const existingIdx = list.findIndex(u => u.email === user.email);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...user };
      } else {
        list.push(user);
      }
      localStorage.setItem('dinarspay_users_registry', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }
};
