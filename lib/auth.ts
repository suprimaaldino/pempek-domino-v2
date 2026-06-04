import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = 'suprimaaldino@gmail.com';

/**
 * Login admin with username + plaintext password.
 * 1. Validates username against env
 * 2. bcrypt-verifies password against stored hash
 * 3. Signs in with Firebase Auth
 */
export async function loginAdmin(
  username: string,
  password: string
): Promise<void> {
  const expectedUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'yangpunyapempekdomino';
  const passwordHash = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH || '';

  // Debug: log environment variable status (don't log the actual hash)
  console.log('[AUTH] Username check:', { expected: expectedUsername, received: username, match: username === expectedUsername });
  console.log('[AUTH] Password hash exists:', !!passwordHash, 'length:', passwordHash.length);

  if (username !== expectedUsername) {
    console.error('[AUTH] Username mismatch', { expected: expectedUsername, received: username });
    throw new Error('Username atau password salah.');
  }

  if (!passwordHash) {
    console.error('[AUTH] CRITICAL: Password hash not set in environment variables');
    throw new Error('Server error: Admin credentials not configured. Contact administrator.');
  }

  try {
    const valid = await bcrypt.compare(password, passwordHash);
    console.log('[AUTH] Bcrypt verification result:', valid);
    if (!valid) {
      console.error('[AUTH] Bcrypt validation failed - password incorrect');
      throw new Error('Username atau password salah.');
    }
  } catch (bcryptErr: any) {
    console.error('[AUTH] Bcrypt error:', bcryptErr.message);
    throw new Error('Server error: Authentication service unavailable. Please try again.');
  }

  await setPersistence(auth, browserLocalPersistence);
  try {
    console.log('[AUTH] Attempting Firebase sign-in with email:', ADMIN_EMAIL);
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
    console.log('[AUTH] Firebase sign-in successful');
  } catch (firebaseErr: any) {
    console.error('[AUTH] Firebase sign in failed:', firebaseErr.code, firebaseErr.message);
    // Map Firebase errors to user-friendly messages
    if (firebaseErr.code === 'auth/user-not-found') {
      throw new Error('Admin account not found in Firebase. Contact administrator.');
    }
    if (firebaseErr.code === 'auth/wrong-password') {
      throw new Error('Username atau password salah.');
    }
    throw new Error('Login gagal. Periksa kembali username dan password.');
  }
}

/**
 * Sign out the current admin session.
 */
export async function logoutAdmin(): Promise<void> {
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
