'use client';

import { useEffect, useState } from 'react';
import { subscribeToProducts } from '@/lib/firestore';
import type { Product, ProductCategory } from '@/types';

interface GroupedProducts {
  kecil: Product[];
  besar: Product[];
  paket: Product[];
}

interface UseProductsReturn {
  products: Product[];
  grouped: GroupedProducts;
  loading: boolean;
  error: string | null;
}

export function useProducts(activeOnly = true): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((allProducts) => {
      const filtered = activeOnly
        ? allProducts.filter((p) => p.isActive)
        : allProducts;
      setProducts(filtered);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [activeOnly]);

  const grouped: GroupedProducts = {
    kecil: products.filter((p) => p.category === 'kecil'),
    besar: products.filter((p) => p.category === 'besar'),
    paket: products.filter((p) => p.category === 'paket'),
  };

  return { products, grouped, loading, error };
}
