/**
 * @jest-environment node
 */
/// <reference types="jest" />

/**
 * Unit tests for lib/server-auth.ts
 *
 * middleware.ts verifies the admin token on every /admin/* and /api/* request,
 * so each verification used to be a live Identity Toolkit round-trip. The
 * result is now cached for a short TTL. These tests pin the cache behaviour
 * (one lookup per window, negatives cached, TTL expiry) and the authorization
 * rule that only ADMIN_EMAIL counts as admin.
 */

import {
  verifyAdminToken,
  getUidFromToken,
  __resetTokenCache,
} from '@/lib/server-auth';

const API_KEY = 'test-api-key';

function mockLookup(users: Array<{ localId: string; email: string }>) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ users }),
  });
}

describe('server-auth token verification', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    __resetTokenCache();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = API_KEY;
    process.env.ADMIN_EMAIL = 'admin@test.local';
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  // ─── Caching ────────────────────────────────────────────────────────────

  test('performs one lookup for repeated requests with the same token', async () => {
    const fetchMock = mockLookup([{ localId: 'uid-1', email: 'admin@test.local' }]);
    global.fetch = fetchMock as unknown as typeof fetch;

    for (let i = 0; i < 5; i++) {
      expect(await verifyAdminToken('token-a')).toBe(true);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('caches different tokens separately', async () => {
    const fetchMock = mockLookup([{ localId: 'uid-1', email: 'admin@test.local' }]);
    global.fetch = fetchMock as unknown as typeof fetch;

    await verifyAdminToken('token-a');
    await verifyAdminToken('token-b');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('caches negative results so bad tokens do not hammer Google', async () => {
    const fetchMock = mockLookup([]);
    global.fetch = fetchMock as unknown as typeof fetch;

    for (let i = 0; i < 3; i++) {
      expect(await verifyAdminToken('bad-token')).toBe(false);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('re-verifies once the cache TTL expires', async () => {
    const fetchMock = mockLookup([{ localId: 'uid-1', email: 'admin@test.local' }]);
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.useFakeTimers();

    try {
      await verifyAdminToken('token-a');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Just inside the 5-minute TTL — still cached.
      jest.advanceTimersByTime(5 * 60 * 1000 - 1000);
      await verifyAdminToken('token-a');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Past the TTL — re-verified.
      jest.advanceTimersByTime(2000);
      await verifyAdminToken('token-a');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  test('uses the Identity Toolkit lookup endpoint with the API key', async () => {
    const fetchMock = mockLookup([{ localId: 'uid-1', email: 'admin@test.local' }]);
    global.fetch = fetchMock as unknown as typeof fetch;

    await verifyAdminToken('token-a');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ idToken: 'token-a' });
  });

  // ─── Authorization ──────────────────────────────────────────────────────

  test('verifyAdminToken accepts the configured admin email', async () => {
    global.fetch = mockLookup([
      { localId: 'uid-1', email: 'admin@test.local' },
    ]) as unknown as typeof fetch;
    expect(await verifyAdminToken('token-a')).toBe(true);
  });

  test('verifyAdminToken rejects an authenticated non-admin user', async () => {
    global.fetch = mockLookup([
      { localId: 'uid-2', email: 'customer@example.com' },
    ]) as unknown as typeof fetch;
    expect(await verifyAdminToken('token-a')).toBe(false);
  });

  test('verifyAdminToken returns false when ADMIN_EMAIL is unset', async () => {
    delete process.env.ADMIN_EMAIL;
    const fetchMock = mockLookup([{ localId: 'uid-1', email: 'admin@test.local' }]);
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await verifyAdminToken('token-a')).toBe(false);
    // Must not even attempt a lookup with incomplete configuration.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('verifyAdminToken returns false for an empty token or missing API key', async () => {
    const fetchMock = mockLookup([]);
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await verifyAdminToken('')).toBe(false);
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    expect(await verifyAdminToken('token-a')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = API_KEY;
  });

  // ─── getUidFromToken ────────────────────────────────────────────────────

  test('getUidFromToken returns the uid for any valid user, admin or not', async () => {
    global.fetch = mockLookup([
      { localId: 'customer-uid', email: 'customer@example.com' },
    ]) as unknown as typeof fetch;
    expect(await getUidFromToken('token-c')).toBe('customer-uid');
  });

  test('getUidFromToken shares the cache with verifyAdminToken', async () => {
    const fetchMock = mockLookup([
      { localId: 'customer-uid', email: 'admin@test.local' },
    ]);
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await verifyAdminToken('token-x')).toBe(true);
    expect(await getUidFromToken('token-x')).toBe('customer-uid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('returns null when the lookup fails outright', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    expect(await getUidFromToken('token-a')).toBeNull();
  });

  test('returns null when the response is not ok', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;
    expect(await getUidFromToken('token-a')).toBeNull();
  });

  test('returns null when localId is missing or not a string', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ email: 'a@b.c' }] }),
    }) as unknown as typeof fetch;
    expect(await getUidFromToken('token-a')).toBeNull();
  });

  test('tolerates a user with no email field', async () => {
    global.fetch = mockLookup([{ localId: 'uid-3', email: '' }]) as unknown as typeof fetch;
    expect(await getUidFromToken('token-a')).toBe('uid-3');
    // An admin check with a different configured email must fail.
    expect(await verifyAdminToken('token-a')).toBe(false);
  });
});
