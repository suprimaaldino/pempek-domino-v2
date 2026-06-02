import React from 'react';
import { ShoppingBag, Search, FileText } from 'lucide-react';

type EmptyStateType = 'orders' | 'products' | 'customers' | 'search' | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const configs: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  orders: {
    icon: <ShoppingBag size={48} strokeWidth={1.5} className="text-secondary" />,
    title: 'Belum ada pesanan',
    description: 'Pesanan baru akan muncul di sini.',
  },
  products: {
    icon: <ShoppingBag size={48} strokeWidth={1.5} className="text-secondary" />,
    title: 'Belum ada produk',
    description: 'Tambahkan menu baru untuk mulai berjualan.',
  },
  customers: {
    icon: <FileText size={48} strokeWidth={1.5} className="text-secondary" />,
    title: 'Belum ada pelanggan',
    description: 'Pelanggan akan tercatat otomatis saat ada pesanan.',
  },
  search: {
    icon: <Search size={48} strokeWidth={1.5} className="text-secondary" />,
    title: 'Tidak ditemukan',
    description: 'Coba kata kunci yang berbeda.',
  },
  generic: {
    icon: <FileText size={48} strokeWidth={1.5} className="text-secondary" />,
    title: 'Tidak ada data',
    description: '',
  },
};

export function EmptyState({ type = 'generic', title, description, action }: EmptyStateProps) {
  const config = configs[type];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 opacity-60">{config.icon}</div>
      <h3 className="font-display font-semibold text-brown text-xl mb-1">
        {title ?? config.title}
      </h3>
      {(description ?? config.description) && (
        <p className="text-brown/60 text-sm">{description ?? config.description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
