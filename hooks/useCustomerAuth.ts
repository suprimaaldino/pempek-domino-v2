'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { CustomerProfile } from '@/store/authStore';

/**
 * Syncs the Firebase auth state into the customer authStore on mount and
 * whenever it changes. When a user signs in, it attempts to load/create their
 * users/{uid} account record (Phase 2) and stores the lightweight profile.
 *
 * This is deliberately soft-auth: if anything fails, we simply keep the
 * Firebase-level user (uid/email/name) so the UI can still prefill and stamp
 * order ownership; guests (no user) are left untouched.
 */
export function useCustomerAuth(): void {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const base: CustomerProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        name: firebaseUser.displayName ?? null,
        phone: null,
      };
      setUser(base);

      // Best-effort: load the canonical users/{uid} record to get a stamped phone.
      try {
        const profile = await getOrCreateUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        });
        setUser({
          ...base,
          name: profile?.name ?? base.name,
          phone: profile?.phone ?? base.phone,
        });
      } catch {
        // Keep the Firebase-level profile; account creation is best-effort.
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
}
