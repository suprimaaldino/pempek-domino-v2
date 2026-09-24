import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { verifyAdminToken } from '@/lib/server-auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Guest checkout may upload payment proofs without an admin session.
// Product / QRIS images are admin-only.
const ADMIN_ONLY_PATHS = ['products', 'qris'];
const ALLOWED_PATHS = ['payment-proofs', 'products', 'qris'];

// Lightweight in-memory rate limit for anonymous payment-proof uploads
// (resets on cold start — defense-in-depth only).
const uploadAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_UPLOADS = 10;
const WINDOW_MS = 60 * 1000;

function checkUploadRateLimit(key: string): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(key);
  if (!record || now > record.resetTime) {
    uploadAttempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_UPLOADS) return false;
  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const storagePath = formData.get('storagePath') as string | null;

    if (!file || !storagePath) {
      return NextResponse.json({ error: 'File dan storage path wajib diisi.' }, { status: 400 });
    }

    if (!ALLOWED_PATHS.includes(storagePath)) {
      return NextResponse.json({ error: 'Storage path tidak valid.' }, { status: 400 });
    }

    if (ADMIN_ONLY_PATHS.includes(storagePath)) {
      const token = req.cookies.get('firebaseAuthToken')?.value;
      if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';
      if (!checkUploadRateLimit(ip)) {
        return NextResponse.json(
          { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan JPG, PNG, atau WebP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, { status: 400 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const fileName = `${Date.now()}-${sanitizedName}`;
    const fullPath = `${storagePath}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fullPath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    await fileRef.makePublic();

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media`;

    return NextResponse.json({ url: downloadUrl, path: fullPath });
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    return NextResponse.json({ error: 'Gagal mengupload file.' }, { status: 500 });
  }
}
