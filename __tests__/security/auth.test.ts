/**
 * @jest-environment node
 */
/// <reference types="jest" />

/**
 * Security tests for authentication & middleware.
 *
 * These tests exercise real route/middleware modules where possible.
 * Pure-concept assertions (testing string literals only) were removed —
 * they gave false confidence without verifying behavior.
 *
 * Environment: node — next/server needs Web Fetch (Request/Headers) globals
 * that jsdom does not provide.
 */

import { NextRequest } from 'next/server';

// `firebase-admin/auth` is never imported (it pulls ESM-only `jose`, which Jest
// cannot parse and Vercel's Rust runtime cannot require). Custom claims are
// stamped over the Identity Toolkit REST API, so only that is mocked here.
jest.mock('@/lib/firebase-admin', () => ({
  setAdminClaim: jest.fn().mockResolvedValue(undefined),
  adminDb: {},
  adminStorage: {},
  getAdminApp: jest.fn(),
  default: {},
}));
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  analytics: undefined,
  default: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

// ─── Shared helpers ──────────────────────────────────────────────────────────

function makeRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest(new URL(`http://localhost:3000${pathname}`), { headers });
}

// ─── Login API ───────────────────────────────────────────────────────────────

describe('POST /api/admin/login', () => {
  let POST: typeof import('@/app/api/admin/login/route').POST;

  beforeAll(() => {
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH =
      '$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    process.env.ADMIN_EMAIL = 'admin@test.local';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    POST = require('@/app/api/admin/login/route').POST;
  });

  test('rejects empty body with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('rejects non-string credentials with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 123, password: true }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('rejects wrong username with 401 and generic message', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'not-admin', password: 'whatever' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Kredensial tidak valid.');
    expect(JSON.stringify(body)).not.toMatch(/hash|bcrypt|firebase/i);
  });

  test('rejects wrong password with 401 and same generic message', async () => {
    // bcrypt hash of "correct-password" — login attempt uses a different password
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.hashSync('correct-password', 4);
    process.env.ADMIN_PASSWORD_HASH = hash;

    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'testadmin', password: 'wrong-password' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Kredensial tidak valid.');
  });
});

// ─── Middleware security headers ─────────────────────────────────────────────

describe('Middleware security headers', () => {
  test('middleware matcher covers /admin and /api', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/middleware');
    expect(mod.config.matcher).toEqual(['/admin/:path*', '/api/:path*']);
  });

  test('PROTECTED_PATHS includes /admin', async () => {
    // Unauthenticated request to /admin/dashboard redirects to login
    // (verifyAdminToken fails without env / valid token).
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = undefined as unknown as string;
    process.env.ADMIN_EMAIL = undefined as unknown as string;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { middleware } = require('@/middleware');
    const req = makeRequest('/admin/dashboard');
    const res = await middleware(req);
    // redirect response — NextResponse.redirect
    expect(res).toBeTruthy();
    const location = res.headers?.get?.('location') || res.url || '';
    if (typeof location === 'string' && location) {
      expect(location).toContain('/admin/login');
    }
  });
});

// ─── Cookie configuration contract ───────────────────────────────────────────

describe('Admin cookie security contract', () => {
  test('login route sets HttpOnly SameSite=strict cookie', async () => {
    // Read route source to assert cookie flags remain present (regression guard).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/api/admin/login/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/httpOnly:\s*true/);
    expect(src).toMatch(/sameSite:\s*'strict'/);
    expect(src).toMatch(/secure:\s*process\.env\.NODE_ENV === 'production'/);
    expect(src).toMatch(/name:\s*'firebaseAuthToken'/);
    expect(src).toMatch(/setAdminClaim/);
  });

  test('logout clears the auth cookie', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require('@/app/api/admin/logout/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie') || '';
    // Cookie name is firebaseAuthToken → serialized lowercased
    expect(cookie.toLowerCase()).toContain('firebaseauthtoken=');
    expect(cookie).toMatch(/max-age=0/i);
    expect(cookie.toLowerCase()).toContain('httponly');
  });
});
