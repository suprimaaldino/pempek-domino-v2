/**
 * Server-side Firebase Admin SDK initialization.
 * Reads service account from FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).
 * Singleton pattern — safe for hot reload in development.
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApps()[0];
}

export const adminStorage = getStorage(app);
export const adminDb = getFirestore(app);
export default app;
