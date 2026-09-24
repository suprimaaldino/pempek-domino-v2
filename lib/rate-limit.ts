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
  const record = map.get(key);

  if (!record || now > record.resetTime) {
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
