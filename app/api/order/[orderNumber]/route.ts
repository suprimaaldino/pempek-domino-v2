import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNumber } from '@/lib/firestore';

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
    const order = await getOrderByOrderNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Return sanitized order data (expose only what customers need)
    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      deliveryMethod: order.deliveryMethod,
      pickupDateTime: order.pickupDateTime,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      notes: order.notes,
      createdAt: order.createdAt,
      paymentProofUrl: order.paymentProofUrl,
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
