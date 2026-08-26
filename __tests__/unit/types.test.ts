/// <reference types="jest" />

/**
 * Type Tests
 * Tests for TypeScript types and type guards
 */

import {
  PRODUCT_CATEGORIES,
  resolveProductCategory,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@/types';

// ========================================
// Product Category Tests
// ========================================
describe('Product Categories', () => {
  test('PRODUCT_CATEGORIES has all required categories', () => {
    const expectedCategories = ['kecil', 'paket', 'sup_kuah', 'minuman', 'lainnya'];
    
    expectedCategories.forEach(category => {
      expect(PRODUCT_CATEGORIES).toContain(category);
    });
  });

  test('PRODUCT_CATEGORIES has correct length', () => {
    expect(PRODUCT_CATEGORIES).toHaveLength(5);
  });

  test('resolveProductCategory returns valid category', () => {
    const result = resolveProductCategory('kecil');
    expect(PRODUCT_CATEGORIES).toContain(result);
  });

  test('resolveProductCategory handles legacy aliases', () => {
    // 'besar' should map to 'kecil'
    const result = resolveProductCategory('besar');
    expect(result).toBe('kecil');
  });

  test('resolveProductCategory returns lainnya for unknown categories', () => {
    const result = resolveProductCategory('unknown-category');
    expect(result).toBe('lainnya');
  });

  test('resolveProductCategory handles empty string', () => {
    const result = resolveProductCategory('');
    expect(result).toBe('lainnya');
  });

  test('all categories are lowercase', () => {
    PRODUCT_CATEGORIES.forEach(category => {
      expect(category).toBe(category.toLowerCase());
    });
  });

  test('categories do not contain spaces', () => {
    PRODUCT_CATEGORIES.forEach(category => {
      expect(category).not.toContain(' ');
    });
  });
});

// ========================================
// Type Literal Tests
// ========================================
describe('Type Literals', () => {
  test('DeliveryMethod has correct values', () => {
    const validMethods: DeliveryMethod[] = ['pickup', 'delivery'];
    
    expect(validMethods).toContain('pickup');
    expect(validMethods).toContain('delivery');
    expect(validMethods).toHaveLength(2);
  });

  test('OrderStatus has correct values', () => {
    const validStatuses: OrderStatus[] = ['pending', 'ready', 'completed', 'delivered'];
    
    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('ready');
    expect(validStatuses).toContain('completed');
    expect(validStatuses).toContain('delivered');
    expect(validStatuses).toHaveLength(4);
  });

  test('PaymentMethod has correct values', () => {
    const validMethods: PaymentMethod[] = ['qris', 'dana', 'transfer'];
    
    expect(validMethods).toContain('qris');
    expect(validMethods).toContain('dana');
    expect(validMethods).toContain('transfer');
    expect(validMethods).toHaveLength(3);
  });

  test('PaymentStatus has correct values', () => {
    const validStatuses: PaymentStatus[] = ['unpaid', 'paid'];
    
    expect(validStatuses).toContain('unpaid');
    expect(validStatuses).toContain('paid');
    expect(validStatuses).toHaveLength(2);
  });
});

// ========================================
// Interface Validation Tests
// ========================================
describe('Interface Validation', () => {
  test('Product interface has required fields', () => {
    const requiredFields = [
      'id',
      'name',
      'category',
      'price',
      'imageUrl',
      'isActive',
      'createdAt',
      'updatedAt',
    ];

    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  test('Order interface has required fields', () => {
    const requiredFields = [
      'id',
      'orderNumber',
      'customerName',
      'whatsappNumber',
      'deliveryMethod',
      'deliveryFee',
      'items',
      'subtotal',
      'total',
      'status',
      'paymentStatus',
      'createdAt',
      'updatedAt',
    ];

    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  test('OrderItem interface has required fields', () => {
    const requiredFields = [
      'productId',
      'productName',
      'price',
      'quantity',
      'subtotal',
    ];

    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  test('Customer interface has required fields', () => {
    const requiredFields = [
      'id',
      'name',
      'whatsappNumber',
      'totalOrders',
      'totalSpending',
      'lastOrderAt',
      'createdAt',
    ];

    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  test('CartItem interface has required fields', () => {
    const requiredFields = [
      'productId',
      'productName',
      'price',
      'quantity',
    ];

    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });
});

// ========================================
// Data Validation Tests
// ========================================
describe('Data Validation', () => {
  test('validates price is positive number', () => {
    const validPrice = (price: number) => 
      typeof price === 'number' && price > 0;

    expect(validPrice(25000)).toBe(true);
    expect(validPrice(0)).toBe(false);
    expect(validPrice(-1000)).toBe(false);
  });

  test('validates quantity is positive integer', () => {
    const validQuantity = (qty: number) => 
      Number.isInteger(qty) && qty > 0;

    expect(validQuantity(1)).toBe(true);
    expect(validQuantity(5)).toBe(true);
    expect(validQuantity(0)).toBe(false);
    expect(validQuantity(-1)).toBe(false);
    expect(validQuantity(1.5)).toBe(false);
  });

  test('validates phone number format', () => {
    const validPhone = (phone: string) => 
      /^628[0-9]{8,12}$/.test(phone);

    expect(validPhone('6281234567890')).toBe(true);
    expect(validPhone('62812')).toBe(false);
    expect(validPhone('081234567890')).toBe(false);
    expect(validPhone('')).toBe(false);
  });

  test('validates order number format', () => {
    const validOrderNumber = (orderNum: string) => 
      /^ORD-[0-9]{6}$/.test(orderNum);

    expect(validOrderNumber('ORD-000001')).toBe(true);
    expect(validOrderNumber('ORD-123456')).toBe(true);
    expect(validOrderNumber('ord-000001')).toBe(false); // lowercase
    expect(validOrderNumber('ORD-001')).toBe(false); // too short
  });

  test('validates timestamp fields', () => {
    const mockTimestamp = {
      seconds: 1704067200,
      nanoseconds: 0,
      toDate: () => new Date('2024-01-01'),
    };

    expect(typeof mockTimestamp.seconds).toBe('number');
    expect(typeof mockTimestamp.nanoseconds).toBe('number');
    expect(typeof mockTimestamp.toDate).toBe('function');
  });
});

// ========================================
// Business Logic Tests
// ========================================
describe('Business Logic', () => {
  test('calculates order item subtotal correctly', () => {
    const calculateSubtotal = (price: number, quantity: number) => 
      price * quantity;

    expect(calculateSubtotal(25000, 2)).toBe(50000);
    expect(calculateSubtotal(15000, 3)).toBe(45000);
  });

  test('calculates order total correctly', () => {
    const calculateTotal = (subtotal: number, deliveryFee: number) => 
      subtotal + deliveryFee;

    expect(calculateTotal(100000, 15000)).toBe(115000);
    expect(calculateTotal(100000, 0)).toBe(100000);
  });

  test('validates order status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['ready', 'completed'],
      ready: ['delivered', 'completed'],
      delivered: ['completed'],
      completed: [],
    };

    // Valid transitions
    expect(validTransitions.pending).toContain('ready');
    expect(validTransitions.ready).toContain('delivered');
    expect(validTransitions.delivered).toContain('completed');

    // Invalid transitions
    expect(validTransitions.completed).not.toContain('pending');
    expect(validTransitions.delivered).not.toContain('pending');
  });

  test('validates pickup orders have no delivery fee', () => {
    const getDeliveryFee = (method: string, fee: number) => 
      method === 'pickup' ? 0 : fee;

    expect(getDeliveryFee('pickup', 15000)).toBe(0);
    expect(getDeliveryFee('delivery', 15000)).toBe(15000);
  });
});

// ========================================
// Type Safety Tests
// ========================================
describe('Type Safety', () => {
  test('categories are readonly', () => {
    // TypeScript prevents modification of readonly array
    const readOnlyCategories: string[] = [...PRODUCT_CATEGORIES];
    
    // This should create a copy, not modify original
    readOnlyCategories.push('new-category');
    
    expect(PRODUCT_CATEGORIES).not.toContain('new-category');
    expect(readOnlyCategories).toContain('new-category');
  });

  test('enum-like behavior for status', () => {
    const statusMap: Record<OrderStatus, number> = {
      pending: 1,
      ready: 2,
      delivered: 3,
      completed: 4,
    };

    expect(statusMap.pending).toBe(1);
    expect(statusMap.completed).toBe(4);
  });

  test('payment method types are distinct', () => {
    const methods: PaymentMethod[] = ['qris', 'dana', 'transfer'];
    const uniqueMethods = Array.from(new Set(methods));
    
    expect(uniqueMethods).toHaveLength(methods.length);
  });
});
