import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Login admin via secure API route, then sync client-side Firebase Auth.
 * Password verification happens server-side to prevent hash exposure.
 * After server confirms credentials, we also sign in on the client so
 * the client-side onAuthStateChanged listener fires correctly.
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

  // Server auth succeeded — now sign in on the client so the
  // Firebase Auth state listener (onAuthStateChanged) fires with a user.
  // The password was already transmitted over HTTPS to our API,
  // so sending it to Firebase Auth (also HTTPS) is safe here.
  if (data.adminEmail) {
    await signInWithEmailAndPassword(auth, data.adminEmail, password);
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
 * Customer sign-in with Google (optional / soft-auth).
 *
 * Uses the same Firebase Auth instance as the admin flow. This is deliberately
 * non-blocking: callers should `try/catch` and continue as a guest if it fails
 * or is cancelled. It never clears client cart/order state (that lives in the
 * separate orderStore, which is untouched by auth).
 *
 * Returns the authenticated Firebase user, or null if the user cancelled.
 */
export async function signInWithGoogleCustomer(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  } catch (err: unknown) {
    // If the user closed the popup or cancelled, treat as a graceful no-op.
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: unknown }).code === 'auth/popup-closed-by-user'
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * Sign out the current customer session.
 * Does not touch the guest order store, so in-progress cart/order state survives.
 */
export async function logoutCustomer(): Promise<void> {
  await signOut(auth);
}

/**
 * Get the current authenticated user (synchronous snapshot).
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get a fresh Firebase ID token for the currently signed-in user (customer).
 * Returns null if no user is signed in. Used to authenticate customer API routes.
 */
export async function getFirebaseToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
