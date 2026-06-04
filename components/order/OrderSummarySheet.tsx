'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useOrderStore } from '@/store/orderStore';
import { Button } from '@/components/ui/Button';

interface OrderSummarySheetProps {
  onSubmit: () => void;
  loading?: boolean;
}

export function OrderSummarySheet({ onSubmit, loading }: OrderSummarySheetProps) {
  const { items, subtotal, deliveryFee, total } = useOrderStore();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-4 pb-2">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card-lg border border-neutral-100 px-4 py-3">
        {/* Row */}
        <div className="flex items-center gap-3">
          {/* Cart icon + count */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag size={17} className="text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>

          {/* Price summary */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-400 leading-none">
              {itemCount} item{itemCount > 1 ? '' : ''}
              {deliveryFee > 0 && ` • Ongkir ${formatRupiah(deliveryFee)}`}
            </p>
            <p className="font-bold text-neutral-900 text-base leading-tight">
              {formatRupiah(total)}
            </p>
          </div>

          {/* CTA */}
          <Button
            type="button"
            onClick={onSubmit}
            loading={loading}
            size="md"
            className="shrink-0"
          >
            Pesan
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
