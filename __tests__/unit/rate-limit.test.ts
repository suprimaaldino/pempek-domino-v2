/// <reference types="jest" />

/**
 * Unit tests for lib/rate-limit.ts
 *
 * The limiter previously never removed finished windows, so every distinct
 * source IP added a permanent entry — unbounded growth in a long-lived
 * process. These tests pin the window behaviour, the eviction sweep and the
 * per-bucket size cap.
 */

import {
  checkRateLimit,
  resetRateLimit,
  __resetRateLimits,
} from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    __resetRateLimits();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests up to the limit and blocks the next one', () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit('b', 'ip', 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit('b', 'ip', 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test('reports remaining attempts', () => {
    expect(checkRateLimit('b', 'ip', 3, 60_000).remaining).toBe(2);
    expect(checkRateLimit('b', 'ip', 3, 60_000).remaining).toBe(1);
    expect(checkRateLimit('b', 'ip', 3, 60_000).remaining).toBe(0);
  });

  test('starts a fresh window once the previous one expires', () => {
    checkRateLimit('b', 'ip', 1, 60_000);
    expect(checkRateLimit('b', 'ip', 1, 60_000).allowed).toBe(false);

    jest.advanceTimersByTime(60_001);
    expect(checkRateLimit('b', 'ip', 1, 60_000).allowed).toBe(true);
  });

  test('keys are independent within a bucket', () => {
    expect(checkRateLimit('b', 'ip-a', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('b', 'ip-b', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('b', 'ip-a', 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit('b', 'ip-b', 1, 60_000).allowed).toBe(false);
  });

  test('buckets are independent of each other', () => {
    expect(checkRateLimit('login', 'ip', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('upload', 'ip', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('login', 'ip', 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit('upload', 'ip', 1, 60_000).allowed).toBe(false);
  });

  test('resetRateLimit clears a single key', () => {
    checkRateLimit('b', 'ip-a', 1, 60_000);
    checkRateLimit('b', 'ip-b', 1, 60_000);
    expect(checkRateLimit('b', 'ip-a', 1, 60_000).allowed).toBe(false);

    resetRateLimit('b', 'ip-a');
    expect(checkRateLimit('b', 'ip-a', 1, 60_000).allowed).toBe(true);
    // The sibling key is untouched.
    expect(checkRateLimit('b', 'ip-b', 1, 60_000).allowed).toBe(false);
  });

  test('resetRateLimit on an unknown key is a no-op', () => {
    expect(() => resetRateLimit('missing', 'ip')).not.toThrow();
  });

  test('fails closed once a bucket is saturated with distinct keys', () => {
    // 10_000 is the cap; the sweep runs every 100 calls but nothing has expired.
    for (let i = 0; i < 10_000; i++) {
      expect(checkRateLimit('flood', `ip-${i}`, 5, 3_600_000).allowed).toBe(true);
    }
    // Bucket is full — a brand new key must be rejected rather than allocated.
    expect(checkRateLimit('flood', 'one-too-many', 5, 3_600_000).allowed).toBe(false);
  });

  test('evicts expired keys so a long window does not leak memory', () => {
    // Fill the bucket past the cap with keys that then expire.
    for (let i = 0; i < 10_000; i++) {
      checkRateLimit('flood', `ip-${i}`, 5, 60_000);
    }
    expect(checkRateLimit('flood', 'blocked', 5, 3_600_000).allowed).toBe(false);

    // Let every window expire, then push past the sweep interval.
    jest.advanceTimersByTime(3_600_000);
    for (let i = 0; i < 150; i++) {
      checkRateLimit('flood', `fresh-${i}`, 5, 60_000);
    }
    // Sweep reclaimed the expired entries, so new keys are accepted again.
    expect(checkRateLimit('flood', 'after-sweep', 5, 3_600_000).allowed).toBe(true);
  });
});
