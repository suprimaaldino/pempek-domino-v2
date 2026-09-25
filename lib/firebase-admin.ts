/**
 * Server-side Firebase Admin SDK initialization.
 * Reads service account from FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).
 * Lazy singletons — safe during `next build` (no env) and hot reload in dev.
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

let app: App | null = null;
let storage: Storage | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function getApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

export function getAdminStorage(): Storage {
  if (!storage) storage = getStorage(getApp());
  return storage;
}

export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getApp());
  return db;
}

/**
 * Loaded on demand, never at module scope: the auth entry point eagerly pulls
 * jwks-rsa → jose (ESM-only), which throws ERR_REQUIRE_ESM on runtimes without
 * require(esm) (Vercel's Rust Node runtime) and would break every route.
 */
export async function getAdminAuth(): Promise<Auth> {
  if (!auth) {
    const { getAuth } = await import('firebase-admin/auth');
    auth = getAuth(getApp());
  }
  return auth;
}

/** Prefer getAdminDb() in new code; kept for existing call sites. */
function adminProxy<T extends object>(factory: () => T): T {
  let cached: T | null = null;
  const ensure = (): T => {
    if (!cached) cached = factory();
    return cached;
  };
  return new Proxy({} as T, {
    get(_t, prop) {
      const target = ensure();
      const value = Reflect.get(target as object, prop);
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value;
    },
    set(_t, prop, value) {
      return Reflect.set(ensure() as object, prop, value);
    },
    has(_t, prop) {
      return Reflect.has(ensure() as object, prop);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(ensure() as object);
    },
    ownKeys() {
      return Reflect.ownKeys(ensure() as object);
    },
    getOwnPropertyDescriptor(_t, prop) {
      return Reflect.getOwnPropertyDescriptor(ensure() as object, prop);
    },
  });
}

export const adminDb = adminProxy<Firestore>(() => getAdminDb());
export const adminStorage = adminProxy<Storage>(() => getAdminStorage());

export default getApp;
