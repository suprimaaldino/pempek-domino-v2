import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('firebaseAuthToken')?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({ authenticated: true });
}
