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
    const unsubscribe = subscribeToProducts(
      (allProducts) => {
        const filtered = activeOnly
          ? allProducts.filter((p) => p.isActive)
          : allProducts;
        setProducts(filtered);
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Gagal memuat daftar menu.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeOnly]);

  // Sort by price for a stable, cheapest-first menu.
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  // Group off the canonical list. `resolveProductCategory` is applied at the
  // parse boundary in lib/firestore, but repeat it here so a Product injected
  // from anywhere else can never silently vanish from the storefront.
  const grouped = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [
      category,
      sortedProducts.filter((p) => resolveProductCategory(p.category) === category),
    ])
  ) as GroupedProducts;

  return { products: sortedProducts, grouped, loading, error };
}
