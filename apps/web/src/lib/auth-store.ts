'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

/**
 * Session state, persisted to localStorage so a refresh keeps you signed in.
 * (For a production app with stricter security needs, move the token to an httpOnly cookie.)
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'taskflow-session',
      partialize: ({ token, user }) => ({ token, user }),
      onRehydrateStorage: () => () => useAuth.setState({ hydrated: true }),
    },
  ),
);
