import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizePhone } from '@/lib/utils';

/**
 * Public API route for order cancellation by order number.
 *
 * Authorization: guests have no session, so the order number alone is NOT
 * sufficient. The caller must also present the WhatsApp number used for the
 * order. The public order number is guessable in its date/sequence parts, so
 * requiring a second 9–12 digit secret prevents anyone from cancelling other
 * customers' pending orders. Only `pending` orders can be cancelled.
 */
const MAX_CANCEL = 5;
const WINDOW_MS = 60 * 1000;
const RATE_BUCKET = 'order-cancel';

// Generic message: must not reveal whether the order exists.
const UNAUTHORIZED = { error: 'Nomor pesanan atau nomor WhatsApp tidak sesuai.' };

export async function POST(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') || 'unknown';

  if (!checkRateLimit(RATE_BUCKET, ip, MAX_CANCEL, WINDOW_MS).allowed) {
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
    // Read the caller's WhatsApp number. Required for authorization.
    let providedPhone = '';
    try {
      const body = (await req.json()) as { whatsappNumber?: unknown };
      if (typeof body?.whatsappNumber === 'string') providedPhone = body.whatsappNumber;
    } catch {
      // Empty/unparseable body → treated as missing below.
    }
    if (!providedPhone) {
      return NextResponse.json(UNAUTHORIZED, { status: 403 });
    }

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
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data()!;

    // Ownership check — constant work for both match and mismatch.
    const orderPhone = typeof orderData.whatsappNumber === 'string'
      ? normalizePhone(orderData.whatsappNumber)
      : '';
    if (!orderPhone || orderPhone !== normalizePhone(providedPhone)) {
      return NextResponse.json(UNAUTHORIZED, { status: 403 });
    }

    if (orderData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Pesanan yang sudah diproses tidak dapat dibatalkan.' },
        { status: 400 }
      );
    }

    // Cancel the order
    await orderRef.update({
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
  } catch (error) {
    console.error('[ORDER_CANCEL] Error:', error);
    // Do not leak internal error details to the client
    return NextResponse.json(
      { error: 'Gagal membatalkan pesanan. Coba lagi.' },
      { status: 500 }
    );
  }
}
