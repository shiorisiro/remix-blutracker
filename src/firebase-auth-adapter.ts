import { getSupabase, isSupabaseConfigured, localDb } from './lib/supabase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken?: () => Promise<string>;
}

const authStateListeners = new Set<(user: User | null) => void>();
let currentAdapterUser: User | null = null;

function mapSupabaseUser(sbUser: any): User | null {
  if (!sbUser) return null;
  return {
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.display_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
    getIdToken: async () => {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.auth.getSession();
        return data.session?.access_token || '';
      }
      return 'local-jwt-token';
    }
  };
}

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  authStateListeners.add(callback);
  
  if (isSupabaseConfigured) {
    const sb = getSupabase();
    sb?.auth.getSession().then(({ data }: any) => {
      const u = mapSupabaseUser(data.session?.user);
      currentAdapterUser = u;
      callback(u);
    });

    const { data: { subscription } } = sb?.auth.onAuthStateChange((event: string, session: any) => {
      const u = mapSupabaseUser(session?.user);
      currentAdapterUser = u;
      callback(u);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      authStateListeners.delete(callback);
      subscription.unsubscribe();
    };
  } else {
    const localUser = localDb.getUser();
    currentAdapterUser = localUser;
    // Notify on next tick to imitate async Firebase state loading
    setTimeout(() => {
      callback(localUser);
    }, 50);
    
    return () => {
      authStateListeners.delete(callback);
    };
  }
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  if (isSupabaseConfigured) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
    const mapped = mapSupabaseUser(data.user);
    currentAdapterUser = mapped;
    return { user: mapped };
  } else {
    const usersList = localDb.getUsersList();
    const match = usersList.find(u => u.email === email);
    if (!match) {
      throw new Error("Akun tidak ditemukan. Silakan klik daftar jika belum punya akun.");
    }
    if (match.password && match.password !== pass) {
      throw new Error("Password salah. Silakan coba lagi.");
    }
    const mockUser: User = {
      uid: match.uid || crypto.randomUUID(),
      email: match.email,
      displayName: match.displayName || email.split('@')[0],
      photoURL: match.photoURL || null
    };
    localDb.setUser(mockUser);
    currentAdapterUser = mockUser;
    authStateListeners.forEach(cb => cb(mockUser));
    return { user: mockUser };
  }
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  if (isSupabaseConfigured) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password: pass
    });
    if (error) throw error;
    const mapped = mapSupabaseUser(data.user);
    currentAdapterUser = mapped;
    return { user: mapped };
  } else {
    const usersList = localDb.getUsersList();
    if (usersList.some(u => u.email === email)) {
      throw new Error("Email sudah terdaftar. Silakan login.");
    }
    const mockUser: User = {
      uid: crypto.randomUUID(),
      email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    localDb.setUser(mockUser);
    localDb.saveUserToRegistry({ email, password: pass, uid: mockUser.uid, displayName: mockUser.displayName });
    currentAdapterUser = mockUser;
    authStateListeners.forEach(cb => cb(mockUser));
    return { user: mockUser };
  }
};

export const updateProfile = async (firebaseUserObj: any, profileData: { displayName?: string, photoURL?: string }) => {
  if (isSupabaseConfigured) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.updateUser({
      data: {
        display_name: profileData.displayName,
        avatar_url: profileData.photoURL
      }
    });
    if (error) throw error;
    return data;
  } else {
    if (currentAdapterUser) {
      currentAdapterUser.displayName = profileData.displayName ?? currentAdapterUser.displayName;
      currentAdapterUser.photoURL = profileData.photoURL ?? currentAdapterUser.photoURL;
      localDb.setUser(currentAdapterUser);
      localDb.saveUserToRegistry(currentAdapterUser);
      authStateListeners.forEach(cb => cb(currentAdapterUser));
    }
    return true;
  }
};

export class GoogleAuthProvider {
  static credential(...args: any[]) {
    return { providerId: 'google.com' };
  }
}
export const signInWithPopup = async (...args: any[]) => {
  alert("Login Google popup memerlukan konfigurasi di dashboard Supabase / OAuth.");
};
export const signInWithRedirect = async (...args: any[]) => {};
export const getRedirectResult = async (...args: any[]) => null;
export const signInWithCredential = async (...args: any[]) => ({});
export type { User as FirebaseUser };
