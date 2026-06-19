import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseUrl !== 'https://placeholder-url-for-supabase.supabase.co' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'placeholder-anon-key';

// Use Supabase client with default storage behavior. Do NOT store tokens in localStorage in production.
// To migrate to secure sessions, configure Supabase to use httpOnly cookies and set `auth.persistSession` accordingly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // IMPORTANT: remove custom localStorage usage to avoid XSS-extractable tokens
    // storage: localStorage, // <-- removed
    // storageKey: 'blutracker-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'blutracker-web',
    },
    // If you use cookie-based sessions, ensure fetch uses credentials: 'include' for same-origin requests.
    // Otherwise leave default fetch behavior.
    // fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
  },
  db: {
    schema: 'public'
  }
});
