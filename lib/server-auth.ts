/**
 * Server-side verification of a Firebase ID token via the Identity Toolkit
 * REST API. Edge-safe (fetch only) — shared by middleware.ts and
 * /api/admin/verify so the logic exists in exactly one place.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || !token) return false;

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
    return !!(data.users && data.users.length > 0);
  } catch {
    return false;
  }
}
