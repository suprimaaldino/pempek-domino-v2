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
  Menu,
} from 'lucide-react';
import { getCustomerOrders } from '@/lib/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { formatRupiah, formatDateId, normalizePhone, DELIVERY_METHOD_LABELS } from '@/lib/utils';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';
import { CustomerSidebar } from '@/components/order/CustomerSidebar';

// ─── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-card shadow-card border border-brown/5 overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-brown/5 transition-colors"
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
          <p className="text-xs text-brown/50">
            {order.createdAt ? formatDateId(order.createdAt) : '—'}
          </p>
          <p className="text-sm text-brown/70 mt-0.5 truncate">
            {order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="font-bold text-primary">{formatRupiah(order.total)}</p>
          {expanded ? (
            <ChevronUp size={16} className="text-brown/40" />
          ) : (
            <ChevronDown size={16} className="text-brown/40" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-brown/5 space-y-4 pt-3">
          {/* Delivery */}
          <div className="flex items-center gap-2 text-sm text-brown/70">
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
            <p className="text-xs font-bold text-brown/40 uppercase tracking-wide">Detail Pesanan</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-brown">
                  {item.productName}{' '}
                  <span className="text-brown/50">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-brown">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-brown/5 pt-2 mt-1 space-y-0.5">
              <div className="flex justify-between text-xs text-brown/50">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-xs text-brown/50">
                  <span>Ongkir</span>
                  <span>{formatRupiah(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-brown text-sm pt-1">
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
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    const normalized = normalizePhone(phone.trim());
    if (!normalized) {
      setError('Format nomor tidak valid. Gunakan: 08xxxxxxxxxx atau +62xxxxxxxxx');
      return;
    }

    setLoading(true);
    setError('');
    setOrders(null);

    try {
      const result = await getCustomerOrders(normalized);
      setOrders(result);
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-safe-top pb-6">
        <div className="max-w-lg mx-auto pt-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/order')}
                aria-label="Kembali"
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <ClipboardList size={20} />
                <h1 className="font-display font-bold text-xl">Pesanan Saya</h1>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
          <p className="text-white/70 text-sm ml-11">
            Cek status pesanan dengan nomor WhatsApp
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-card shadow-card p-4 space-y-3">
          <Input
            label="Nomor WhatsApp"
            placeholder="08xxxxxxxxxx atau +62xxxxxxxxx"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={error}
            helperText="Masukkan nomor yang sama saat memesan"
          />
          <Button
            type="submit"
            loading={loading}
            disabled={!phone.trim()}
            className="w-full"
          >
            <Search size={16} />
            Cari Pesanan
          </Button>
        </form>

        {/* Results */}
        {orders !== null && (
          <div className="space-y-4">
            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-white rounded-badge border border-brown/5 px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                <ClipboardList size={14} className="text-primary" />
                <span className="text-xs font-semibold text-brown">{orders.length} Pesanan</span>
              </div>
              {orders.filter(o => o.paymentStatus === 'unpaid').length > 0 && (
                <div className="bg-warning/10 rounded-badge border border-warning/30 px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-brown/70">
                    {orders.filter(o => o.paymentStatus === 'unpaid').length} Belum Bayar
                  </span>
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-brown/5 flex items-center justify-center mx-auto mb-4">
                  <PackageSearch size={32} className="text-brown/30" />
                </div>
                <p className="text-brown/60 font-semibold mb-1">Belum ada pesanan</p>
                <p className="text-brown/40 text-sm">Nomor WhatsApp ini belum pernah memesan</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/order')}
                >
                  Buat Pesanan Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA sebelum search */}
        {orders === null && !loading && (
          <div className="text-center py-8 text-brown/40">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Masukkan nomor WhatsApp untuk melihat pesananmu</p>
          </div>
        )}
      </div>
      <CustomerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </main>
  );
}
