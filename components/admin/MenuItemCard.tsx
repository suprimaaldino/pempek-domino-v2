'use client';

import Image from 'next/image';
import { Pencil, Trash2, ToggleLeft, ToggleRight, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types';

interface MenuItemCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function MenuItemCard({ product, onEdit, onDelete, onToggleActive }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card border border-brown/5 p-3 flex items-center gap-3">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-input overflow-hidden bg-cream flex items-center justify-center shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <ShoppingBag size={24} className="text-secondary/40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brown text-sm truncate">{product.name}</p>
        <p className="text-primary font-bold text-sm">{formatRupiah(product.price)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge
            label={CATEGORY_LABELS[product.category] ?? product.category}
            variant="neutral"
            size="sm"
          />
          {!product.isActive && <Badge label="Nonaktif" variant="error" size="sm" />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => onToggleActive(product.id, !product.isActive)}
          aria-label={product.isActive ? 'Nonaktifkan produk' : 'Aktifkan produk'}
          className="text-brown/50 hover:text-primary transition-colors"
        >
          {product.isActive ? (
            <ToggleRight size={24} className="text-success" />
          ) : (
            <ToggleLeft size={24} />
          )}
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(product)}
            aria-label="Edit produk"
            className="p-1.5 rounded-badge hover:bg-secondary/10 text-brown/60 hover:text-secondary transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            aria-label="Hapus produk"
            className="p-1.5 rounded-badge hover:bg-error/10 text-brown/60 hover:text-error transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
