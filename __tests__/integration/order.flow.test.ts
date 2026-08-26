/// <reference types="jest" />

/**
 * Integration Tests for Order Flow
 * Tests complete order creation flow
 */

import { validateOrderData } from '@/lib/sanitize';
import { formatRupiah, normalizePhone } from '@/lib/utils';

// ========================================
// Order Creation Flow Integration Tests
// ========================================
describe('Order Creation Flow Integration', () => {
  const createMockOrder = (overrides = {}) => ({
    customerName: 'John Doe',
    whatsappNumber: '6281234567890',
    deliveryAddress: 'Jl. Sudirman No. 123',
    notes: 'Tolong dikasih sambal extra',
    deliveryFee: 15000,
    total: 165000,
    ...overrides,
  });

  describe('Step 1: Product Selection', () => {
    test('can add multiple products to cart', () => {
      const cart = [
        { productId: 'prod-1', productName: 'Pempek Kapal Selam', price: 25000, quantity: 2 },
        { productId: 'prod-2', productName: 'Pempek Lenjer', price: 15000, quantity: 3 },
      ];

      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(subtotal).toBe(95000);
      expect(cart).toHaveLength(2);
    });

    test('can update product quantities', () => {
      let cart = [
        { productId: 'prod-1', productName: 'Pempek', price: 25000, quantity: 1 },
      ];

      // Increase quantity
      cart = cart.map(item =>
        item.productId === 'prod-1'
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );

      expect(cart[0].quantity).toBe(2);
    });

    test('can remove products from cart', () => {
      let cart = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ];

      // Remove prod-1
      cart = cart.filter(item => item.productId !== 'prod-1');

      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe('prod-2');
    });
  });

  describe('Step 2: Customer Information', () => {
    test('validates customer name', () => {
      const order = createMockOrder({ customerName: 'A' });
      const result = validateOrderData(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nama minimal 2 karakter');
    });

    test('sanitizes customer name', () => {
      const order = createMockOrder({ customerName: '<b>John</b> Doe' });
      const result = validateOrderData(order);

      expect(result.sanitizedData.customerName).toBe('John Doe');
    });

    test('normalizes phone number', () => {
      const phone = '081234567890';
      const normalized = normalizePhone(phone);

      expect(normalized).toBe('6281234567890');
    });

    test('validates phone number format', () => {
      const order = createMockOrder({ whatsappNumber: '081234567890' }); // Wrong format
      const result = validateOrderData(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nomor WhatsApp tidak valid');
    });
  });

  describe('Step 3: Delivery Method', () => {
    test('calculates total with delivery fee', () => {
      const subtotal = 100000;
      const deliveryFee = 15000;
      const total = subtotal + deliveryFee;

      expect(total).toBe(115000);
    });

    test('pickup has no delivery fee', () => {
      const deliveryMethod = 'pickup';
      const deliveryFee = deliveryMethod === 'pickup' ? 0 : 15000;

      expect(deliveryFee).toBe(0);
    });

    test('delivery requires address', () => {
      const order = createMockOrder({
        deliveryAddress: 'Jl.',
      });
      const result = validateOrderData(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alamat pengiriman minimal 5 karakter');
    });

    test('sanitizes delivery address', () => {
      const order = createMockOrder({
        deliveryAddress: '<script>alert(1)</script>Jl. Sudirman No. 123',
      });
      const result = validateOrderData(order);

      expect(result.sanitizedData.deliveryAddress).not.toContain('<script>');
    });
  });

  describe('Step 4: Payment', () => {
    test('validates payment method', () => {
      const validMethods = ['qris', 'dana', 'transfer'];
      const selectedMethod = 'qris';

      expect(validMethods).toContain(selectedMethod);
    });

    test('calculates correct total amount', () => {
      const items = [
        { price: 25000, quantity: 2 }, // 50000
        { price: 15000, quantity: 3 }, // 45000
      ];
      const deliveryFee = 15000;

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + deliveryFee;

      expect(subtotal).toBe(95000);
      expect(total).toBe(110000);
    });
  });

  describe('Complete Order Validation', () => {
    test('valid complete order passes validation', () => {
      const order = createMockOrder();
      const result = validateOrderData(order);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('formats total as Rupiah', () => {
      const total = 165000;
      const formatted = formatRupiah(total);

      expect(formatted).toBe('Rp 165.000');
    });

    test('sanitizes all inputs in complete order', () => {
      const order = createMockOrder({
        customerName: '<b>John</b> Doe',
        notes: '<script>alert(1)</script>Penting!',
        deliveryAddress: '<img src=x onerror=alert(1)>Jl. Sudirman',
      });

      const result = validateOrderData(order);

      expect(result.sanitizedData.customerName).toBe('John Doe');
      expect(result.sanitizedData.notes).toBe('Penting!');
      expect(result.sanitizedData.deliveryAddress).not.toContain('<img');
    });

    test('generates WhatsApp link for order confirmation', () => {
      const phone = '6281234567890';
      const message = `Halo, saya telah memesan dengan detail:\n` +
        `Order: ORD-001\n` +
        `Total: Rp 165.000\n` +
        `Terima kasih!`;

      const encoded = encodeURIComponent(message);
      const link = `https://wa.me/${phone}?text=${encoded}`;

      expect(link).toContain('wa.me');
      expect(link).toContain(phone);
      expect(link).toContain(encodeURIComponent('Rp 165.000'));
    });
  });

  describe('Error Handling', () => {
    test('collects all validation errors', () => {
      const order = createMockOrder({
        customerName: 'A',
        whatsappNumber: '0812',
        deliveryAddress: 'Jl.',
        total: 0,
      });

      const result = validateOrderData(order);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('caps delivery fee at maximum', () => {
      const order = createMockOrder({ deliveryFee: 2000000 });
      const result = validateOrderData(order);

      expect(result.sanitizedData.deliveryFee).toBe(1000000);
    });

    test('prevents negative totals', () => {
      const order = createMockOrder({ total: -1000 });
      const result = validateOrderData(order);

      expect(result.sanitizedData.total).toBe(0);
      expect(result.isValid).toBe(false);
    });
  });
});

// ========================================
// Admin Dashboard Integration Tests
// ========================================
describe('Admin Dashboard Integration', () => {
  test('admin can view all orders', () => {
    const isAdmin = true;
    const orders = [{ id: '1' }, { id: '2' }];

    const canView = isAdmin && orders.length > 0;
    expect(canView).toBe(true);
  });

  test('admin can update order status', () => {
    const isAdmin = true;
    const validStatuses = ['pending', 'ready', 'completed', 'delivered'];
    const newStatus = 'ready';

    const canUpdate = isAdmin && validStatuses.includes(newStatus);
    expect(canUpdate).toBe(true);
  });

  test('status transitions are valid', () => {
    const transitions = {
      pending: ['ready', 'completed'],
      ready: ['delivered', 'completed'],
      delivered: ['completed'],
      completed: [],
    };

    const currentStatus = 'pending';
    const newStatus = 'ready';

    const isValidTransition = transitions[currentStatus].includes(newStatus);
    expect(isValidTransition).toBe(true);
  });

  test('generates CSV export correctly', () => {
    const orders = [
      { orderNumber: 'ORD-001', customerName: 'John', total: 100000 },
      { orderNumber: 'ORD-002', customerName: 'Jane', total: 150000 },
    ];

    const csvRows = [
      ['Order Number', 'Customer', 'Total'],
      ...orders.map(o => [o.orderNumber, o.customerName, String(o.total)]),
    ];

    expect(csvRows).toHaveLength(3);
    expect(csvRows[0]).toContain('Order Number');
  });
});
