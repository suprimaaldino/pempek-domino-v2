'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  return { user, isAuthenticated, isLoading };
}
