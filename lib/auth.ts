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

  console.log('Login attempt:', {
    username,
    expectedUsername,
    hasPasswordHash: !!passwordHash,
    passwordHash,
  });

  if (username !== expectedUsername) {
    console.error('Username mismatch');
    throw new Error('Username atau password salah.');
  }

  if (passwordHash) {
    const valid = await bcrypt.compare(password, passwordHash);
    console.log('Bcrypt verification result:', valid);
    if (!valid) {
      console.error('Bcrypt validation failed');
      throw new Error('Username atau password salah.');
    }
  }

  await setPersistence(auth, browserLocalPersistence);
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  } catch (firebaseErr: any) {
    console.error('Firebase sign in failed:', firebaseErr);
    throw firebaseErr;
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
