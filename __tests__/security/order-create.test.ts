/**
 * @jest-environment node
 */
/// <reference types="jest" />

/**
 * Security / correctness tests for POST /api/order
 *
 * Covers the throttling added to the only mutating public route that had
 * none, the guarantee that a rejected request never consumes a daily order
 * sequence number, and validation of client-supplied identifiers and URLs.
 */

import { NextRequest } from 'next/server';
import { __resetRateLimits } from '@/lib/rate-limit';
import { __resetTokenCache } from '@/lib/server-auth';

const products: Record<string, Record<string, unknown>> = {
  p1: { name: 'Pempek Kapal Selam', price: 15000, category: 'kecil', isActive: true },
  p2: { name: 'Mix Isi 5', price: 22000, category: 'paket', isActive: true },
  p3: { name: 'Menu Nonaktif', price: 9000, category: 'kecil', isActive: false },
};

let counterValue = 0;
/** Number of times the sequence counter was actually incremented. */
let counterWrites = 0;
let addedOrders: Array<Record<string, unknown>> = [];

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}));

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        // The route builds refs via doc(id) and hands them to getAll(), which
        // reads `.id` off each ref — so it must be exposed. __collection lets
        // runTransaction tell the order counter apart from the customer rollup.
        id,
        __collection: name,
        get: async () => ({ exists: true, data: () => ({ orderId: 'doc-1' }) }),
        set: async () => undefined,
      }),
      add: async (payload: Record<string, unknown>) => {
        addedOrders.push(payload);
        return { id: `added-${addedOrders.length}` };
      },
    }),
    getAll: async (...refs: Array<{ id: string }>) =>
      refs.map((ref) => {
        const data = products[ref.id];
        return { id: ref.id, exists: data !== undefined, data: () => data };
      }),
    runTransaction: async (fn: (txn: unknown) => Promise<number>) => {
      let touchedCounter = false;
      const next = await fn({
        get: async (ref: { __collection?: string }) => {
          if (ref?.__collection === 'counters') {
            touchedCounter = true;
            counterWrites++;
            return { exists: counterValue > 0, data: () => ({ count: counterValue }) };
          }
          // customers/{phone} rollup
          return { exists: false, data: () => undefined };
        },
        set: () => {
          if (touchedCounter) counterValue++;
        },
      });
      return next;
    },
  },
  adminStorage: {},
  getAdminApp: jest.fn(),
  default: {},
}));

import { POST } from '@/app/api/order/route';

const VALID_BODY = {
  customerName: 'Budi Santoso',
  whatsappNumber: '081234567890',
  items: [{ productId: 'p1', quantity: 2 }],
  deliveryMethod: 'pickup',
  pickupDateTime: '2026-09-30T10:00',
  paymentMethod: 'qris',
};

function orderRequest(body: unknown, ip = '10.1.0.1') {
  return new NextRequest('http://localhost:3000/api/order', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  });
}

