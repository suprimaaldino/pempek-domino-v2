'use client';

import { create } from 'zustand';

export interface CustomerProfile {
  uid: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}

interface AuthState {
  user: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: CustomerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePhone: (phone: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updatePhone: (phone) =>
    set((state) => ({
      user: state.user ? { ...state.user, phone } : state.user,
    })),
}));
