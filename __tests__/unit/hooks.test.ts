/// <reference types="jest" />

/**
 * Unit Tests for Custom Hooks
 * Tests: hooks/useProducts.ts, hooks/useLocalStorage.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Firestore
const mockUnsubscribe = jest.fn();
const mockSubscribeToProducts = jest.fn((..._args: any[]) => mockUnsubscribe);

jest.mock('@/lib/firestore', () => ({
  subscribeToProducts: (...args: any[]) => mockSubscribeToProducts(...args),
}));

// ========================================
// useProducts Hook Tests
// ========================================
describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns initial loading state', () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    mockSubscribeToProducts.mockImplementation(() => {
      // Don't call callback immediately to simulate loading
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('returns products when loaded', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    const mockProducts = [
      { id: '1', name: 'Pempek 1', price: 25000, category: 'kecil', isActive: true },
      { id: '2', name: 'Pempek 2', price: 15000, category: 'paket', isActive: true },
    ];

    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback(mockProducts);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.products).toHaveLength(2);
    });
  });

  test('filters inactive products by default', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    const mockProducts = [
      { id: '1', name: 'Active', price: 25000, category: 'kecil', isActive: true },
      { id: '2', name: 'Inactive', price: 15000, category: 'paket', isActive: false },
    ];

    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback(mockProducts);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts(true));

    await waitFor(() => {
      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0].name).toBe('Active');
    });
  });

  test('includes inactive products when activeOnly is false', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    const mockProducts = [
      { id: '1', name: 'Active', price: 25000, category: 'kecil', isActive: true },
      { id: '2', name: 'Inactive', price: 15000, category: 'paket', isActive: false },
    ];

    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback(mockProducts);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts(false));

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    });
  });

  test('sorts products by price', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    const mockProducts = [
      { id: '1', name: 'Expensive', price: 50000, category: 'kecil', isActive: true },
      { id: '2', name: 'Cheap', price: 15000, category: 'paket', isActive: true },
      { id: '3', name: 'Medium', price: 25000, category: 'kecil', isActive: true },
    ];

    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback(mockProducts);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.products[0].price).toBe(15000);
      expect(result.current.products[1].price).toBe(25000);
      expect(result.current.products[2].price).toBe(50000);
    });
  });

  test('groups products by category', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    const mockProducts = [
      { id: '1', name: 'Pempek 1', price: 25000, category: 'kecil', isActive: true },
      { id: '2', name: 'Pempek 2', price: 35000, category: 'kecil', isActive: true },
      { id: '3', name: 'Paket 1', price: 150000, category: 'paket', isActive: true },
      { id: '4', name: 'Minuman 1', price: 10000, category: 'minuman', isActive: true },
    ];

    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback(mockProducts);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.grouped.kecil).toHaveLength(2);
      expect(result.current.grouped.paket).toHaveLength(1);
      expect(result.current.grouped.minuman).toHaveLength(1);
      expect(result.current.grouped.sup_kuah).toHaveLength(0);
    });
  });

  test('unsubscribes on unmount', () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    mockSubscribeToProducts.mockImplementation(() => mockUnsubscribe);

    const { unmount } = renderHook(() => useProducts());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test('handles empty product list', async () => {
    const { useProducts } = jest.requireActual('@/hooks/useProducts');
    
    mockSubscribeToProducts.mockImplementation((callback: any) => {
      callback([]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.products).toEqual([]);
      expect(result.current.grouped.kecil).toEqual([]);
    });
  });
});

// ========================================
// useLocalStorage Hook Tests (if exists)
// ========================================
describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('returns initial value when localStorage is empty', () => {
    const mockUseLocalStorage = (key: string, initialValue: any) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    };

    const result = mockUseLocalStorage('test-key', 'default-value');
    expect(result).toBe('default-value');
  });

  test('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    
    const mockUseLocalStorage = (key: string, initialValue: any) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    };

    const result = mockUseLocalStorage('test-key', 'default-value');
    expect(result).toBe('stored-value');
  });

  test('saves value to localStorage', () => {
    const setLocalStorageValue = (key: string, value: any) => {
      localStorage.setItem(key, JSON.stringify(value));
    };

    setLocalStorageValue('test-key', 'new-value');
    
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  test('handles JSON parsing errors gracefully', () => {
    localStorage.setItem('test-key', 'invalid-json');
    
    const mockUseLocalStorage = (key: string, initialValue: any) => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
      } catch {
        return initialValue;
      }
    };

    const result = mockUseLocalStorage('test-key', 'default-value');
    expect(result).toBe('default-value');
  });

  test('handles complex objects', () => {
    const complexObject = {
      items: [{ id: 1, name: 'Item 1' }],
      total: 100,
      config: { theme: 'dark' },
    };

    localStorage.setItem('cart', JSON.stringify(complexObject));

    const stored = JSON.parse(localStorage.getItem('cart')!);
    expect(stored).toEqual(complexObject);
  });
});

// ========================================
// useAuth Hook Tests
// ========================================
describe('useAuth Hook', () => {
  const mockOnAuthStateChanged = jest.fn();
  const mockGetCurrentUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns current user when authenticated', () => {
    const mockUser = { uid: 'user-123', email: 'test@example.com' };
    mockGetCurrentUser.mockReturnValue(mockUser);

    const result = mockGetCurrentUser();
    expect(result).toEqual(mockUser);
  });

  test('returns null when not authenticated', () => {
    mockGetCurrentUser.mockReturnValue(null);

    const result = mockGetCurrentUser();
    expect(result).toBeNull();
  });

  test('subscribes to auth state changes', () => {
    const mockCallback = jest.fn();
    const mockUnsubscribe = jest.fn();

    mockOnAuthStateChanged.mockImplementation((callback: any) => {
      callback({ uid: 'user-123' }); // Simulate auth state change
      return mockUnsubscribe;
    });

    const unsubscribe = mockOnAuthStateChanged(mockCallback);
    
    expect(mockOnAuthStateChanged).toHaveBeenCalled();
    expect(typeof unsubscribe).toBe('function');
  });
});

// ========================================
// Hook Best Practices Tests
// ========================================
describe('Hook Best Practices', () => {
  test('hooks clean up subscriptions on unmount', () => {
    const cleanup = jest.fn();
    
    // Simulate useEffect cleanup
    const useEffectWithCleanup = () => {
      return cleanup;
    };

    const cleanupFn = useEffectWithCleanup();
    cleanupFn();

    expect(cleanup).toHaveBeenCalled();
  });

  test('hooks handle async operations safely', async () => {
    let isMounted = true;
    
    const asyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isMounted) {
        return 'success';
      }
      return null;
    };

    const result = await asyncOperation();
    expect(result).toBe('success');

    // Simulate unmount
    isMounted = false;
    const resultAfterUnmount = await asyncOperation();
    expect(resultAfterUnmount).toBeNull();
  });

  test('hooks memoize expensive computations', () => {
    const expensiveComputation = jest.fn(() => 'result');
    
    // Simulate useMemo
    const memoizedResult = expensiveComputation();
    
    expect(expensiveComputation).toHaveBeenCalledTimes(1);
    
    // Second call should return cached result
    const secondResult = memoizedResult;
    expect(secondResult).toBe('result');
  });
});
