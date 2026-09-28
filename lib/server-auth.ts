/**
 * Server-side verification of a Firebase ID token via the Identity Toolkit
 * REST API. Edge-safe (fetch only) — shared by middleware.ts and the API
 * routes so the logic exists in exactly one place.
 *
 * Also verifies that the authenticated user is the designated admin
 * by checking the email against the ADMIN_EMAIL environment variable.
 */

interface TokenLookup {
  uid: string;
  email: string | null;
}

/**
 * Verification results are cached because middleware.ts runs on *every*
 * /admin/* and /api/* request, and each Identity Toolkit round-trip costs a
 * network hop plus Google API quota.
 *
 * Safe because the cache TTL (5 min) is far shorter than the 1-hour Firebase
 * ID token lifetime, so a cached entry can never outlive the token it
 * describes. Negatives are cached too, which stops unauthenticated traffic
 * from hammering Google.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const cache = new Map<string, { at: number; result: TokenLookup | null }>();

/** Evict expired entries, then enforce the size cap (oldest-first). */
function pruneCache(now: number): void {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
  cache.forEach((entry, key) => {
    if (now - entry.at > CACHE_TTL_MS) cache.delete(key);
  });
}

/** Look up a token once per TTL window. Returns null for any invalid token. */
async function lookupIdToken(token: string): Promise<TokenLookup | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || !token) return null;

  const now = Date.now();
  const cached = cache.get(token);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.result;

  let result: TokenLookup | null = null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as {
        users?: Array<{ localId?: unknown; email?: unknown }>;
      };
      const user = data.users?.[0];
      if (user && typeof user.localId === 'string') {
        result = {
          uid: user.localId,
          email: typeof user.email === 'string' ? user.email : null,
        };
      }
    }
  } catch {
    result = null;
  }

  pruneCache(now);
  cache.set(token, { at: now, result });
  return result;
}

/**
 * Verify a Firebase ID token belongs to the designated admin.
 * Returns false for any missing config, invalid token, or non-admin account.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!token || !adminEmail) return false;

  const user = await lookupIdToken(token);
  return user !== null && user.email === adminEmail;
}

/**
 * Verify a Firebase ID token and return the authenticated user's uid, or null
 * if invalid. Unlike verifyAdminToken, this does NOT check the admin email —
 * it authenticates any valid Firebase user (used for customer-facing routes).
 * Edge-safe (fetch only), shared with customer API routes.
 */
export async function getUidFromToken(token: string): Promise<string | null> {
  const user = await lookupIdToken(token);
  return user ? user.uid : null;
}

/** Test-only: drop cached verification results. */
export function __resetTokenCache(): void {
  cache.clear();
}
