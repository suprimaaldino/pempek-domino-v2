'use client';

import { useState, useEffect, useCallback } from 'react';
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
  XCircle,
} from 'lucide-react';
import { getBusinessSettings } from '@/lib/firestore';
import { getFirebaseToken } from '@/lib/auth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { formatRupiah, formatDateId, DELIVERY_METHOD_LABELS, cn } from '@/lib/utils';
import type { Order, BusinessSettings } from '@/types';

// ─── Saved Orders (localStorage) ──────────────────────────────────────────────

interface SavedOrder {
  orderNumber: string;
  orderId: string;
  customerName: string;
}

function getSavedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem('pempek-domino-orders') || '[]');
  } catch {
    return [];
  }
}

// ─── Order Detail Card ─────────────────────────────────────────────────────────

function OrderDetailCard({
  order,
  settings,
  onCancelled,
}: {
  order: Order;
  settings?: BusinessSettings | null;
  onCancelled?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/order/${encodeURIComponent(order.orderNumber)}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membatalkan pesanan');
      onCancelled?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

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
          <div className="space-y-2">
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
            {order.deliveryMethod === 'pickup' && settings?.address && (
              <div className="rounded bg-neutral-50 p-2.5 border border-neutral-100 text-xs text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-800">Alamat Toko:</p>
                <p>{settings.address}</p>
                {settings.googleMapsUrl && (
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold mt-0.5"
                  >
                    <MapPin size={10} />
                    Lihat di Google Maps
                  </a>
                )}
              </div>
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
                Informasi pembayaran tersedia di halaman konfirmasi. Abaikan jika sudah dibayar.
              </p>
            </div>
          )}

          {/* Cancel order (only for pending) */}
          {order.status === 'pending' && (
            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={handleCancel}
                loading={cancelling}
              >
                <XCircle size={15} />
                Batalkan Pesanan
              </Button>
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
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

  // Account-scoped order history (only when authenticated)
  useCustomerAuth();
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isAuthed) {
      setMyOrders([]);
      return;
    }
    setMyOrdersLoading(true);
    (async () => {
      try {
        const token = await getFirebaseToken();
        if (!token) return;
        const response = await fetch('/api/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (active) setMyOrders((data.orders ?? []) as Order[]);
        }
      } catch {
        // Non-fatal — guest flow still works if this fails.
      } finally {
        if (active) setMyOrdersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // Load saved orders from localStorage + auto-load most recent
  useEffect(() => {
    getBusinessSettings().then(setSettings).catch(console.error);
    const saved = getSavedOrders();
    setSavedOrders(saved);
    // Auto-load most recent saved order if no order is currently viewed
    if (saved.length > 0 && !order) {
      loadOrderByNumber(saved[saved.length - 1].orderNumber);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOrderByNumber(orderNum: string) {
    setOrderNumber(orderNum);
    setLoading(true);
    setError('');
    setOrder(undefined);
    try {
      const response = await fetch(`/api/order/${encodeURIComponent(orderNum)}`);
      if (!response.ok) {
        if (response.status === 404) {
          setOrder(null);
          setError('');
          // Remove from saved if not found
          const updated = getSavedOrders().filter(s => s.orderNumber !== orderNum);
          localStorage.setItem('pempek-domino-orders', JSON.stringify(updated));
          setSavedOrders(updated);
        } else {
          throw new Error('Failed to fetch');
        }
      } else {
        const data = await response.json();
        setOrder({ id: data.orderNumber, ...data } as Order);
      }
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    await loadOrderByNumber(trimmed);
  }

  function handleOrderCancelled() {
    // Refresh the current order to show cancelled status
    if (order) {
      loadOrderByNumber(order.orderNumber);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 animate-page-in">
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

        {/* Account-scoped order history (authenticated users only) */}
        {isAuthed && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              Riwayat Pesanan Saya
            </p>
            {myOrdersLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : myOrders.length > 0 ? (
              <div className="space-y-3">
                {myOrders.map((o) => (
                  <ErrorBoundary key={o.id}>
                    <OrderDetailCard order={o} settings={settings} onCancelled={handleOrderCancelled} />
                  </ErrorBoundary>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-neutral-400 text-sm bg-white rounded-card border border-neutral-100 shadow-card">
                Belum ada pesanan pada akun ini.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSearch} className="mb-6 bg-white rounded-card shadow-card border border-neutral-100 p-4 space-y-3">
          <Input
            label="Nomor Pesanan"
            placeholder="Contoh: PD-20260825-001-X7K9"
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value);
              setError('');
            }}
            error={error}
            helperText="Atau pilih dari pesanan tersimpan di bawah"
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

        {loading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonList count={2} />
          </div>
        )}

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
        {order && (
          <ErrorBoundary>
            <OrderDetailCard order={order} settings={settings} onCancelled={handleOrderCancelled} />
          </ErrorBoundary>
        )}

        {/* Saved orders from localStorage */}
        {savedOrders.length > 0 && !order && !loading && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Pesanan Tersimpan</p>
            <div className="flex flex-wrap gap-2">
              {savedOrders.map((saved) => (
                <button
                  key={saved.orderNumber}
                  onClick={() => loadOrderByNumber(saved.orderNumber)}
                  className="bg-white border border-neutral-200 rounded-card px-3 py-2 text-left hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                >
                  <p className="font-mono text-xs font-bold text-primary">{saved.orderNumber}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{saved.customerName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA sebelum search */}
        {order === undefined && !loading && savedOrders.length === 0 && (
          <div className="text-center py-10 text-neutral-400">
            <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Masukkan nomor pesanan untuk melihat statusnya</p>
            <p className="text-xs mt-1 text-neutral-300">
              Nomor pesanan tersedia di halaman konfirmasi (contoh: PD-20260825-001-X7K9)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
