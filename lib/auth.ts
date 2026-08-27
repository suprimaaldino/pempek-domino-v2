import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const googleProvider = new GoogleAuthProvider();

/**
 * Login with Google. Returns the authenticated user.
 * After login, check user.email === ADMIN_EMAIL to determine admin access.
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Check if the current user is an admin.
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !ADMIN_EMAIL) return false;
  return user.email === ADMIN_EMAIL;
}

/**
 * Get the admin email from environment.
 */
export function getAdminEmail(): string | undefined {
  return ADMIN_EMAIL;
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<void> {
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
