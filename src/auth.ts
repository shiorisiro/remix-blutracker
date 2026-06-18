import { supabase, isSupabaseConfigured } from './supabase-client';
import { localDb } from './db';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function mapSupabaseUser(sbUser: any): AppUser | null {
  if (!sbUser) return null;
  return {
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.display_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
  };
}

// Auth state listeners
const authListeners = new Set<(user: AppUser | null) => void>();
let currentUser: AppUser | null = null;

function notifyListeners(user: AppUser | null) {
  currentUser = user;
  authListeners.forEach(cb => cb(user));
}

export const auth = {
  get currentUser(): AppUser | null {
    return currentUser;
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('blutracker-auth-token');
    localStorage.removeItem('blutracker_auth_user');
    localStorage.removeItem('blutracker_tx_local');
    notifyListeners(null);
  },

  async getIdToken(): Promise<string> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || '';
    }
    return 'local-token';
  }
};

export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = mapSupabaseUser(data.user);
    if (user) notifyListeners(user);
    return user!;
  } else {
    // Local auth fallback
    const localUser = localDb.getUser();
    if (localUser && localUser.email === email) {
      notifyListeners(localUser);
      return localUser;
    }
    throw new Error('Email atau kata sandi salah.');
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AppUser> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    if (error) throw error;
    const user = mapSupabaseUser(data.user);
    if (user) notifyListeners(user);
    return user!;
  } else {
    const newUser: AppUser = {
      uid: crypto.randomUUID(),
      email,
      displayName,
      photoURL: null,
    };
    localDb.setUser(newUser);
    notifyListeners(newUser);
    return newUser;
  }
}

export async function updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: profile.displayName,
        avatar_url: profile.photoURL,
      }
    });
    if (error) throw error;
  }

  if (currentUser) {
    currentUser.displayName = profile.displayName ?? currentUser.displayName;
    currentUser.photoURL = profile.photoURL ?? currentUser.photoURL;
    notifyListeners(currentUser);
  }
}

export function onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
  authListeners.add(callback);

  // Initial check
  if (isSupabaseConfigured) {
    supabase.auth.getSession().then(({ data }) => {
      const user = mapSupabaseUser(data.session?.user);
      callback(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = mapSupabaseUser(session?.user);
      callback(user);
    });

    return () => {
      authListeners.delete(callback);
      subscription.unsubscribe();
    };
  } else {
    const localUser = localDb.getUser();
    callback(localUser);

    return () => {
      authListeners.delete(callback);
    };
  }
}

// Google Sign-In (via Supabase OAuth)
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase tidak dikonfigurasi. Login Google tidak tersedia.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  });

  if (error) throw error;
}
