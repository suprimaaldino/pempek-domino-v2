import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Rate limiting for public order lookup
const lookupAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOOKUPS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkLookupRateLimit(key: string): boolean {
  const now = Date.now();
  const record = lookupAttempts.get(key);

  if (!record || now > record.resetTime) {
    lookupAttempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_LOOKUPS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Public API route for order lookup by order number.
 * Returns sanitized order data (excludes sensitive fields).
 * Rate limited to prevent abuse.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Rate limit
  if (!checkLookupRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { orderNumber } = params;

  if (!orderNumber || typeof orderNumber !== 'string') {
    return NextResponse.json(
      { error: 'Nomor pesanan tidak valid.' },
      { status: 400 }
    );
  }

  try {
    // Look up orderId from orderLookups collection
    const normalized = orderNumber.toUpperCase().trim();
    const lookupSnap = await adminDb.collection('orderLookups').doc(normalized).get();

    if (!lookupSnap.exists) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const orderId = lookupSnap.data()?.orderId as string | undefined;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Get order document
    const orderSnap = await adminDb.collection('orders').doc(orderId).get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const data = orderSnap.data()!;

    // Return sanitized order data (expose only what customers need)
    return NextResponse.json({
      orderNumber: data.orderNumber,
      status: data.status,
      paymentStatus: data.paymentStatus,
      customerName: data.customerName,
      deliveryMethod: data.deliveryMethod,
      pickupDateTime: data.pickupDateTime,
      items: data.items,
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      total: data.total,
      notes: data.notes,
      createdAt: data.createdAt,
      paymentProofUrl: data.paymentProofUrl,
      // Excluded: whatsappNumber, deliveryAddress (sensitive)
    });
  } catch (error) {
    console.error('[ORDER_LOOKUP] Error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data pesanan.' },
      { status: 500 }
    );
  }
}
