'use client';

import { useEffect, useState } from 'react';
import { subscribeToProducts } from '@/lib/firestore';
import type { Product, ProductCategory } from '@/types';
import { PRODUCT_CATEGORIES, resolveProductCategory } from '@/types';

type GroupedProducts = Record<ProductCategory, Product[]>;

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

  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  const grouped: GroupedProducts = {
    kecil: sortedProducts.filter((p) => p.category === 'kecil'),
    paket: sortedProducts.filter((p) => p.category === 'paket'),
    sup_kuah: sortedProducts.filter((p) => p.category === 'sup_kuah'),
    minuman: sortedProducts.filter((p) => p.category === 'minuman'),
    lainnya: sortedProducts.filter((p) => p.category === 'lainnya'),
  };

  return { products: sortedProducts, grouped, loading, error };
}
