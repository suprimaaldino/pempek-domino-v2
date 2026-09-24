import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { getUidFromToken } from '@/lib/server-auth';
import { normalizePhone } from '@/lib/utils';
import { format } from 'date-fns';
import type { ProductCategory, DeliveryMethod, PaymentMethod } from '@/types';

const ORDER_SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function randomOrderSuffix(length = 4): string {
  const bytes = new Uint8Array(length);
  // Node / Edge crypto
  const cryptoObj = globalThis.crypto;
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (b) => ORDER_SUFFIX_ALPHABET[b % ORDER_SUFFIX_ALPHABET.length]).join('');
}

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderBody {
  customerName: string;
  whatsappNumber: string;
  items: OrderItemInput[];
  deliveryMethod: DeliveryMethod;
  pickupDateTime?: string | null;
  deliveryAddress?: string | null;
  deliveryFee?: number;
  paymentMethod?: PaymentMethod;
  paymentProofUrl?: string | null;
  notes?: string | null;
  /** Optional Bearer token for authenticated ownership stamping */
}

const MAX_ITEMS = 100;
const MAX_QTY = 1000;
const MAX_DELIVERY_FEE = 1_000_000;
const MAX_TOTAL = 100_000_000;

/**
 * POST /api/order
 * Server-authoritative order creation:
 * - Prices/totals recomputed from catalog (never trusted from client).
 * - Validates all money fields server-side.
 * - Optional Authorization: Bearer <firebase id token> stamps userId/userEmail.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    if (
      !body ||
      typeof body.customerName !== 'string' ||
      typeof body.whatsappNumber !== 'string' ||
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > MAX_ITEMS
    ) {
      return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 });
    }

    const customerName = body.customerName.trim();
    // Accept 08xx / +628xx / 628xx from clients; store as 628…
    const whatsappNumber = normalizePhone(body.whatsappNumber);

    if (customerName.length < 2 || customerName.length > 100) {
      return NextResponse.json({ error: 'Nama pemesan tidak valid.' }, { status: 400 });
    }
    if (!/^628[0-9]{8,12}$/.test(whatsappNumber)) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid.' }, { status: 400 });
    }
    if (body.deliveryMethod !== 'pickup' && body.deliveryMethod !== 'delivery') {
      return NextResponse.json({ error: 'Metode pengiriman tidak valid.' }, { status: 400 });
    }

    // Optional identity for ownership stamping
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const uid = await getUidFromToken(authHeader.slice(7).trim());
      if (uid) {
        userId = uid;
        const userSnap = await adminDb.collection('users').doc(uid).get();
        const email = userSnap.data()?.email;
        userEmail = typeof email === 'string' ? email : null;
      }
    }

    // ── Load catalog & recompute money ──────────────────────────────────
    const productIds = Array.from(new Set(body.items.map((i) => i.productId)));
    if (productIds.length === 0 || productIds.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Item pesanan tidak valid.' }, { status: 400 });
    }

    const productRefs = productIds.map((id) => adminDb.collection('products').doc(id));
    const productSnaps = await adminDb.getAll(...productRefs);
    const productMap = new Map<string, { name: string; price: number; category?: string; isActive?: boolean }>();
    for (const snap of productSnaps) {
      if (!snap.exists) continue;
      const d = snap.data()!;
      productMap.set(snap.id, {
        name: typeof d.name === 'string' ? d.name : '',
        price: typeof d.price === 'number' ? d.price : -1,
        category: typeof d.category === 'string' ? d.category : undefined,
        isActive: d.isActive !== false,
      });
    }

    const orderItems: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      subtotal: number;
      category?: string;
    }> = [];
    let subtotal = 0;

    for (const item of body.items) {
      if (!item || typeof item.productId !== 'string' || !Number.isFinite(item.quantity)) {
        return NextResponse.json({ error: 'Item pesanan tidak valid.' }, { status: 400 });
      }
      const qty = Math.floor(Number(item.quantity));
      if (qty < 1 || qty > MAX_QTY) {
        return NextResponse.json({ error: 'Jumlah item tidak valid.' }, { status: 400 });
      }

      const product = productMap.get(item.productId);
      if (!product || product.price < 0 || product.isActive === false) {
        return NextResponse.json(
          { error: 'Salah satu menu tidak tersedia. Muat ulang menu dan coba lagi.' },
          { status: 400 }
        );
      }

      const lineSubtotal = product.price * qty;
      subtotal += lineSubtotal;
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price, // server price — client price ignored
        quantity: qty,
        subtotal: lineSubtotal,
        category: product.category as ProductCategory | undefined,
      });
    }

    let deliveryFee = 0;
    if (body.deliveryMethod === 'delivery') {
      const rawFee = Number(body.deliveryFee ?? 0);
      if (!Number.isFinite(rawFee) || rawFee < 0 || rawFee > MAX_DELIVERY_FEE) {
        return NextResponse.json({ error: 'Ongkos kirim tidak valid.' }, { status: 400 });
      }
      deliveryFee = Math.floor(rawFee);
    }

    const total = subtotal + deliveryFee;
    if (total <= 0 || total > MAX_TOTAL) {
      return NextResponse.json({ error: 'Total pesanan tidak valid.' }, { status: 400 });
    }

    // ── Order number (transaction on counters/{yyyyMMdd}) ───────────────
    const today = format(new Date(), 'yyyyMMdd');
    const counterRef = adminDb.collection('counters').doc(today);
    const seq = await adminDb.runTransaction(async (txn) => {
      const snap = await txn.get(counterRef);
      const current = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
      const next = current + 1;
      txn.set(counterRef, { count: next }, { merge: true });
      return next;
    });
    const orderNumber = `PD-${today}-${String(seq).padStart(3, '0')}-${randomOrderSuffix()}`;

    // ── Persist order + lookup ──────────────────────────────────────────
    const now = FieldValue.serverTimestamp();
    const deliveryAddress: string | null =
      body.deliveryMethod === 'delivery'
        ? String(body.deliveryAddress ?? '').slice(0, 500)
        : null;
    if (deliveryAddress !== null && deliveryAddress.length < 5) {
      return NextResponse.json({ error: 'Alamat pengiriman tidak valid.' }, { status: 400 });
    }

    const orderDoc = {
      orderNumber,
      customerName,
      whatsappNumber,
      ...(userId ? { userId, userEmail } : {}),
      deliveryMethod: body.deliveryMethod,
      pickupDateTime:
        body.deliveryMethod === 'pickup' ? String(body.pickupDateTime ?? '').slice(0, 64) : null,
      deliveryAddress,
      deliveryFee,
      items: orderItems,
      subtotal,
      total,
      status: 'pending' as const,
      paymentMethod: body.paymentMethod ?? 'qris',
      paymentStatus: 'unpaid' as const,
      ...(body.paymentProofUrl ? { paymentProofUrl: String(body.paymentProofUrl).slice(0, 2000) } : {}),
      notes: body.notes ? String(body.notes).slice(0, 500) : null,
      createdAt: now,
      updatedAt: now,
    };

    const orderRef = await adminDb.collection('orders').add(orderDoc);
    await adminDb.collection('orderLookups').doc(orderNumber.toUpperCase()).set({
      orderId: orderRef.id,
      createdAt: now,
    });

    // Best-effort customer aggregate (non-fatal)
    try {
      const customerRef = adminDb.collection('customers').doc(whatsappNumber);
      await adminDb.runTransaction(async (txn) => {
        const snap = await txn.get(customerRef);
        const prev = snap.exists ? snap.data() : {};
        txn.set(
          customerRef,
          {
            name: customerName,
            whatsappNumber,
            totalOrders: (Number(prev?.totalOrders ?? 0) || 0) + 1,
            totalSpending: (Number(prev?.totalSpending ?? 0) || 0) + total,
            lastOrderAt: FieldValue.serverTimestamp(),
            ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
          },
          { merge: true }
        );
      });
    } catch (e) {
      console.error('[ORDER] customer upsert failed:', e);
    }

    // Best-effort: stamp phone on authenticated user profile
    if (userId) {
      try {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.set(
          {
            phone: whatsappNumber,
            updatedAt: FieldValue.serverTimestamp(),
            ...(userEmail ? { email: userEmail } : {}),
          },
          { merge: true }
        );
      } catch (e) {
        console.error('[ORDER] user phone stamp failed:', e);
      }
    }

    return NextResponse.json({
      orderId: orderRef.id,
      orderNumber,
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      paymentStatus: 'unpaid',
    });
  } catch (error) {
    console.error('[ORDER_CREATE] Error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat pesanan. Coba lagi.' },
      { status: 500 }
    );
  }
}
