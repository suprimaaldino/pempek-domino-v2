'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  Clock, 
  CreditCard, 
  MessageCircle, 
  CheckCircle2, 
  Edit,
  Trash2,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { getOrder, updateOrderStatus, updateOrder, deleteOrder } from '@/lib/firestore';
import { 
  formatRupiah, 
  formatDateId, 
  formatWhatsApp, 
  generateWhatsAppLink,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS
} from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge, Badge } from '@/components/ui/Badge';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(orderId);
        if (!data) {
          toastError('Pesanan tidak ditemukan');
          router.push('/admin/orders');
          return;
        }
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, router, toastError]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrder({ ...order, status: newStatus });
      toastSuccess(`Pesanan ditandai sebagai ${ORDER_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      toastError('Gagal memperbarui status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentToggle = async () => {
    if (!order) return;
    setUpdating(true);
    const newStatus: PaymentStatus = order.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      await updateOrder(orderId, { paymentStatus: newStatus });
      setOrder({ ...order, paymentStatus: newStatus });
      toastSuccess(`Pembayaran ditandai sebagai ${PAYMENT_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      toastError('Gagal memperbarui status pembayaran');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      await deleteOrder(orderId);
      toastSuccess('Pesanan berhasil dihapus');
      router.push('/admin/orders');
    } catch (err) {
      toastError('Gagal menghapus pesanan');
      setUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const shareToWA = () => {
    if (!order) return;
    const msg = `Halo ${order.customerName}, pesanan kamu *${order.orderNumber}* sedang kami proses. Status saat ini: *${ORDER_STATUS_LABELS[order.status]}*.`;
    window.open(generateWhatsAppLink(order.whatsappNumber, msg), '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brown/60 hover:text-brown transition-colors text-sm font-semibold w-fit"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display font-bold text-2xl text-brown">Detail Pesanan</h1>
              <Badge label={order.orderNumber} variant="neutral" className="font-mono" />
            </div>
            <p className="text-brown/50 text-sm">
              Dibuat pada {formatDateId(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareToWA}>
              <MessageCircle size={16} />
              WhatsApp
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Stepper Card */}
          <Card>
            <CardBody className="py-6">
              <StatusStepper status={order.status} />
              
              <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-brown/5">
                {order.status === 'pending' && (
                  <Button size="sm" onClick={() => handleStatusUpdate('ready')} loading={updating}>
                    Tandai Siap
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(order.deliveryMethod === 'delivery' ? 'delivered' : 'completed')} loading={updating}>
                    {order.deliveryMethod === 'delivery' ? 'Tandai Dikirim' : 'Tandai Selesai'}
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button size="sm" onClick={() => handleStatusUpdate('completed')} loading={updating}>
                    Tandai Selesai
                  </Button>
                )}
                {order.status === 'completed' && (
                  <Button variant="outline" size="sm" disabled>
                    <CheckCircle2 size={16} />
                    Sudah Selesai
                  </Button>
                )}
                <Button 
                  variant={order.paymentStatus === 'paid' ? 'outline' : 'secondary'} 
                  size="sm" 
                  onClick={handlePaymentToggle} 
                  loading={updating}
                >
                  {order.paymentStatus === 'paid' ? 'Belum Bayar' : 'Sudah Bayar'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Items Detail */}
          <Card>
            <CardBody>
              <h2 className="font-display font-bold text-lg text-brown mb-4">Item Pesanan</h2>
              <div className="divide-y divide-brown/5">
                {order.items.map((item, i) => (
                  <div key={i} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-brown">{item.productName}</p>
                      <p className="text-xs text-brown/50">
                        {formatRupiah(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-brown">{formatRupiah(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-brown/10 space-y-2">
                <div className="flex justify-between text-sm text-brown/60">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-brown/60">
                    <span>Ongkos Kirim</span>
                    <span>{formatRupiah(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-primary pt-1">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Customer & Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <h3 className="font-semibold text-brown flex items-center gap-2">
                <User size={16} className="text-primary" />
                Informasi Pelanggan
              </h3>
              <div className="space-y-3 pt-2 text-sm">
                <div>
                  <label className="text-xs text-brown/40 block">Nama</label>
                  <p className="font-semibold text-brown">{order.customerName}</p>
                </div>
                <div>
                  <label className="text-xs text-brown/40 block">WhatsApp</label>
                  <a 
                    href={`tel:${order.whatsappNumber}`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone size={12} />
                    {formatWhatsApp(order.whatsappNumber)}
                  </a>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h3 className="font-semibold text-brown flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                Pengiriman & Pembayaran
              </h3>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-brown/60">Metode</span>
                  <Badge 
                    label={DELIVERY_METHOD_LABELS[order.deliveryMethod]} 
                    variant="neutral" 
                  />
                </div>
                {order.deliveryMethod === 'pickup' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-brown/60">Waktu Ambil</span>
                    <span className="font-semibold text-brown text-right">{order.pickupDateTime}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-brown/60 block mb-1">Alamat</span>
                    <p className="text-brown font-medium leading-relaxed">{order.deliveryAddress}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-brown/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-brown/60">Bank/E-Wallet</span>
                    <span className="font-semibold text-brown">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod ?? 'qris']}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brown/60">Status Bayar</span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {order.notes && (
            <Card className="bg-cream border-secondary/20 shadow-none">
              <CardBody>
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Catatan Pesanan</h3>
                <p className="text-sm text-brown italic">"{order.notes}"</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        title="Hapus Pesanan?"
        size="sm"
      >
        <p className="text-brown/70 text-sm mb-6">
          Apakah Anda yakin ingin menghapus pesanan <strong>{order.orderNumber}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} loading={updating}>Ya, Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
