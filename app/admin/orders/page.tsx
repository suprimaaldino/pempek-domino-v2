'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from '@/components/admin/OrderCard';
import { Tabs } from '@/components/ui/Tabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { OrderStatus } from '@/types';

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'ready', label: 'Siap' },
  { value: 'delivered', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
];

export default function OrdersListPage() {
  const { 
    filteredOrders, 
    statusFilter, 
    setStatusFilter, 
    setSearchQuery, 
    ordersLoading,
    orders 
  } = useAdminStore();

  // Initialize order subscription
  useOrders();

  // Calculate counts for badges
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const tabsWithCounts = STATUS_TABS.map(tab => ({
    ...tab,
    count: counts[tab.value as keyof typeof counts]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-brown">Daftar Pesanan</h1>
          <p className="text-brown/50">Kelola semua pesanan masuk di sini.</p>
        </div>
        <Button>
          <Plus size={18} />
          <span className="hidden sm:inline">Pesanan Baru</span>
          <span className="sm:hidden">Baru</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <Tabs 
          tabs={tabsWithCounts} 
          value={statusFilter} 
          onChange={(val) => setStatusFilter(val as OrderStatus | 'all')} 
          className="w-full"
        />
        <SearchInput 
          placeholder="Cari nama, no. pesanan, atau nomor WA..." 
          onSearch={setSearchQuery} 
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {ordersLoading ? (
          <SkeletonList count={5} />
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState 
            type={orders.length === 0 ? 'orders' : 'search'} 
            title={orders.length === 0 ? 'Belum Ada Pesanan' : 'Pesanan Tidak Ditemukan'}
            description={orders.length === 0 
              ? 'Pesanan dari pelanggan akan muncul di sini secara otomatis.'
              : 'Tidak ada pesanan yang sesuai dengan pencarian atau filter Anda.'}
          />
        )}
      </div>
    </div>
  );
}
