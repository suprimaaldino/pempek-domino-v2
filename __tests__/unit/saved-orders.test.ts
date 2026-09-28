/// <reference types="jest" />

/**
 * Unit tests for lib/saved-orders.ts
 *
 * This logic used to be copy-pasted into three pages with subtly different
 * trim/dedupe behaviour, so it is now defined once. localStorage can also be
 * unavailable or corrupted, which must never break ordering.
 */

import {
  getSavedOrders,
  saveSavedOrder,
  removeSavedOrder,
  getSavedPhone,
} from '@/lib/saved-orders';

const KEY = 'pempek-domino-orders';

function writeRaw(value: string) {
  window.localStorage.setItem(KEY, value);
}

/**
 * Run `fn` against a localStorage whose getItem/setItem throws.
 *
 * Swaps the whole object rather than jest.spyOn-ing the shared setup mock:
 * `mockRestore()` on a spy layered over an existing `jest.fn()` leaves that
 * mock permanently broken for every later test in the file.
 */
function withBrokenStorage(kind: 'get' | 'set', fn: () => void) {
  const original = window.localStorage;
  const broken = {
    getItem:
      kind === 'get'
        ? () => {
            throw new Error('storage disabled');
          }
        : original.getItem.bind(original),
    setItem:
      kind === 'set'
        ? () => {
            throw new Error('quota exceeded');
          }
        : original.setItem.bind(original),
    removeItem: original.removeItem.bind(original),
    clear: original.clear.bind(original),
  };
  Object.defineProperty(window, 'localStorage', {
    value: broken,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(window, 'localStorage', {
      value: original,
      configurable: true,
      writable: true,
    });
  }
}

describe('saved orders', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('returns an empty list when nothing is stored', () => {
    expect(getSavedOrders()).toEqual([]);
  });

  test('saves and reads back an order', () => {
    saveSavedOrder({
      orderNumber: 'PD-20260101-001-ABCD',
      orderId: 'doc-1',
      customerName: 'Budi',
    });

    expect(getSavedOrders()).toEqual([
      { orderNumber: 'PD-20260101-001-ABCD', orderId: 'doc-1', customerName: 'Budi' },
    ]);
  });

  test('deduplicates by order number instead of appending twice', () => {
    const order = {
      orderNumber: 'PD-20260101-001-ABCD',
      orderId: 'doc-1',
      customerName: 'Budi',
    };
    saveSavedOrder(order);
    saveSavedOrder(order);
    expect(getSavedOrders()).toHaveLength(1);

    // Re-saving updates the record (e.g. adds the phone on a later visit).
    saveSavedOrder({ ...order, whatsappNumber: '628123456789' });
    const saved = getSavedOrders();
    expect(saved).toHaveLength(1);
    expect(saved[0].whatsappNumber).toBe('628123456789');
  });

  test('keeps only the newest 20 orders', () => {
    for (let i = 1; i <= 25; i++) {
      saveSavedOrder({
        orderNumber: `PD-20260101-${String(i).padStart(3, '0')}-AAAA`,
        orderId: `doc-${i}`,
        customerName: `Pemesan ${i}`,
      });
    }

    const saved = getSavedOrders();
    expect(saved).toHaveLength(20);
    // The oldest were dropped, the newest retained.
    expect(saved[0].orderNumber).toBe('PD-20260101-006-AAAA');
    expect(saved[19].orderNumber).toBe('PD-20260101-025-AAAA');
  });

  test('ignores a save with no order number', () => {
    saveSavedOrder({ orderNumber: '', orderId: 'x', customerName: 'Nobody' });
    expect(getSavedOrders()).toEqual([]);
  });

  test('removes a single order', () => {
    saveSavedOrder({ orderNumber: 'A', orderId: '1', customerName: 'One' });
    saveSavedOrder({ orderNumber: 'B', orderId: '2', customerName: 'Two' });

    expect(removeSavedOrder('A')).toEqual([
      { orderNumber: 'B', orderId: '2', customerName: 'Two' },
    ]);
    expect(getSavedOrders()).toHaveLength(1);
  });

  // ─── Corrupt / hostile storage ──────────────────────────────────────────

  test('survives malformed JSON', () => {
    writeRaw('{not json');
    expect(getSavedOrders()).toEqual([]);
    // And can recover by writing a fresh value.
    saveSavedOrder({ orderNumber: 'A', orderId: '1', customerName: 'One' });
    expect(getSavedOrders()).toHaveLength(1);
  });

  test('survives a non-array payload', () => {
    writeRaw('{"orderNumber":"A"}');
    expect(getSavedOrders()).toEqual([]);
  });

  test('drops entries that are not shaped like a saved order', () => {
    writeRaw(JSON.stringify([null, 42, 'nope', {}, { orderNumber: '' }, { orderNumber: 'A' }]));
    expect(getSavedOrders()).toEqual([{ orderNumber: 'A' }]);
  });

  test('read failures degrade to an empty list', () => {
    withBrokenStorage('get', () => {
      expect(getSavedOrders()).toEqual([]);
    });
  });

  test('write failures do not throw', () => {
    withBrokenStorage('set', () => {
      expect(() =>
        saveSavedOrder({ orderNumber: 'A', orderId: '1', customerName: 'One' })
      ).not.toThrow();
      expect(() => removeSavedOrder('A')).not.toThrow();
    });
  });

  test('storage still works after a failure was injected', () => {
    // Guards against a broken localStorage mock leaking between tests.
    saveSavedOrder({
      orderNumber: 'A',
      orderId: '1',
      customerName: 'One',
      whatsappNumber: '628123456789',
    });
    expect(getSavedPhone('A')).toBe('628123456789');
  });
});

describe('getSavedPhone', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('returns the recorded number for an order', () => {
    saveSavedOrder({
      orderNumber: 'A',
      orderId: '1',
      customerName: 'One',
      whatsappNumber: '628123456789',
    });
    expect(getSavedPhone('A')).toBe('628123456789');
  });

  test('returns null for an unknown order', () => {
    expect(getSavedPhone('missing')).toBeNull();
  });

  test('returns null for a legacy record with no phone', () => {
    // Records written before the cancel API required a number.
    writeRaw(JSON.stringify([{ orderNumber: 'OLD', orderId: 'x', customerName: 'Legacy' }]));
    expect(getSavedPhone('OLD')).toBeNull();
  });
});
