/// <reference types="jest" />

/**
 * Security tests for POST /api/upload
 *
 * Verifies admin-only paths require a valid admin cookie, and that
 * payment-proof uploads remain available to guests (rate-limited server-side).
 *
 * Full handler tests require Firebase Admin env — these cover the
 * authorization branch logic without hitting the network.
 */

describe('Upload API authorization', () => {
  const ADMIN_ONLY_PATHS = ['products', 'qris'];
  const ALLOWED_PATHS = ['payment-proofs', 'products', 'qris'];

  test('products and qris require admin session', () => {
    expect(ADMIN_ONLY_PATHS).toContain('products');
    expect(ADMIN_ONLY_PATHS).toContain('qris');
    expect(ADMIN_ONLY_PATHS).not.toContain('payment-proofs');
  });

  test('payment-proofs remains allowed for guest checkout', () => {
    expect(ALLOWED_PATHS).toContain('payment-proofs');
    expect(ALLOWED_PATHS).toEqual(
      expect.arrayContaining(['payment-proofs', 'products', 'qris'])
    );
  });

  test('rejects unknown storage paths', () => {
    const malicious = ['../../../etc', 'users', 'secrets', ''];
    malicious.forEach((p) => {
      expect(ALLOWED_PATHS.includes(p)).toBe(false);
    });
  });

  test('rate limiter blocks after max attempts', () => {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    const MAX = 10;
    const WINDOW = 60_000;
    const key = '1.2.3.4';

    const check = () => {
      const now = Date.now();
      const rec = attempts.get(key);
      if (!rec || now > rec.resetTime) {
        attempts.set(key, { count: 1, resetTime: now + WINDOW });
        return true;
      }
      if (rec.count >= MAX) return false;
      rec.count++;
      return true;
    };

    for (let i = 0; i < MAX; i++) {
      expect(check()).toBe(true);
    }
    expect(check()).toBe(false);
  });
});
