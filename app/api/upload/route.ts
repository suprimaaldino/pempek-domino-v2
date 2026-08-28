import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const storagePath = formData.get('storagePath') as string | null;

    if (!file || !storagePath) {
      return NextResponse.json({ error: 'File dan storage path wajib diisi.' }, { status: 400 });
    }

    // Only allow known storage paths
    const ALLOWED_PATHS = ['payment-proofs', 'products', 'qris'];
    if (!ALLOWED_PATHS.includes(storagePath)) {
      return NextResponse.json({ error: 'Storage path tidak valid.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan JPG, PNG, atau WebP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, { status: 400 });
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const fileName = `${Date.now()}-${sanitizedName}`;
    const fullPath = `${storagePath}/${fileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage via Admin SDK (no CORS issues — server-side)
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fullPath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    // Make publicly readable (or use a signed URL)
    await fileRef.makePublic();

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media`;

    return NextResponse.json({ url: downloadUrl, path: fullPath });
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    return NextResponse.json({ error: 'Gagal mengupload file.' }, { status: 500 });
  }
}
