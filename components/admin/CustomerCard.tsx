import { Phone, ShoppingBag, TrendingUp } from 'lucide-react';
import { formatRupiah, formatWhatsApp, formatDateShort } from '@/lib/utils';
import type { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-card shadow-card border border-brown/5 p-4 cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-sm">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-brown truncate">{customer.name}</p>
          <div className="flex items-center gap-1 text-xs text-brown/50">
            <Phone size={11} />
            <span>{formatWhatsApp(customer.whatsappNumber)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-cream rounded-badge px-3 py-2">
          <div className="flex items-center gap-1 text-xs text-brown/60 mb-0.5">
            <ShoppingBag size={11} />
            <span>Total Pesanan</span>
          </div>
          <p className="font-bold text-brown">{customer.totalOrders}x</p>
        </div>
        <div className="bg-cream rounded-badge px-3 py-2">
          <div className="flex items-center gap-1 text-xs text-brown/60 mb-0.5">
            <TrendingUp size={11} />
            <span>Total Belanja</span>
          </div>
          <p className="font-bold text-primary text-sm">{formatRupiah(customer.totalSpending)}</p>
        </div>
      </div>

      {customer.lastOrderAt && (
        <p className="text-xs text-brown/40 mt-2">
          Terakhir pesan: {formatDateShort(customer.lastOrderAt)}
        </p>
      )}
    </div>
  );
}
