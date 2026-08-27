import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  console.error('[AUTH] Missing ADMIN_EMAIL environment variable');
}

// Rate limiting
// NOTE: In-memory rate limiting resets on serverless cold starts.
// Firebase Auth itself enforces 5 login attempts per hour per email,
// so this serves as an additional defense-in-depth layer.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetTime) {
    attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export async function POST(req: NextRequest) {
  // Get client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(ip);
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

    if (!expectedUsername || !passwordHash || !ADMIN_EMAIL) {
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

    // Sign in with Firebase Auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      const token = await userCredential.user.getIdToken();

      // Reset rate limit on successful login
      attempts.delete(ip);

      // Set HTTP-only cookie (24 hours — reduced from 7 days for security)
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'firebaseAuthToken',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
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
