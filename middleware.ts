import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/server-auth';

const PROTECTED_PATHS = ['/admin'];
const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PATHS.some(
    (path) =>
      pathname.startsWith(path) &&
      !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))
  );

  if (isProtectedPath) {
    const authToken = request.cookies.get('firebaseAuthToken')?.value;

    if (!authToken || !(await verifyAdminToken(authToken))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
