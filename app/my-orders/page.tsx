'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Search,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Clock,
  ArrowLeft,
  PackageSearch,
  ShieldAlert,
} from 'lucide-react';
import { getOrderByOrderNumber } from '@/lib/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { formatRupiah, formatDateId, DELIVERY_METHOD_LABELS, cn } from '@/lib/utils';
import type { Order } from '@/types';

// ─── Order Detail Card ─────────────────────────────────────────────────────────

function OrderDetailCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={cn(
        'bg-white rounded-card border transition-all duration-200 overflow-hidden',
        expanded ? 'border-neutral-200 shadow-card' : 'border-neutral-100 shadow-sm'
      )}
    >
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-neutral-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-xs text-neutral-400">
            {order.createdAt ? formatDateId(order.createdAt) : '—'}
          </p>
          <p className="text-sm text-neutral-500 mt-0.5 truncate">
            {order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="font-bold text-primary">{formatRupiah(order.total)}</p>
          {expanded ? (
            <ChevronUp size={15} className="text-neutral-300" />
          ) : (
            <ChevronDown size={15} className="text-neutral-300" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-100 space-y-4 pt-3">
          {/* Customer info */}
          <div className="bg-neutral-50 rounded-input px-3 py-2">
            <p className="text-xs text-neutral-400 mb-0.5">Nama Pemesan</p>
            <p className="text-sm font-semibold text-neutral-800">{order.customerName}</p>
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {order.deliveryMethod === 'delivery' ? (
              <Truck size={14} className="text-primary shrink-0" />
            ) : (
              <MapPin size={14} className="text-primary shrink-0" />
            )}
            <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</span>
            {order.deliveryMethod === 'pickup' && order.pickupDateTime && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {order.pickupDateTime}
              </span>
            )}
            {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
              <span className="truncate">{order.deliveryAddress}</span>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Detail Pesanan</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-neutral-700">
                  {item.productName}{' '}
                  <span className="text-neutral-400">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-neutral-800">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-neutral-100 pt-2 mt-1 space-y-0.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Ongkir</span>
                  <span>{formatRupiah(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-neutral-900 text-sm pt-1">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-brown/5 rounded-input px-3 py-2">
              <p className="text-xs text-brown/50 mb-0.5">Catatan</p>
              <p className="text-sm text-brown">{order.notes}</p>
            </div>
          )}

          {/* Payment proof */}
          {order.paymentProofUrl && (
            <div>
              <p className="text-xs font-bold text-brown/40 uppercase tracking-wide mb-2">Bukti Pembayaran</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.paymentProofUrl}
                alt="Bukti pembayaran"
                className="w-full max-h-48 object-contain rounded-input border border-brown/10"
              />
            </div>
          )}

          {/* Payment pending reminder */}
          {order.paymentStatus === 'unpaid' && !order.paymentProofUrl && (
            <div className="bg-warning/10 border border-warning/30 rounded-input px-3 py-2">
              <p className="text-xs font-semibold text-brown">
                💳 Belum ada bukti pembayaran. Kirim bukti transfer ke WhatsApp kami.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setOrder(undefined);

    try {
      const result = await getOrderByOrderNumber(trimmed);
      if (!result) {
        setOrder(null);
        setError('');
      } else {
        setOrder(result);
      }
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto pt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/order')}
              aria-label="Kembali"
              className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-neutral-600" />
            </button>
            <div>
              <h1 className="font-bold text-neutral-900 text-base leading-tight">Cek Pesanan</h1>
              <p className="text-xs text-neutral-400">Masukkan nomor pesanan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6">
        {/* Security notice */}
        <div className="flex items-start gap-2 bg-white border border-neutral-100 rounded-card px-3 py-2.5 mb-4 shadow-card">
          <ShieldAlert size={14} className="text-neutral-300 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-400 leading-relaxed">
            Hanya pemesan yang tahu nomor pesanannya yang bisa melihat detail pesanan ini.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6 bg-white rounded-card shadow-card border border-neutral-100 p-4 space-y-3">
          <Input
            label="Nomor Pesanan"
            placeholder="Contoh: PD-20260604-001"
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value);
              setError('');
            }}
            error={error}
            helperText="Nomor pesanan ada di halaman konfirmasi setelah kamu memesan"
          />
          <Button
            type="submit"
            loading={loading}
            disabled={!orderNumber.trim()}
            className="w-full"
          >
            <Search size={15} />
            Cek Pesanan
          </Button>
        </form>

        {/* Result: not found */}
        {order === null && !loading && (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <PackageSearch size={28} className="text-neutral-300" />
            </div>
            <p className="text-neutral-800 font-semibold mb-1">Pesanan tidak ditemukan</p>
            <p className="text-neutral-400 text-sm">
              Pastikan nomor pesanan yang kamu masukkan sudah benar
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/order')}
            >
              Buat Pesanan Baru
            </Button>
          </div>
        )}

        {/* Result: found */}
        {order && <OrderDetailCard order={order} />}

        {/* CTA sebelum search */}
        {order === undefined && !loading && (
          <div className="text-center py-10 text-neutral-400">
            <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Masukkan nomor pesanan untuk melihat statusnya</p>
            <p className="text-xs mt-1 text-neutral-300">
              Nomor pesanan tersedia di halaman konfirmasi (contoh: PD-20260604-001)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
