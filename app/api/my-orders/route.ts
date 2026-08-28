import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUidFromToken } from '@/lib/server-auth';

/**
 * GET /api/my-orders
 * Returns the authenticated customer's own orders, scoped securely server-side.
 *
 * Authorization: the caller must present a valid Firebase ID token (Bearer).
 * Ownership is enforced by:
 *   - orders.userId === uid  (exact, authenticated orders)
 *   - OR orders.whatsappNumber === user.phone  (legacy phone-keyed linking,
 *     only surfaced to the authenticated account that owns that phone)
 *
 * This protects order history so a customer can never query another customer's
 * orders. Guest order-number lookups remain on the existing public route and
 * Firestore rules are NOT broadened here.
 */

// Loosely-typed order doc returned by the admin SDK. Fields we surface below
// are read via string keys; Firestore docs are inherently untyped.
interface OrderDoc {
  id: string;
  [key: string]: unknown;
}

/** Best-effort millisecond timestamp for a Firestore Timestamp or Date. */
function tsMillis(value: unknown): number {
  if (value && typeof value === 'object') {
    const v = value as { toMillis?: () => number; _seconds?: number; getTime?: () => number };
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v._seconds === 'number') return v._seconds * 1000;
    if (typeof v.getTime === 'function') return v.getTime();
  }
  return 0;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = await getUidFromToken(token);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Load the user's stamped phone for legacy linking.
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userPhone = userSnap.exists
      ? asString(userSnap.data()?.phone) ?? null
      : null;

    // Query orders owned by the authenticated uid.
    // (No orderBy to avoid composite-index requirements; sorted in-memory below.)
    const ownedSnap = await adminDb
      .collection('orders')
      .where('userId', '==', uid)
      .limit(100)
      .get();

    let orders = ownedSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as OrderDoc
    );

    // Legacy: also include phone-linked orders (if the account has a stamped phone).
    if (userPhone) {
      const legacySnap = await adminDb
        .collection('orders')
        .where('whatsappNumber', '==', userPhone)
        .limit(100)
        .get();
      const legacy = legacySnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as OrderDoc
      );

      // Merge and dedupe by id, preferring the userId-owned record.
      const byId = new Map<string, OrderDoc>();
      for (const o of legacy) byId.set(o.id, o);
      for (const o of orders) byId.set(o.id, o);
      orders = Array.from(byId.values()).sort(
        (a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt)
      );
    } else {
      orders.sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt));
    }

    // Return sanitized order data (never include deliveryAddress for security-parity
    // with the public lookup route, which also excludes whatsappNumber/address).
    const safeOrders = orders.map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return {
        id: o.id,
        orderNumber: asString(o.orderNumber),
        status: asString(o.status),
        paymentStatus: asString(o.paymentStatus),
        customerName: asString(o.customerName),
        deliveryMethod: asString(o.deliveryMethod),
        pickupDateTime: o.pickupDateTime ?? null,
        items,
        subtotal: o.subtotal ?? 0,
        deliveryFee: o.deliveryFee ?? 0,
        total: o.total ?? 0,
        notes: asString(o.notes) ?? null,
        createdAt: o.createdAt ?? null,
        paymentProofUrl: asString(o.paymentProofUrl) ?? null,
      };
    });

    return NextResponse.json({ orders: safeOrders });
  } catch (error) {
    console.error('[MY_ORDERS] Error:', error);
    return NextResponse.json({ error: 'Gagal memuat riwayat pesanan.' }, { status: 500 });
  }
}
