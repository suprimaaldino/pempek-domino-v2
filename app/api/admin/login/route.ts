import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

// Firebase client/admin imports are deferred to the success path so
// `next build` can collect this route without FIREBASE_* env vars.

// Rate limiting via shared helper.
// NOTE: In-memory rate limiting resets on serverless cold starts.
// Firebase Auth itself enforces 5 login attempts per hour per email,
// so this serves as an additional defense-in-depth layer.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_BUCKET = 'admin-login';

export async function POST(req: NextRequest) {
  // Get client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(RATE_BUCKET, ip, MAX_ATTEMPTS, WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    );
  }

  try {
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!expectedUsername || !passwordHash || !adminEmail) {
      console.error('[AUTH] Server configuration error: Missing env variables');
      return NextResponse.json(
        { error: 'Server error. Hubungi administrator.' },
        { status: 500 }
      );
    }

    // Validate username — generic message to prevent username enumeration
    const usernameValid = username === expectedUsername;
    if (!usernameValid) {
      console.log('[AUTH] Failed login attempt from IP:', ip);
      return NextResponse.json(
        { error: 'Kredensial tidak valid.' },
        { status: 401 }
      );
    }

    // Validate password with bcrypt — generic message
    const passwordValid = await bcrypt.compare(password, passwordHash);
    if (!passwordValid) {
      console.log('[AUTH] Failed login attempt (wrong password) from IP:', ip);
      return NextResponse.json(
        { error: 'Kredensial tidak valid.' },
        { status: 401 }
      );
    }

    // Sign in with Firebase Auth + stamp admin custom claim for Firestore rules
    try {
      // Dynamic imports: avoid loading Firebase SDKs at build/collect time
      const [{ signInWithEmailAndPassword }, { auth }, { adminAuth }] = await Promise.all([
        import('firebase/auth'),
        import('@/lib/firebase'),
        import('@/lib/firebase-admin'),
      ]);
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);

      // Custom claim `admin: true` → required by firestore.rules isAdmin()
      await adminAuth.setCustomUserClaims(userCredential.user.uid, { admin: true });

      // Force refresh so the ID token includes the new claim
      const token = await userCredential.user.getIdToken(true);

      // Reset rate limit on successful login
      resetRateLimit(RATE_BUCKET, ip);

      // Set HTTP-only cookie (aligned with typical ID token lifetime + margin)
      const response = NextResponse.json({ success: true, adminEmail });
      response.cookies.set({
        name: 'firebaseAuthToken',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours — middleware re-verifies token validity
        path: '/',
      });

      return response;
    } catch (firebaseErr: unknown) {
      const errCode = (firebaseErr && typeof firebaseErr === 'object' && 'code' in firebaseErr)
        ? (firebaseErr as { code: unknown }).code
        : 'unknown';
      console.error('[AUTH] Firebase error:', errCode);
      return NextResponse.json(
        { error: 'Gagal login. Coba lagi nanti.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[AUTH] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Coba lagi.' },
      { status: 500 }
    );
  }
}
