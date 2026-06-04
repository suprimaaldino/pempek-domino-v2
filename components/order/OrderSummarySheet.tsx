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
    <div className="fixed bottom-[calc(53px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-white border-t border-brown/10 shadow-card-lg px-4 py-3">
      <div className="max-w-lg mx-auto">
        {/* Totals */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag size={22} className="text-primary" />
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-xs text-brown/60 leading-none">Subtotal</p>
              <p className="font-semibold text-brown text-sm">{formatRupiah(subtotal)}</p>
            </div>
          </div>
          <div className="text-right">
            {deliveryFee > 0 && (
              <p className="text-xs text-brown/60">
                + Ongkir {formatRupiah(deliveryFee)}
              </p>
            )}
            <p className="font-bold text-primary text-lg">{formatRupiah(total)}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          loading={loading}
          disabled={itemCount === 0}
          className="w-full"
          size="lg"
        >
          Pesan Sekarang
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
