import {
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Login admin via secure API route.
 * Password verification happens server-side to prevent hash exposure.
 */
export async function loginAdmin(username: string, password: string): Promise<void> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login gagal. Periksa kembali username dan password.');
  }
}

/**
 * Sign out the current admin session.
 */
export async function logoutAdmin(): Promise<void> {
  // Call API to clear HTTP-only cookie
  await fetch('/api/admin/logout', { method: 'POST' });
  // Also sign out from Firebase client
  await signOut(auth);
}

/**
 * Get the current authenticated user (synchronous snapshot).
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
