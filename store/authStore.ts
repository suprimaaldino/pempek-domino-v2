'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  setUser: (user: User | null, adminEmail?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  error: null,
  setUser: (user, adminEmail) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    isAdmin: !!user && !!adminEmail && user.email === adminEmail,
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
