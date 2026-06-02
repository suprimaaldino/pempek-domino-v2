'use client';

import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';

interface AdminState {
  // Orders
  orders: Order[];
  filteredOrders: Order[];
  searchQuery: string;
  statusFilter: OrderStatus | 'all';
  selectedOrderId: string | null;
  ordersLoading: boolean;

  // Actions
  setOrders: (orders: Order[]) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (status: OrderStatus | 'all') => void;
  setSelectedOrderId: (id: string | null) => void;
  setOrdersLoading: (loading: boolean) => void;
}

function applyFilters(
  orders: Order[],
  query: string,
  status: OrderStatus | 'all'
): Order[] {
  return orders.filter((o) => {
    const matchesStatus = status === 'all' || o.status === status;
    const matchesSearch =
      !query ||
      o.customerName.toLowerCase().includes(query.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      o.whatsappNumber.includes(query);
    return matchesStatus && matchesSearch;
  });
}

export const useAdminStore = create<AdminState>((set, get) => ({
  orders: [],
  filteredOrders: [],
  searchQuery: '',
  statusFilter: 'all',
  selectedOrderId: null,
  ordersLoading: true,

  setOrders: (orders) => {
    const { searchQuery, statusFilter } = get();
    set({ orders, filteredOrders: applyFilters(orders, searchQuery, statusFilter) });
  },

  setSearchQuery: (searchQuery) => {
    const { orders, statusFilter } = get();
    set({ searchQuery, filteredOrders: applyFilters(orders, searchQuery, statusFilter) });
  },

  setStatusFilter: (statusFilter) => {
    const { orders, searchQuery } = get();
    set({ statusFilter, filteredOrders: applyFilters(orders, searchQuery, statusFilter) });
  },

  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setOrdersLoading: (ordersLoading) => set({ ordersLoading }),
}));
