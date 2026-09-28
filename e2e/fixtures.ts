import { test as base, expect, devices } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

/**
 * Shared E2E helpers.
 *
 * Two seams make the app testable without any Firebase credentials:
 *
 *  1. `darkenFirebase` — aborts every Google endpoint so Firestore/Auth fail
 *     fast and deterministically instead of making real network calls. The app
 *     is expected to render its own error/empty states, which is exactly what
 *     the specs assert.
 *  2. `seedCart` — writes the zustand `persist` payload into localStorage so
 *     the cart (and therefore the submit button) is live before the page loads.
 *     This is the seam that lets the full order-submission journey run without
 *     a live Firestore.
 */

const GOOGLE_ENDPOINTS = [
  '**/firestore.googleapis.com/**',
  '**/identitytoolkit.googleapis.com/**',
  '**/securetoken.googleapis.com/**',
  '**/www.googleapis.com/**',
];

export interface SeedItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

const CART_STORAGE_KEY = 'pempek-domino-order';

/** Abort all Firebase/Google traffic so specs never touch a real project. */
export async function darkenFirebase(page: Page): Promise<void> {
  for (const pattern of GOOGLE_ENDPOINTS) {
    await page.route(pattern, (route: Route) => route.abort());
  }
}

/**
 * Seed the persisted order store so `OrderSummarySheet` renders.
 *
 * zustand `persist` writes `{ state, version }`; the store shallow-merges
 * `state` over its defaults and recomputes subtotal/total on rehydrate, so
 * only `items` is strictly required.
 */
export async function seedCart(page: Page, items: SeedItem[]): Promise<void> {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await page.addInitScript(
    (args: string[]) => {
      window.localStorage.setItem(args[0], args[1]);
    },
    [
      CART_STORAGE_KEY,
      JSON.stringify({
        state: {
          items,
          customerName: '',
          whatsappNumber: '',
          notes: '',
          deliveryMethod: 'pickup',
          pickupDateTime: '',
          deliveryAddress: '',
          deliveryFee: 0,
          paymentMethod: 'qris',
          subtotal,
          total: subtotal,
        },
        version: 0,
      }),
    ]
  );
}

/** A realistic public-lookup payload, matching what /api/order/[n] returns. */
export function orderPayload(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    orderNumber: 'PD-20260928-001-X7K9',
    status: 'pending',
    paymentStatus: 'unpaid',
    customerName: 'Budi Santoso',
    deliveryMethod: 'pickup',
    pickupDateTime: '2026-09-30T10:00',
    items: [
      {
        productId: 'p1',
        productName: 'Pempek Kapal Selam',
        price: 15000,
        quantity: 2,
        subtotal: 30000,
        category: 'kecil',
      },
    ],
    subtotal: 30000,
    deliveryFee: 0,
    total: 30000,
    notes: 'Tanpa cuka',
    createdAt: { seconds: 1790000000, nanoseconds: 0 },
    paymentProofUrl: null,
    ...overrides,
  };
}

export const test = base.extend({
  // Runs before every test in every project.
  page: async ({ page }, use) => {
    await darkenFirebase(page);
    await use(page);
  },
});

export { expect, devices };
