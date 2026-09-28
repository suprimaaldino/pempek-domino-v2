/**
 * @jest-environment node
 */
/// <reference types="jest" />

/**
 * Security tests for POST /api/order/[orderNumber]/cancel
 *
 * Guests have no session, so the public order number used to be the only thing
 * standing between an attacker and someone else's pending order. The endpoint
 * now also requires the WhatsApp number the order was placed with.
 */

import { NextRequest } from 'next/server';
import { __resetRateLimits } from '@/lib/rate-limit';

const orderLookups: Record<string, { orderId: string }> = {};
const orders: Record<string, Record<string, unknown>> = {};

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}));

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const src = name === 'orderLookups' ? orderLookups : orders;
          const data = (src as Record<string, unknown>)[id];
          return { exists: data !== undefined, data: () => data };
        },
        update: async (payload: Record<string, unknown>) => {
          orders[id] = { ...orders[id], ...payload };
        },
      }),
    }),
  },
  adminStorage: {},
  getAdminApp: jest.fn(),
  default: {},
}));

import { POST } from '@/app/api/order/[orderNumber]/cancel/route';

const ORDER_NUMBER = 'PD-20260101-001-ABCD';
const PHONE = '628123456789';

function seedOrder(overrides: Record<string, unknown> = {}) {
  orderLookups[ORDER_NUMBER.toUpperCase()] = { orderId: 'order-doc-1' };
  orders['order-doc-1'] = {
    orderNumber: ORDER_NUMBER,
    whatsappNumber: PHONE,
    status: 'pending',
    ...overrides,
  };
}

function cancelRequest(body: unknown, ip = '10.0.0.1') {
  return new NextRequest(
    `http://localhost:3000/api/order/${ORDER_NUMBER}/cancel`,
    {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    }
  );
}

describe('POST /api/order/[orderNumber]/cancel', () => {
  beforeEach(() => {
    __resetRateLimits();
    for (const key of Object.keys(orderLookups)) delete orderLookups[key];
    for (const key of Object.keys(orders)) delete orders[key];
    seedOrder();
  });

  // ─── Happy path ─────────────────────────────────────────────────────────

  test('cancels when the WhatsApp number matches', async () => {
    const res = await POST(cancelRequest({ whatsappNumber: PHONE }), {
      params: { orderNumber: ORDER_NUMBER },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
    expect(orders['order-doc-1'].status).toBe('cancelled');
  });

  test('accepts the number in local 08xx form', async () => {
    // A real customer may type 0812… rather than remembering the 628… form.
    const res = await POST(cancelRequest({ whatsappNumber: '08123456789' }), {
      params: { orderNumber: ORDER_NUMBER },
    });

    expect(res.status).toBe(200);
    expect(orders['order-doc-1'].status).toBe('cancelled');
  });

  test('is case-insensitive about the order number', async () => {
    const res = await POST(cancelRequest({ whatsappNumber: PHONE }), {
      params: { orderNumber: ORDER_NUMBER.toLowerCase() },
    });
    expect(res.status).toBe(200);
  });

  // ─── Authorization ──────────────────────────────────────────────────────

  test('rejects a mismatched WhatsApp number with 403', async () => {
    const res = await POST(cancelRequest({ whatsappNumber: '628999999999' }), {
      params: { orderNumber: ORDER_NUMBER },
    });

    expect(res.status).toBe(403);
    // The order must be untouched.
    expect(orders['order-doc-1'].status).toBe('pending');
  });

  test('rejects a missing WhatsApp number with 403', async () => {
    const res = await POST(cancelRequest({}), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(res.status).toBe(403);
    expect(orders['order-doc-1'].status).toBe('pending');
  });

  test('rejects an empty body with 403 and does not crash', async () => {
    const res = await POST(cancelRequest('not json at all'), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(res.status).toBe(403);
  });

  test('rejects a non-string WhatsApp number', async () => {
    const res = await POST(cancelRequest({ whatsappNumber: 628123456789 }), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(res.status).toBe(403);
  });

  test('does not reveal whether the order exists on a wrong number', async () => {
    const res = await POST(cancelRequest({ whatsappNumber: '628999999999' }), {
      params: { orderNumber: ORDER_NUMBER },
    });
    const body = await res.json();
    expect(body.error).not.toMatch(/ditemukan|not found/i);
  });

  test('refuses when the stored order has no phone to compare against', async () => {
    seedOrder({ whatsappNumber: undefined });
    const res = await POST(cancelRequest({ whatsappNumber: PHONE }), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(res.status).toBe(403);
  });

  // ─── Business rules ─────────────────────────────────────────────────────

  test('rejects cancellation of an already-processed order', async () => {
    seedOrder({ status: 'completed' });
    const res = await POST(cancelRequest({ whatsappNumber: PHONE }), {
      params: { orderNumber: ORDER_NUMBER },
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tidak dapat dibatalkan/i);
    expect(orders['order-doc-1'].status).toBe('completed');
  });

  test('returns 404 for an unknown order number', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/order/PD-20260101-999-ZZZZ/cancel', {
        method: 'POST',
        body: JSON.stringify({ whatsappNumber: PHONE }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: { orderNumber: 'PD-20260101-999-ZZZZ' } }
    );
    expect(res.status).toBe(404);
  });

  // ─── Rate limiting ──────────────────────────────────────────────────────

  test('throttles repeated attempts from one IP', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) {
      const res = await POST(cancelRequest({ whatsappNumber: '628000000000' }, ip), {
        params: { orderNumber: ORDER_NUMBER },
      });
      expect(res.status).toBe(403);
    }

    const blocked = await POST(cancelRequest({ whatsappNumber: '628000000000' }, ip), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
  });

  test('a blocked IP cannot cancel a legitimate order', async () => {
    const ip = '10.0.0.100';
    // Exhaust the window with bad numbers.
    for (let i = 0; i < 5; i++) {
      await POST(cancelRequest({ whatsappNumber: '628000000000' }, ip), {
        params: { orderNumber: ORDER_NUMBER },
      });
    }
    // Even the correct number is now refused.
    const res = await POST(cancelRequest({ whatsappNumber: PHONE }, ip), {
      params: { orderNumber: ORDER_NUMBER },
    });
    expect(res.status).toBe(429);
    expect(orders['order-doc-1'].status).toBe('pending');
  });
});
