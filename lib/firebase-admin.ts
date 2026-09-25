/**
 * Server-side Firebase Admin SDK initialization.
 * Reads service account from FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).
 * Lazy singletons — safe during `next build` (no env) and hot reload in dev.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { App, ServiceAccount as FirebaseServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import type { Storage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { createSign } from 'node:crypto';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let app: App | null = null;
let storage: Storage | null = null;
let db: Firestore | null = null;
let serviceAccount: ServiceAccount | null = null;
let accessToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  if (serviceAccount) return serviceAccount;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!json) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }
  serviceAccount = JSON.parse(json) as ServiceAccount;
  return serviceAccount;
}

function getApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  app = initializeApp({
    credential: cert(getServiceAccount() as unknown as FirebaseServiceAccount),
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
 * Stamp `admin: true` on a user via the Identity Toolkit REST API.
 *
 * Deliberately not `firebase-admin/auth`: that entry point eagerly pulls
 * jwks-rsa → jose (ESM-only) and throws ERR_REQUIRE_ESM on runtimes without
 * require(esm) (Vercel's Rust Node runtime), which would break every route.
 * This is the same call the Admin SDK makes, minus the JWKS dependency.
 */
export async function setAdminClaim(uid: string): Promise<void> {
  const sa = getServiceAccount();
  const token = await getAccessToken(sa);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:update`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ admin: true }) }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to set admin claim: ${res.status} ${await res.text()}`);
  }
}

/** Service-account OAuth access token, reused until shortly before expiry. */
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (accessToken && accessToken.expiresAt > Date.now()) return accessToken.token;

  const issuedAt = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: issuedAt,
      exp: issuedAt + 3600,
    },
    sa.private_key
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  accessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(data.expires_in - 60, 0) * 1000,
  };
  return accessToken.token;
}

function signJwt(header: object, payload: object, privateKey: string): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${encode(header)}.${encode(payload)}`);
  return `${encode(header)}.${encode(payload)}.${signer.sign(privateKey, 'base64url')}`;
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
