'use client';

import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
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
        'bg-white rounded-card shadow-card border overflow-hidden transition-all duration-200',
        qty > 0 ? 'border-primary/30 shadow-card-hover' : 'border-brown/5'
      )}
    >
      {/* Product image */}
      <div className="relative h-28 bg-cream overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag size={32} className="text-secondary/40" />
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
            {qty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-brown leading-tight mb-1 line-clamp-2">
          {product.name}
        </p>
        <p className="text-primary font-bold text-sm">{formatRupiah(product.price)}</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          {qty > 0 ? (
            <>
              <button
                onClick={handleRemove}
                aria-label={`Kurangi ${product.name}`}
                className="w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="w-6 text-center font-bold text-brown text-sm">{qty}</span>
              <button
                onClick={handleAdd}
                aria-label={`Tambah ${product.name}`}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-700 transition-all"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              aria-label={`Tambah ${product.name}`}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-badge text-sm font-semibold border-2 border-brown/20 text-brown/60 hover:border-primary hover:text-primary transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              Tambah
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