describe('POST /api/order', () => {
  beforeEach(() => {
    __resetRateLimits();
    __resetTokenCache();
    counterValue = 0;
    counterWrites = 0;
    addedOrders = [];
  });

  // ─── Happy path / authoritative money ───────────────────────────────────

  test('recomputes the total from the catalog, ignoring any client price', async () => {
    const res = await POST(
      orderRequest({
        ...VALID_BODY,
        // A hostile client tries to dictate its own money.
        items: [{ productId: 'p1', quantity: 2, price: 1, subtotal: 2 }],
        total: 2,
        subtotal: 2,
        deliveryFee: 999999,
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // 15000 x 2, pickup so deliveryFee is forced to 0.
    expect(body.subtotal).toBe(30000);
    expect(body.deliveryFee).toBe(0);
    expect(body.total).toBe(30000);
    expect(body.orderNumber).toMatch(/^PD-\d{8}-\d{3}-[A-Z0-9]{4}$/);
  });

  test('normalizes an 08xx WhatsApp number to 628xx when storing', async () => {
    await POST(orderRequest(VALID_BODY));
    expect(addedOrders[0].whatsappNumber).toBe('6281234567890');
  });

  // ─── Catalog integrity ──────────────────────────────────────────────────

  test('rejects an inactive product', async () => {
    const res = await POST(
      orderRequest({ ...VALID_BODY, items: [{ productId: 'p3', quantity: 1 }] })
    );
    expect(res.status).toBe(400);
    expect(addedOrders).toHaveLength(0);
  });

  test('rejects a product that does not exist', async () => {
    const res = await POST(
      orderRequest({ ...VALID_BODY, items: [{ productId: 'nope', quantity: 1 }] })
    );
    expect(res.status).toBe(400);
  });

  test('rejects a quantity outside 1..1000', async () => {
    for (const quantity of [0, -1, 1001, Number.NaN]) {
      const res = await POST(
        orderRequest({ ...VALID_BODY, items: [{ productId: 'p1', quantity }] })
      );
      expect(res.status).toBe(400);
    }
    expect(addedOrders).toHaveLength(0);
  });

  test('floors a fractional quantity instead of trusting it', async () => {
    await POST(
      orderRequest({ ...VALID_BODY, items: [{ productId: 'p1', quantity: 1.9 }] })
    );
    expect(addedOrders).toHaveLength(1);
    expect((addedOrders[0].items as Array<{ quantity: number }>)[0].quantity).toBe(1);
  });

  // ─── Identifier and URL validation ──────────────────────────────────────

  test('rejects a productId containing a slash (would break the Firestore ref)', async () => {
    const res = await POST(
      orderRequest({ ...VALID_BODY, items: [{ productId: 'a/b', quantity: 1 }] })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Item pesanan tidak valid/);
  });

  test('rejects an over-long productId', async () => {
    const res = await POST(
      orderRequest({ ...VALID_BODY, items: [{ productId: 'a'.repeat(151), quantity: 1 }] })
    );
    expect(res.status).toBe(400);
  });

  test('rejects a non-http payment proof URL', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'file:///etc/passwd']) {
      const res = await POST(orderRequest({ ...VALID_BODY, paymentProofUrl: url }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/Bukti pembayaran tidak valid/);
    }
    expect(addedOrders).toHaveLength(0);
  });

  test('accepts an https payment proof URL', async () => {
    const res = await POST(
      orderRequest({ ...VALID_BODY, paymentProofUrl: 'https://firebasestorage.googleapis.com/x.png' })
    );
    expect(res.status).toBe(200);
  });

  // ─── Basic field validation ─────────────────────────────────────────────

  test('rejects a missing or malformed name', async () => {
    for (const customerName of ['', 'A', 'x'.repeat(101)]) {
      const res = await POST(orderRequest({ ...VALID_BODY, customerName }));
      expect(res.status).toBe(400);
    }
  });

  test('rejects a malformed WhatsApp number', async () => {
    for (const whatsappNumber of ['', '12345', '+1234567890', '999999999999']) {
      const res = await POST(orderRequest({ ...VALID_BODY, whatsappNumber }));
      expect(res.status).toBe(400);
    }
  });

  test('rejects an empty cart', async () => {
    const res = await POST(orderRequest({ ...VALID_BODY, items: [] }));
    expect(res.status).toBe(400);
  });

  test('rejects a malformed body', async () => {
    const res = await POST(orderRequest('not json'));
    expect(res.status).toBe(500); // caught by the outer guard
  });

  // ─── Counter integrity ──────────────────────────────────────────────────

  test('does not consume a sequence number when validation fails', async () => {
    const before = counterWrites;

    // Missing delivery address for a delivery order.
    const res = await POST(
      orderRequest({
        ...VALID_BODY,
        deliveryMethod: 'delivery',
        deliveryAddress: 'x',
      })
    );

    expect(res.status).toBe(400);
    // The regression: the counter used to be incremented before this check,
    // so a bad request inflated the daily sequence.
    expect(counterWrites).toBe(before);
    expect(addedOrders).toHaveLength(0);
  });

  test('consumes exactly one sequence number per accepted order', async () => {
    const res = await POST(orderRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(counterWrites).toBe(1);
  });

  // ─── Rate limiting ──────────────────────────────────────────────────────

  test('throttles order spam from a single IP', async () => {
    const ip = '10.1.0.50';
    for (let i = 0; i < 10; i++) {
      const res = await POST(orderRequest(VALID_BODY, ip));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(orderRequest(VALID_BODY, ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('300');
    // The rejected request must not have created an order.
    expect(addedOrders).toHaveLength(10);
  });

  test('throttling is per IP, so one abuser does not block everyone', async () => {
    for (let i = 0; i < 10; i++) {
      await POST(orderRequest(VALID_BODY, '10.1.0.60'));
    }
    expect((await POST(orderRequest(VALID_BODY, '10.1.0.60'))).status).toBe(429);

    const other = await POST(orderRequest(VALID_BODY, '10.1.0.61'));
    expect(other.status).toBe(200);
  });

  test('rate limiting applies before any body parsing', async () => {
    const ip = '10.1.0.70';
    for (let i = 0; i < 10; i++) {
      await POST(orderRequest(VALID_BODY, ip));
    }
    // Even a garbage body is refused with 429, not 400/500.
    const res = await POST(orderRequest('not json', ip));
    expect(res.status).toBe(429);
  });
});
