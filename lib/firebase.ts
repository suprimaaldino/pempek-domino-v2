import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton — prevent re-initialization during hot reload
function getAppInstance(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

/**
 * Lazy proxy: only used when config is missing (e.g. `next build` collect).
 * At runtime with NEXT_PUBLIC_* set we export the REAL instances so
 * `collection(db, …)` / `instanceof` checks never see a Proxy.
 */
function lazyProxy<T extends object>(factory: () => T): T {
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

/** Real instance when config exists; otherwise a lazy proxy (build-safe). */
function clientHandle<T extends object>(factory: () => T): T {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      return factory();
    } catch {
      // fall through to proxy
    }
  }
  return lazyProxy(factory);
}

/**
 * Firebase client handles.
 * Real instances at runtime (no Proxy in `collection(db, …)`);
 * lazy proxy only so `next build` can import this module without env.
 */
export const db = clientHandle<Firestore>(() => getFirestore(getAppInstance()));
export const auth = clientHandle<Auth>(() => getAuth(getAppInstance()));
export const storage = clientHandle<FirebaseStorage>(() => getStorage(getAppInstance()));

export let analytics: Analytics | undefined;
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    analytics = getAnalytics(getAppInstance());
  } catch {
    analytics = undefined;
  }
}

export default getAppInstance;
