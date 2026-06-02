import Link from 'next/link';
import { MapPin, Truck, Clock } from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { formatRupiah, formatTime } from '@/lib/utils';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  compact?: boolean;
}

export function OrderCard({ order, compact = false }: OrderCardProps) {
  const time = order.createdAt ? formatTime(order.createdAt) : '';

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="block bg-white rounded-card shadow-card border border-brown/5 p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-brown text-sm">{order.customerName}</p>
          <p className="text-xs text-brown/50 font-mono">{order.orderNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <OrderStatusBadge status={order.status} />
          {time && <span className="text-xs text-brown/40">{time}</span>}
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1 text-xs text-brown/60">
            {order.deliveryMethod === 'delivery' ? (
              <Truck size={13} />
            ) : (
              <MapPin size={13} />
            )}
            <span>{order.deliveryMethod === 'delivery' ? 'Dikirim' : 'Ambil Sendiri'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-brown/60">
            <Clock size={13} />
            <span>{order.items.length} item</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PaymentStatusBadge status={order.paymentStatus} />
        <p className="font-bold text-primary">{formatRupiah(order.total)}</p>
      </div>
    </Link>
  );
}
