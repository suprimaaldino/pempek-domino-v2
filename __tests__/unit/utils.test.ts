/// <reference types="jest" />

/**
 * Unit Tests for Utility Functions
 * Tests: lib/utils.ts
 */

import {
  cn,
  formatRupiah,
  formatWhatsApp,
  normalizePhone,
  generateWhatsAppLink,
  formatDateId,
  formatDateShort,
  formatTime,
  formatStoreHours,
  getCategoryLabel,
  CATEGORY_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/utils';
import { resolveProductCategory } from '@/types';

// ========================================
// cn() - Tailwind class merger
// ========================================
describe('cn()', () => {
  test('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  test('handles conditional classes', () => {
    expect(cn('px-2', true && 'py-1', false && 'hidden')).toBe('px-2 py-1');
  });

  test('handles undefined and null values', () => {
    expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1');
  });

  test('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });

  test('handles array of classes', () => {
    expect(cn(['px-2', 'py-1'], 'm-2')).toBe('px-2 py-1 m-2');
  });

  test('handles object syntax', () => {
    expect(cn({ 'px-2': true, 'py-1': false, 'm-2': true })).toBe('px-2 m-2');
  });
});

// ========================================
// formatRupiah() - Currency formatting
// ========================================
describe('formatRupiah()', () => {
  test('formats 15000 to "Rp 15.000"', () => {
    expect(formatRupiah(15000)).toBe('Rp 15.000');
  });

  test('formats 0 to "Rp 0"', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  test('formats large numbers correctly', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
  });

  test('formats negative numbers', () => {
    expect(formatRupiah(-50000)).toBe('Rp -50.000');
  });

  test('formats decimal numbers', () => {
    expect(formatRupiah(15000.5)).toBe('Rp 15.000,5');
  });
});

// ========================================
// formatWhatsApp() - Phone display formatting
// ========================================
describe('formatWhatsApp()', () => {
  test('formats 6281776400024 to "0817-7640-0024"', () => {
    expect(formatWhatsApp('6281776400024')).toBe('0817-7640-0024');
  });

  test('formats 081234567890 to "0812-3456-7890"', () => {
    expect(formatWhatsApp('081234567890')).toBe('0812-3456-7890');
  });

  test('removes non-digits before formatting', () => {
    expect(formatWhatsApp('62812-3456-7890')).toBe('0812-3456-7890');
  });

  test('handles short numbers', () => {
    expect(formatWhatsApp('0812')).toBe('0812');
  });

  test('handles empty string', () => {
    expect(formatWhatsApp('')).toBe('');
  });
});

// ========================================
// normalizePhone() - Phone normalization
// ========================================
describe('normalizePhone()', () => {
  test('normalizes 081234567890 to 6281234567890', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890');
  });

  test('keeps 6281234567890 as is', () => {
    expect(normalizePhone('6281234567890')).toBe('6281234567890');
  });

  test('normalizes +6281234567890 to 6281234567890', () => {
    expect(normalizePhone('+6281234567890')).toBe('6281234567890');
  });

  test('handles numbers without prefix', () => {
    expect(normalizePhone('81234567890')).toBe('6281234567890');
  });

  test('removes non-digits', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890');
  });

  test('handles empty string', () => {
    expect(normalizePhone('')).toBe('62');
  });
});

// ========================================
// generateWhatsAppLink() - WA link generator
// ========================================
describe('generateWhatsAppLink()', () => {
  test('generates correct wa.me link', () => {
    const link = generateWhatsAppLink('6281234567890', 'Hello World');
    expect(link).toBe('https://wa.me/6281234567890?text=Hello%20World');
  });

  test('encodes special characters', () => {
    const link = generateWhatsAppLink('6281234567890', 'Hello & Welcome!');
    expect(link).toBe('https://wa.me/6281234567890?text=Hello%20%26%20Welcome!');
  });

  test('encodes newlines', () => {
    const link = generateWhatsAppLink('6281234567890', 'Line 1\nLine 2');
    expect(link).toBe('https://wa.me/6281234567890?text=Line%201%0ALine%202');
  });

  test('handles empty message', () => {
    const link = generateWhatsAppLink('6281234567890', '');
    expect(link).toBe('https://wa.me/6281234567890?text=');
  });
});

// ========================================
// formatStoreHours() - Business hours formatter
// ========================================
describe('formatStoreHours()', () => {
  test('formats full settings correctly', () => {
    const settings = {
      operationalDays: 'Senin - Jumat',
      openingTime: '08:00',
      closingTime: '17:00',
      openingHours: '',
    };
    expect(formatStoreHours(settings)).toBe('Senin - Jumat, 08:00 - 17:00');
  });

  test('returns only time range if no operational days', () => {
    const settings = {
      operationalDays: '',
      openingTime: '09:00',
      closingTime: '18:00',
      openingHours: '',
    };
    expect(formatStoreHours(settings)).toBe('09:00 - 18:00');
  });

  test('returns only operational days if no time', () => {
    const settings = {
      operationalDays: 'Setiap Hari',
      openingTime: '',
      closingTime: '',
      openingHours: '',
    };
    expect(formatStoreHours(settings)).toBe('Setiap Hari');
  });

  test('falls back to openingHours if other fields empty', () => {
    const settings = {
      operationalDays: '',
      openingTime: '',
      closingTime: '',
      openingHours: 'Buka 24 Jam',
    };
    expect(formatStoreHours(settings)).toBe('Buka 24 Jam');
  });

  test('returns null for empty settings', () => {
    const settings = {
      operationalDays: '',
      openingTime: '',
      closingTime: '',
      openingHours: '',
    };
    expect(formatStoreHours(settings)).toBeNull();
  });
});

