'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, MessageCircle, RefreshCcw, Truck, MapPin, Clock, ClipboardList } from 'lucide-react';
import { getOrder } from '@/lib/firestore';
import { getBusinessSettings } from '@/lib/firestore';
import { formatRupiah, formatDateId, formatWhatsApp, generateWhatsAppLink, PAYMENT_METHOD_LABELS, DELIVERY_METHOD_LABELS } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { Order, BusinessSettings } from '@/types';

export default function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOrder(orderId),
      getBusinessSettings(),
    ]).then(([ord, sett]) => {
      setOrder(ord);
      setSettings(sett);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const buildWhatsAppMessage = (ord: Order): string => {
    const lines = [
      `🧾 *PESANAN BARU — Pempek Domino*`,
      `No. Pesanan: ${ord.orderNumber}`,
      ``,
      `👤 *Pemesan:* ${ord.customerName}`,
      `📱 *WhatsApp:* ${formatWhatsApp(ord.whatsappNumber)}`,
      ``,
      `📦 *Detail Pesanan:*`,
      ...ord.items.map((i) => `• ${i.productName} x${i.quantity} = ${formatRupiah(i.subtotal)}`),
      ``,
      `💳 *Pembayaran:* ${PAYMENT_METHOD_LABELS[ord.paymentMethod ?? 'qris']}`,
      `🚚 *Pengiriman:* ${DELIVERY_METHOD_LABELS[ord.deliveryMethod]}`,
      ord.deliveryMethod === 'pickup' && ord.pickupDateTime
        ? `🕒 *Waktu Ambil:* ${ord.pickupDateTime}`
        : '',
      ord.deliveryMethod === 'delivery' && ord.deliveryAddress
        ? `📍 *Alamat:* ${ord.deliveryAddress}`
        : '',
      ``,
      `💰 *Subtotal:* ${formatRupiah(ord.subtotal)}`,
      ord.deliveryFee > 0 ? `🛵 *Ongkir:* ${formatRupiah(ord.deliveryFee)}` : '',
      `✅ *Total:* ${formatRupiah(ord.total)}`,
      ord.notes ? `\n📝 *Catatan:* ${ord.notes}` : '',
    ].filter(Boolean).join('\n');
    return lines;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-4 max-w-lg mx-auto">
        <div className="space-y-4 mt-10">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-center">
        <p className="text-brown/60 text-lg mb-4">Pesanan tidak ditemukan.</p>
        <Button onClick={() => router.push('/order')}>Buat Pesanan Baru</Button>
      </div>
    );
  }

  const waPhone = settings?.whatsappNumber ?? '6281776400024';
  const waLink = generateWhatsAppLink(waPhone, buildWhatsAppMessage(order));

  return (
    <main className="min-h-screen bg-neutral-50 pb-8">
      {/* Success header */}
      <div className="bg-primary px-4 pt-safe-top pb-10 text-white text-center">
        <div className="max-w-lg mx-auto pt-6">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h1 className="font-bold text-2xl mb-1">Pesanan Masuk!</h1>
          <p className="text-white/70 text-sm">Kami akan segera memproses pesananmu</p>
          <div className="mt-4 bg-white/10 rounded-xl px-5 py-2.5 inline-block">
            <p className="text-white/60 text-xs mb-0.5">No. Pesanan</p>
            <p className="font-mono font-bold text-lg tracking-wide">{order.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-3">
        {/* Status */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Status Pesanan</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 mb-1">Status Pembayaran</p>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
              {order.createdAt && formatDateId(order.createdAt)}
            </div>
          </CardBody>
        </Card>

        {/* Delivery info */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-3 font-semibold text-brown">
              {order.deliveryMethod === 'delivery' ? <Truck size={16} /> : <MapPin size={16} />}
              <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</span>
            </div>
            {order.deliveryMethod === 'pickup' && order.pickupDateTime && (
              <div className="flex items-center gap-2 text-sm text-brown/70">
                <Clock size={14} />
                <span>{order.pickupDateTime}</span>
              </div>
            )}
            {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
              <p className="text-sm text-brown/70">{order.deliveryAddress}</p>
            )}
          </CardBody>
        </Card>

        {/* Order items */}
        <Card>
          <CardBody>
            <h2 className="font-bold text-neutral-900 mb-3">Detail Pesanan</h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-700">
                    {item.productName}{' '}
                    <span className="text-neutral-400">x{item.quantity}</span>
                  </span>
                  <span className="font-semibold text-neutral-800">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
              <div className="border-t border-neutral-100 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-neutral-400">
                    <span>Ongkir</span>
                    <span>{formatRupiah(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-900 text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatRupiah(order.total)}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment proof */}
        {order.paymentProofUrl && (
          <Card>
            <CardBody>
              <h2 className="font-display font-semibold text-brown mb-3">Bukti Pembayaran</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.paymentProofUrl}
                alt="Bukti pembayaran"
                className="w-full max-h-64 object-contain rounded-input border border-brown/10"
              />
            </CardBody>
          </Card>
        )}

        {/* Payment reminder */}
        {order.paymentStatus === 'unpaid' && (
          <div className="bg-warning/10 border border-warning/20 rounded-card p-3">
            <p className="text-sm font-semibold text-neutral-800 mb-0.5">💳 Segera Lakukan Pembayaran</p>
            <p className="text-xs text-neutral-500">
              Bayar via {PAYMENT_METHOD_LABELS[order.paymentMethod ?? 'qris']} dan kirim bukti pembayaran ke WhatsApp kami.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke WhatsApp">
            <Button className="w-full" size="lg">
              <MessageCircle size={18} />
              Bagikan ke WhatsApp
            </Button>
          </a>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push('/my-orders')}
          >
            <ClipboardList size={18} />
            Cek Status Pesanan
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => router.push('/order')}
          >
            <RefreshCcw size={18} />
            Buat Pesanan Baru
          </Button>
        </div>
      </div>
    </main>
  );
}
