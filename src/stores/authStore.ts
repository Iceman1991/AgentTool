import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, setUserId } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  authLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    setUserId(user?.id ?? null);
    set({ user, session, authLoading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      set({ user, session });
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    setUserId(null);
    set({ user: null, session: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error ? error.message : null;
  },
}));
