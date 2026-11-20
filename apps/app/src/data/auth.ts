import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { BUILTIN_COLLECTIONS } from '@pickle/core';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useStore } from './store';

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  configured: boolean;
  isDemoMode: boolean;

  setUser: (user: AuthUser | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  initAuth: () => Promise<void>;
  signInWithPassword: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithPassword: (email: string, pass: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  sendMagicLink: (email: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<{ ok: boolean; error?: string }>;
}

let listenerInitialized = false;

/**
 * Idempotently seed default built-in collections into the user's collections table.
 * Specified in ARCHITECTURE.md Milestone 0/1.
 */
export async function ensureBuiltIns(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !userId) return;
  try {
    const { data: existing, error } = await supabase
      .from('collections')
      .select('builtin_key')
      .eq('user_id', userId);

    if (error) {
      // Collections table might not exist yet in local/dev backend; do not crash
      return;
    }

    const existingKeys = new Set((existing ?? []).map((c: { builtin_key?: string }) => c.builtin_key).filter(Boolean) as string[]);
    const toInsert = BUILTIN_COLLECTIONS.filter((b) => b.builtinKey && !existingKeys.has(b.builtinKey)).map((b) => ({
      user_id: userId,
      name: b.name,
      icon: b.icon,
      color: b.color,
      built_in: true,
      builtin_key: b.builtinKey,
      version: b.version,
      sort: b.sort,
      statuses: b.statuses,
      fields: b.fields,
    }));

    if (toInsert.length > 0) {
      await supabase.from('collections').insert(toInsert);
    }
  } catch (err) {
    // Graceful fallback
    console.warn('ensureBuiltIns notice:', err);
  }
}

/**
 * Seeds built-ins if needed and loads all cards/collections/reminders from Supabase.
 */
async function onUserAuthenticated(userId: string): Promise<void> {
  try {
    await ensureBuiltIns(userId);
    await useStore.getState().loadFromSupabase();
  } catch (err) {
    console.warn('[auth] post-login sync notice:', err);
  }
}

function getInitialDemoMode(): boolean {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      return window.sessionStorage.getItem('pickle_demo_preview') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,
  configured: isSupabaseConfigured(),
  isDemoMode: getInitialDemoMode(),

  setUser: (user, session) => set({ user, session, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  enableDemoMode: () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem('pickle_demo_preview', 'true');
      } catch {}
    }
    set({ isDemoMode: true, error: null });
    useStore.getState().loadDemoData();
  },

  exitDemoMode: () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem('pickle_demo_preview');
      } catch {}
    }
    set({ isDemoMode: false });
    useStore.getState().clearData();
  },

  initAuth: async () => {
    if (get().initialized) return;
    const configured = isSupabaseConfigured();
    set({ configured });

    const supabase = getSupabase();
    if (!supabase) {
      if (get().isDemoMode) {
        useStore.getState().loadDemoData();
      }
      set({ initialized: true, loading: false });
      return;
    }

    set({ loading: true });

    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user) {
        const u = data.session.user;
        const authUser: AuthUser = { id: u.id, email: u.email ?? '', createdAt: u.created_at };
        set({ user: authUser, session: data.session });
        await onUserAuthenticated(u.id);
      } else if (get().isDemoMode) {
        useStore.getState().loadDemoData();
      } else {
        useStore.getState().clearData();
      }
    } catch (err: unknown) {
      console.warn('Supabase auth getSession notice:', err);
    } finally {
      set({ loading: false, initialized: true });
    }

    if (!listenerInitialized) {
      listenerInitialized = true;
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const u = session.user;
          const authUser: AuthUser = { id: u.id, email: u.email ?? '', createdAt: u.created_at };
          set({ user: authUser, session, error: null, loading: false });
          await onUserAuthenticated(u.id);
        } else {
          set({ user: null, session: null, loading: false });
          if (!get().isDemoMode) {
            useStore.getState().clearData();
          }
        }
      });
    }
  },

  signInWithPassword: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) {
      const msg = 'Supabase credentials are not configured in .env';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      const msg = 'Please enter both email and password.';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { ok: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = { id: data.user.id, email: data.user.email ?? '', createdAt: data.user.created_at };
        set({ user: authUser, session: data.session, loading: false, error: null });
        await onUserAuthenticated(data.user.id);
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      set({ error: msg, loading: false });
      return { ok: false, error: msg };
    }
  },

  signUpWithPassword: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) {
      const msg = 'Supabase credentials are not configured in .env';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      const msg = 'Please enter both email and password.';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { ok: false, error: error.message };
      }

      if (data.session?.user) {
        const u = data.session.user;
        const authUser: AuthUser = { id: u.id, email: u.email ?? '', createdAt: u.created_at };
        set({ user: authUser, session: data.session, loading: false, error: null });
        await onUserAuthenticated(u.id);
        return { ok: true, message: 'Account created and signed in!' };
      }

      set({ loading: false, error: null });
      return {
        ok: true,
        message: 'Account created! Please check your email to confirm your registration.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed. Please try again.';
      set({ error: msg, loading: false });
      return { ok: false, error: msg };
    }
  },

  sendMagicLink: async (email) => {
    const supabase = getSupabase();
    if (!supabase) {
      const msg = 'Supabase credentials are not configured in .env';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const msg = 'Please enter your email address.';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    set({ loading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('auth');
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { ok: false, error: error.message };
      }

      set({ loading: false, error: null });
      return {
        ok: true,
        message: 'Magic link sent! Check your inbox or enter the 6-digit code below.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send magic link.';
      set({ error: msg, loading: false });
      return { ok: false, error: msg };
    }
  },

  verifyOtp: async (email, token) => {
    const supabase = getSupabase();
    if (!supabase) {
      const msg = 'Supabase credentials are not configured in .env';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    const cleanEmail = email.trim();
    const cleanToken = token.trim();
    if (!cleanEmail || !cleanToken) {
      const msg = 'Please enter both your email and the 6-digit code.';
      set({ error: msg });
      return { ok: false, error: msg };
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { ok: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = { id: data.user.id, email: data.user.email ?? '', createdAt: data.user.created_at };
        set({ user: authUser, session: data.session, loading: false, error: null });
        await onUserAuthenticated(data.user.id);
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed.';
      set({ error: msg, loading: false });
      return { ok: false, error: msg };
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    set({ loading: true });
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem('pickle_demo_preview');
      } catch {}
    }
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      set({ user: null, session: null, isDemoMode: false, loading: false, error: null });
      useStore.getState().clearData();
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-out failed.';
      set({ error: msg, loading: false });
      return { ok: false, error: msg };
    }
  },
}));

/** Convenient hook for components without calling Supabase client directly */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const configured = useAuthStore((s) => s.configured);
  const initialized = useAuthStore((s) => s.initialized);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const enableDemoMode = useAuthStore((s) => s.enableDemoMode);
  const exitDemoMode = useAuthStore((s) => s.exitDemoMode);
  const initAuth = useAuthStore((s) => s.initAuth);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUpWithPassword = useAuthStore((s) => s.signUpWithPassword);
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    user,
    session,
    loading,
    error,
    configured,
    initialized,
    isDemoMode,
    enableDemoMode,
    exitDemoMode,
    initAuth,
    signInWithPassword,
    signUpWithPassword,
    sendMagicLink,
    verifyOtp,
    signOut,
    clearError,
  };
}