// ========================================
// Date Formatting Functions
// ========================================
describe('Date Formatting', () => {
  const testDate = new Date('2024-06-15T14:30:00');

  describe('formatDateId()', () => {
    test('formats date to Indonesian format', () => {
      expect(formatDateId(testDate)).toMatch(/Sabtu, 15 Juni 2024 · 14:30/);
    });

    test('handles Firestore timestamp-like object', () => {
      const timestamp = { toDate: () => testDate };
      expect(formatDateId(timestamp)).toMatch(/Sabtu, 15 Juni 2024 · 14:30/);
    });
  });

  describe('formatDateShort()', () => {
    test('formats to short date', () => {
      expect(formatDateShort(testDate)).toBe('15 Jun 2024');
    });

    test('handles Firestore timestamp-like object', () => {
      const timestamp = { toDate: () => testDate };
      expect(formatDateShort(timestamp)).toBe('15 Jun 2024');
    });
  });

  describe('formatTime()', () => {
    test('formats to time only', () => {
      expect(formatTime(testDate)).toBe('14:30');
    });

    test('handles Firestore timestamp-like object', () => {
      const timestamp = { toDate: () => testDate };
      expect(formatTime(timestamp)).toBe('14:30');
    });
  });
});

// ========================================
// Label Constants
// ========================================
describe('Label Constants', () => {
  test('ORDER_STATUS_LABELS has correct values', () => {
    expect(ORDER_STATUS_LABELS.pending).toBe('Menunggu');
    expect(ORDER_STATUS_LABELS.ready).toBe('Siap');
    expect(ORDER_STATUS_LABELS.completed).toBe('Selesai');
    expect(ORDER_STATUS_LABELS.delivered).toBe('Dikirim');
  });

  test('PAYMENT_STATUS_LABELS has correct values', () => {
    expect(PAYMENT_STATUS_LABELS.unpaid).toBe('Belum Bayar');
    expect(PAYMENT_STATUS_LABELS.paid).toBe('Sudah Bayar');
  });

  test('DELIVERY_METHOD_LABELS has correct values', () => {
    expect(DELIVERY_METHOD_LABELS.pickup).toBe('Ambil Sendiri');
    expect(DELIVERY_METHOD_LABELS.delivery).toBe('Dikirim');
  });

  test('PAYMENT_METHOD_LABELS has correct values', () => {
    expect(PAYMENT_METHOD_LABELS.qris).toBe('QRIS');
    expect(PAYMENT_METHOD_LABELS.dana).toBe('Dana');
    expect(PAYMENT_METHOD_LABELS.transfer).toBe('Transfer Bank');
  });

  test('CATEGORY_LABELS has correct values', () => {
    expect(CATEGORY_LABELS.kecil).toBe('Pempek Satuan');
    expect(CATEGORY_LABELS.paket).toBe('Pempek Paket');
    expect(CATEGORY_LABELS.sup_kuah).toBe('Sup dan Kuah');
    expect(CATEGORY_LABELS.minuman).toBe('Minuman');
    expect(CATEGORY_LABELS.lainnya).toBe('Lain-Lain');
  });
});

// ========================================
// resolveProductCategory()
// ========================================
describe('resolveProductCategory()', () => {
  test('returns valid category as-is', () => {
    expect(resolveProductCategory('kecil')).toBe('kecil');
    expect(resolveProductCategory('paket')).toBe('paket');
  });

  test('returns "lainnya" for invalid category', () => {
    expect(resolveProductCategory('invalid')).toBe('lainnya');
    expect(resolveProductCategory('')).toBe('lainnya');
  });

  test('returns "lainnya" for undefined/null', () => {
    expect(resolveProductCategory(undefined as any)).toBe('lainnya');
    expect(resolveProductCategory(null as any)).toBe('lainnya');
  });
});

// ========================================
// getCategoryLabel()
// ========================================
describe('getCategoryLabel()', () => {
  test('returns correct label for valid category', () => {
    expect(getCategoryLabel('kecil')).toBe('Pempek Satuan');
    expect(getCategoryLabel('paket')).toBe('Pempek Paket');
  });

  test('returns label for "lainnya" for invalid category', () => {
    expect(getCategoryLabel('invalid')).toBe('Lain-Lain');
  });
});
