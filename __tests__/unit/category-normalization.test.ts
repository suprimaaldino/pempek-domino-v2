/// <reference types="jest" />

/**
 * Regression tests for the "invisible seeded products" bug.
 *
 * `lib/firestore.ts` used to seed four products with the legacy category
 * `besar`, which is not part of PRODUCT_CATEGORIES. The storefront and the
 * admin menu both grouped products by exact category equality, so those
 * products fell into no group and were never rendered anywhere.
 */

// lib/firestore pulls the Firestore client handle at module scope.
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  analytics: undefined,
  default: {},
}));

import { parseProduct, parseOrder } from '@/lib/firestore';
import { PRODUCT_CATEGORIES, resolveProductCategory } from '@/types';
import { renderHook, waitFor } from '@testing-library/react';

const baseProduct = {
  name: 'Pempek Kapsel',
  price: 15000,
  imageUrl: '',
  isActive: true,
  createdAt: {},
  updatedAt: {},
};

describe('parseProduct category normalization', () => {
  test('maps the legacy `besar` category onto `kecil`', () => {
    const product = parseProduct('p1', { ...baseProduct, category: 'besar' });
    expect(product).not.toBeNull();
    expect(product!.category).toBe('kecil');
  });

  test('passes through every canonical category unchanged', () => {
    for (const category of PRODUCT_CATEGORIES) {
      const product = parseProduct('p1', { ...baseProduct, category });
      expect(product!.category).toBe(category);
    }
  });

  test('falls back to `lainnya` for an unknown category', () => {
    const product = parseProduct('p1', { ...baseProduct, category: 'entah' });
    expect(product!.category).toBe('lainnya');
  });

  test('always yields a value present in PRODUCT_CATEGORIES', () => {
    for (const raw of ['besar', 'entah', '', 'KECIL', 'lainnya']) {
      const product = parseProduct('p1', { ...baseProduct, category: raw });
      expect(PRODUCT_CATEGORIES).toContain(product!.category);
    }
  });

  test('rejects documents that are missing required fields', () => {
    expect(parseProduct('p1', { ...baseProduct, category: 'kecil', price: 'free' })).toBeNull();
    expect(parseProduct('p1', { ...baseProduct, category: 'kecil', name: 42 })).toBeNull();
  });
});

describe('parseOrder still validates order documents', () => {
  const baseOrder = {
    orderNumber: 'PD-20260101-001-ABCD',
    customerName: 'Budi',
    whatsappNumber: '628123456789',
    deliveryMethod: 'pickup',
    deliveryFee: 0,
    items: [
      { productId: 'p1', productName: 'Pempek', price: 5000, quantity: 1, subtotal: 5000 },
    ],
    subtotal: 5000,
    total: 5000,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: {},
    updatedAt: {},
  };

  test('accepts a valid order and keeps the raw item category snapshot', () => {
    const order = parseOrder('o1', { ...baseOrder, items: [{ ...baseOrder.items[0], category: 'besar' }] });
    expect(order).not.toBeNull();
    // Order items are a historical snapshot — recap normalizes on read.
    expect(order!.items[0].category).toBe('besar');
  });

  test('rejects an order with an unknown status', () => {
    expect(parseOrder('o1', { ...baseOrder, status: 'teleported' })).toBeNull();
  });
});

describe('useProducts grouping keeps legacy categories visible', () => {
  const mockUnsubscribe = jest.fn();
  const mockSubscribe = jest.fn();

  jest.mock('@/lib/firestore', () => ({
    subscribeToProducts: (cb: (p: unknown[]) => void) => mockSubscribe(cb),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('a `besar` product lands in grouped.kecil, not nowhere', async () => {
    const legacy = {
      id: 'p-besar',
      name: 'Pempek Kapsel',
      category: 'besar',
      price: 15000,
      imageUrl: '',
      isActive: true,
    };
    mockSubscribe.mockImplementation((cb: (p: unknown[]) => void) => {
      cb([legacy]);
      return mockUnsubscribe;
    });

    const { useProducts } = await import('@/hooks/useProducts');
    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // The bug: this product was dropped from every group and never rendered.
    expect(result.current.grouped.kecil).toHaveLength(1);
    expect(result.current.grouped.kecil[0].id).toBe('p-besar');
    expect(result.current.products).toHaveLength(1);

    // Total across all groups must equal the product count — nothing vanishes.
    const groupedTotal = PRODUCT_CATEGORIES.reduce(
      (sum, c) => sum + result.current.grouped[c].length,
      0
    );
    expect(groupedTotal).toBe(result.current.products.length);
  });

  test('inactive products are excluded when activeOnly is true', async () => {
    mockSubscribe.mockImplementation((cb: (p: unknown[]) => void) => {
      cb([
        { id: 'a', name: 'Aktif', category: 'paket', price: 1, imageUrl: '', isActive: true },
        { id: 'b', name: 'Nonaktif', category: 'paket', price: 2, imageUrl: '', isActive: false },
      ]);
      return mockUnsubscribe;
    });

    const { useProducts } = await import('@/hooks/useProducts');
    const { result } = renderHook(() => useProducts(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products.map((p) => p.id)).toEqual(['a']);
  });
});

describe('resolveProductCategory alias map', () => {
  test('besar is the only documented legacy alias', () => {
    expect(resolveProductCategory('besar')).toBe('kecil');
    expect(resolveProductCategory('huge')).toBe('lainnya');
  });
});
