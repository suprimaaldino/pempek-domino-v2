'use client';

import { useEffect } from 'react';
import { subscribeToOrders } from '@/lib/firestore';
import { useAdminStore } from '@/store/adminStore';
import type { OrderStatus } from '@/types';

export function useOrders(statusFilter?: OrderStatus) {
  const { setOrders, setOrdersLoading } = useAdminStore();

  useEffect(() => {
    setOrdersLoading(true);
    const unsubscribe = subscribeToOrders(
      (orders) => {
        setOrders(orders);
        setOrdersLoading(false);
      },
      statusFilter ? { status: statusFilter } : undefined
    );
    return () => unsubscribe();
  }, [statusFilter, setOrders, setOrdersLoading]);
}
