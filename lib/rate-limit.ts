/**
 * Shared in-memory rate limiter for API routes.
 *
 * NOTE: Resets on serverless cold starts. Suitable as defense-in-depth only;
 * pair with Firebase Auth throttles or an external store (KV) for production
 * hard limits. Extracted to remove duplication across routes.
 */

interface RateRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateRecord>>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Bound the number of tracked keys. Keys are attacker-controlled (one per
 * source IP), so without a cap a long-lived process grows without limit.
 */
const MAX_KEYS_PER_BUCKET = 10_000;

/** Only sweep every N calls to keep the common path O(1). */
const SWEEP_INTERVAL = 100;
let callsSinceSweep = 0;

/** Drop expired records so finished windows do not occupy memory forever. */
function sweep(now: number): void {
  stores.forEach((map) => {
    map.forEach((record, key) => {
      if (now > record.resetTime) map.delete(key);
    });
  });
}

/**
 * Fixed-window rate limit keyed by `bucket:key`.
 * Creates a new window when missing or expired.
 */
export function checkRateLimit(
  bucket: string,
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  let map = stores.get(bucket);
  if (!map) {
    map = new Map();
    stores.set(bucket, map);
  }

  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_INTERVAL) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const record = map.get(key);

  if (!record || now > record.resetTime) {
    // Fail closed once the bucket is saturated by distinct keys.
    if (map.size >= MAX_KEYS_PER_BUCKET) {
      return { allowed: false, remaining: 0 };
    }
    map.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
}

/** Clear a key (e.g. after successful login). */
export function resetRateLimit(bucket: string, key: string): void {
  stores.get(bucket)?.delete(key);
}

/** Test-only: drop all tracked windows. */
export function __resetRateLimits(): void {
  stores.clear();
  callsSinceSweep = 0;
}
