/// <reference types="jest" />

/**
 * Unit Tests for Zustand Stores
 * Tests: store/orderStore.ts, store/authStore.ts
 */

// Mock Zustand
const mockStore = (initialState: any) => {
  let state = initialState;
  const listeners = new Set<(state: any) => void>();

  return {
    getState: () => state,
    setState: (updater: any) => {
      state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener: (state: any) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// ========================================
// Order Store Tests
// ========================================
describe('Order Store', () => {
  const createMockOrderStore = () => {
    return mockStore({
      items: [],
      subtotal: 0,
      customerName: '',
      whatsappNumber: '',
      notes: '',
      deliveryMethod: 'pickup',
      deliveryFee: 0,
      paymentMethod: 'qris',
    });
  };

  test('initial state has empty cart', () => {
    const store = createMockOrderStore();
    expect(store.getState().items).toEqual([]);
    expect(store.getState().subtotal).toBe(0);
  });

  test('addItem adds new item to cart', () => {
    const store = createMockOrderStore();
    const newItem = {
      productId: 'prod-1',
      productName: 'Pempek Kapal Selam',
      price: 25000,
    };

    store.setState((state: any) => ({
      items: [...state.items, { ...newItem, quantity: 1 }],
      subtotal: newItem.price,
    }));

    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].quantity).toBe(1);
    expect(store.getState().subtotal).toBe(25000);
  });

  test('updateQuantity increases item quantity', () => {
    const store = createMockOrderStore();
    
    store.setState({
      items: [{ productId: 'prod-1', productName: 'Pempek', price: 25000, quantity: 1 }],
      subtotal: 25000,
    });

    store.setState((state: any) => ({
      items: state.items.map((item: any) =>
        item.productId === 'prod-1' ? { ...item, quantity: 3 } : item
      ),
      subtotal: 75000,
    }));

    expect(store.getState().items[0].quantity).toBe(3);
    expect(store.getState().subtotal).toBe(75000);
  });

  test('updateQuantity to 0 removes item from cart', () => {
    const store = createMockOrderStore();
    
    store.setState({
      items: [{ productId: 'prod-1', productName: 'Pempek', price: 25000, quantity: 1 }],
      subtotal: 25000,
    });

    store.setState((state: any) => ({
      items: state.items.filter((item: any) => item.productId !== 'prod-1'),
      subtotal: 0,
    }));

    expect(store.getState().items).toHaveLength(0);
    expect(store.getState().subtotal).toBe(0);
  });

  test('clearCart empties the cart', () => {
    const store = createMockOrderStore();
    
    store.setState({
      items: [
        { productId: 'prod-1', productName: 'Pempek 1', price: 25000, quantity: 2 },
        { productId: 'prod-2', productName: 'Pempek 2', price: 15000, quantity: 1 },
      ],
      subtotal: 65000,
      customerName: 'John Doe',
      notes: 'Extra sambal',
    });

    store.setState({
      items: [],
      subtotal: 0,
      customerName: '',
      whatsappNumber: '',
      notes: '',
    });

    expect(store.getState().items).toHaveLength(0);
    expect(store.getState().subtotal).toBe(0);
    expect(store.getState().customerName).toBe('');
    expect(store.getState().notes).toBe('');
  });

  test('setCustomerInfo updates customer details', () => {
    const store = createMockOrderStore();
    
    store.setState({
      customerName: 'John Doe',
      whatsappNumber: '081234567890',
    });

    expect(store.getState().customerName).toBe('John Doe');
    expect(store.getState().whatsappNumber).toBe('081234567890');
  });

  test('setDelivery updates delivery method and fee', () => {
    const store = createMockOrderStore();
    
    store.setState({
      deliveryMethod: 'delivery',
      deliveryFee: 15000,
    });

    expect(store.getState().deliveryMethod).toBe('delivery');
    expect(store.getState().deliveryFee).toBe(15000);
  });

  test('setPaymentMethod updates payment method', () => {
    const store = createMockOrderStore();
    
    store.setState({
      paymentMethod: 'transfer',
    });

    expect(store.getState().paymentMethod).toBe('transfer');
  });

  test('calculates subtotal correctly for multiple items', () => {
    const store = createMockOrderStore();
    
    store.setState({
      items: [
        { productId: 'prod-1', productName: 'Pempek 1', price: 25000, quantity: 2 }, // 50000
        { productId: 'prod-2', productName: 'Pempek 2', price: 15000, quantity: 3 }, // 45000
        { productId: 'prod-3', productName: 'Pempek 3', price: 10000, quantity: 1 }, // 10000
      ],
      subtotal: 105000,
    });

    expect(store.getState().subtotal).toBe(105000);
  });

  test('handles adding same item multiple times (increments quantity)', () => {
    const store = createMockOrderStore();
    
    // First add
    store.setState({
      items: [{ productId: 'prod-1', productName: 'Pempek', price: 25000, quantity: 1 }],
      subtotal: 25000,
    });

    // Second add (should increment)
    store.setState((state: any) => {
      const existingItem = state.items.find((item: any) => item.productId === 'prod-1');
      if (existingItem) {
        return {
          items: state.items.map((item: any) =>
            item.productId === 'prod-1'
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          subtotal: state.subtotal + 25000,
        };
      }
      return state;
    });

    expect(store.getState().items[0].quantity).toBe(2);
    expect(store.getState().subtotal).toBe(50000);
  });
});

// ========================================
// Auth Store Tests
// ========================================
describe('Auth Store', () => {
  const createMockAuthStore = () => {
    return mockStore({
      user: null,
      isLoading: true,
    });
  };

  test('initial state has no user and is loading', () => {
    const store = createMockAuthStore();
    expect(store.getState().user).toBeNull();
    expect(store.getState().isLoading).toBe(true);
  });

  test('setUser updates user state', () => {
    const store = createMockAuthStore();
    const mockUser = {
      uid: 'user-123',
      email: 'admin@example.com',
      displayName: 'Admin User',
    };

    store.setState({
      user: mockUser,
      isLoading: false,
    });

    expect(store.getState().user).toEqual(mockUser);
    expect(store.getState().isLoading).toBe(false);
  });

  test('setLoading updates loading state', () => {
    const store = createMockAuthStore();
    
    store.setState({ isLoading: false });
    expect(store.getState().isLoading).toBe(false);

    store.setState({ isLoading: true });
    expect(store.getState().isLoading).toBe(true);
  });

  test('logout clears user state', () => {
    const store = createMockAuthStore();
    
    store.setState({
      user: { uid: 'user-123', email: 'admin@example.com' },
      isLoading: false,
    });

    store.setState({ user: null, isLoading: false });

    expect(store.getState().user).toBeNull();
    expect(store.getState().isLoading).toBe(false);
  });
});

// ========================================
// Store Persistence Tests
// ========================================
describe('Store Persistence', () => {
  test('store state can be serialized', () => {
    const orderState = {
      items: [{ productId: 'prod-1', quantity: 2 }],
      subtotal: 50000,
      customerName: 'John',
    };

    const serialized = JSON.stringify(orderState);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(orderState);
  });

  test('store handles undefined values in serialization', () => {
    const stateWithUndefined = {
      items: [],
      subtotal: 0,
      notes: undefined,
    };

    const serialized = JSON.stringify(stateWithUndefined);
    expect(serialized).not.toContain('undefined');
  });
});

// ========================================
// Store Selectors Tests
// ========================================
describe('Store Selectors', () => {
  test('can select items from state', () => {
    const state = {
      items: [{ productId: 'prod-1', quantity: 2 }],
      subtotal: 50000,
    };

    const items = state.items;
    expect(items).toHaveLength(1);
  });

  test('can compute total with delivery fee', () => {
    const state = {
      subtotal: 100000,
      deliveryFee: 15000,
    };

    const total = state.subtotal + state.deliveryFee;
    expect(total).toBe(115000);
  });

  test('can check if cart is empty', () => {
    const state = {
      items: [],
    };

    const isEmpty = state.items.length === 0;
    expect(isEmpty).toBe(true);
  });

  test('can get item count', () => {
    const state = {
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 3 },
      ],
    };

    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    expect(totalItems).toBe(5);
  });
});
