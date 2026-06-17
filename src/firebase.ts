import { getSupabase, isSupabaseConfigured, localDb } from './lib/supabase';

// Define a unified custom Auth object designed to act like Firebase Auth
export const auth = {
  get currentUser() {
    if (isSupabaseConfigured) {
      const sb = getSupabase();
      try {
        const supabaseUrlStr = (import.meta as any).env.VITE_SUPABASE_URL;
        if (supabaseUrlStr) {
          const sessionStr = localStorage.getItem(`sb-${new URL(supabaseUrlStr).hostname}-auth-token`);
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            const sbUser = session?.user;
            if (sbUser) {
              return {
                uid: sbUser.id,
                email: sbUser.email || null,
                displayName: sbUser.user_metadata?.display_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
                photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
                reload: async () => {},
                getIdToken: async () => session?.access_token || ''
              };
            }
          }
        }
      } catch (e) {
        console.warn('Error reading supabase session synchronously from storage', e);
      }
      return null;
    } else {
      const localUser = localDb.getUser();
      if (localUser) {
        return {
          ...localUser,
          reload: async () => {},
          getIdToken: async () => 'local-jwt-token'
        };
      }
      return null;
    }
  },
  
  signOut: async () => {
    if (isSupabaseConfigured) {
      const sb = getSupabase();
      const { error } = await sb?.auth.signOut();
      if (error) throw error;
    } else {
      localDb.setUser(null);
      window.location.reload();
    }
  }
};

export const db = {};
export const googleProvider = {};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  console.error(`Supabase DB Error during ${operationType} on ${path}: `, errMessage);
  throw new Error(errMessage);
}
