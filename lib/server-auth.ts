/**
 * Server-side verification of a Firebase ID token via the Identity Toolkit
 * REST API. Edge-safe (fetch only) — shared by middleware.ts and
 * /api/admin/verify so the logic exists in exactly one place.
 *
 * Also verifies that the authenticated user is the designated admin
 * by checking the email against the ADMIN_EMAIL environment variable.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!apiKey || !token || !adminEmail) return false;

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!res.ok) return false;

    const data = await res.json();
    if (!data.users || data.users.length === 0) return false;

    // Verify the user is the designated admin
    const user = data.users[0];
    return user.email === adminEmail;
  } catch {
    return false;
  }
}

/**
 * Verify a Firebase ID token and return the authenticated user's uid, or null
 * if invalid. Unlike verifyAdminToken, this does NOT check the admin email —
 * it authenticates any valid Firebase user (used for customer-facing routes).
 * Edge-safe (fetch only), shared with customer API routes.
 */
export async function getUidFromToken(token: string): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || !token) return null;

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.users || data.users.length === 0) return null;

    const user = data.users[0];
    return typeof user.localId === 'string' ? user.localId : null;
  } catch {
    return null;
  }
}
