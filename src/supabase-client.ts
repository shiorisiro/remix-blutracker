import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseUrl !== 'https://placeholder-url-for-supabase.supabase.co' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // FIX: Gunakan localStorage (bukan cookies) untuk auth token
    storage: localStorage,
    storageKey: 'blutracker-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'blutracker-web',
    },
    // FIX: Jangan kirim cookies cross-origin
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        credentials: 'omit',
      });
    },
  },
  db: {
    schema: 'public'
  }
});
