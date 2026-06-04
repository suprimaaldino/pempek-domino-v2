'use client';

import Image from 'next/image';
import { Minus, Plus, UtensilsCrossed } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { Product } from '@/types';
import { useOrderStore } from '@/store/orderStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, updateQuantity, addItem } = useOrderStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (qty === 0) {
      addItem({
        productId: product.id,
        productName: product.name,
        price: product.price,
      });
    } else {
      updateQuantity(product.id, qty + 1);
    }
  };

  const handleRemove = () => {
    updateQuantity(product.id, qty - 1);
  };

  return (
    <div
      className={cn(
        'bg-white rounded-card border transition-all duration-200 overflow-hidden flex items-center gap-0',
        qty > 0 ? 'border-primary/30 shadow-card' : 'border-neutral-100 shadow-sm'
      )}
    >
      {/* Product image — square on the left */}
      <div className="relative w-20 h-20 shrink-0 bg-neutral-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <UtensilsCrossed size={24} className="text-neutral-300" />
          </div>
        )}
        {/* Quantity badge on top of image */}
        {qty > 0 && (
          <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm"
            style={{ width: '18px', height: '18px', fontSize: '10px' }}
          >
            {qty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between h-20">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-1">
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{product.description}</p>
          )}
          <p className="text-sm font-bold text-primary mt-1">{formatRupiah(product.price)}</p>
        </div>
      </div>

      {/* Controls — right side */}
      <div className="px-3 shrink-0 flex items-center">
        {qty > 0 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Kurangi ${product.name}`}
              className="w-7 h-7 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center hover:border-primary hover:text-primary transition-all"
            >
              <Minus size={12} strokeWidth={2.5} />
            </button>
            <span className="w-5 text-center font-bold text-neutral-900 text-sm">{qty}</span>
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Tambah ${product.name}`}
              className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-all"
            >
              <Plus size={12} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Tambah ${product.name}`}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-all shadow-sm"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
