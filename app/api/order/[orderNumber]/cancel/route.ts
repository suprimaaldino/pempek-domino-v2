import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNumber, cancelOrder } from '@/lib/firestore';

/**
 * Public API route for order cancellation by order number.
 * Only allows cancellation of orders with 'pending' status.
 * Rate limited to prevent abuse.
 */
const cancelAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_CANCEL = 5;
const WINDOW_MS = 60 * 1000;

function checkCancelRateLimit(key: string): boolean {
  const now = Date.now();
  const record = cancelAttempts.get(key);
  if (!record || now > record.resetTime) {
    cancelAttempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_CANCEL) return false;
  record.count++;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') || 'unknown';

  if (!checkCancelRateLimit(ip)) {
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

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Pesanan yang sudah diproses tidak dapat dibatalkan.' },
        { status: 400 }
      );
    }

    await cancelOrder(order.id);

    return NextResponse.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
  } catch (error) {
    console.error('[ORDER_CANCEL] Error:', error);
    const message = error instanceof Error ? error.message : 'Gagal membatalkan pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
