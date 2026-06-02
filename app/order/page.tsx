'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, CreditCard, Smartphone, Building2, QrCode, UtensilsCrossed } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { RadioCard } from '@/components/ui/RadioCard';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/order/ProductCard';
import { OrderSummarySheet } from '@/components/order/OrderSummarySheet';
import { PaymentPreview } from '@/components/order/PaymentPreview';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useOrderStore } from '@/store/orderStore';
import { useProducts } from '@/hooks/useProducts';
import { createOrder, generateOrderNumber, upsertCustomer, getPaymentConfig, seedProductsIfEmpty } from '@/lib/firestore';
import { normalizePhone, CATEGORY_LABELS } from '@/lib/utils';
import type { PaymentConfig, PaymentMethod, DeliveryMethod } from '@/types';

const schema = z.object({
  customerName: z.string().min(2, 'Nama minimal 2 karakter'),
  whatsappNumber: z
    .string()
    .regex(/^(08|628|\+628)[0-9]{8,11}$/, 'Nomor WhatsApp tidak valid (contoh: 081234567890)'),
  notes: z.string(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  pickupDateTime: z.string(),
  deliveryAddress: z.string(),
  deliveryFee: z.any().transform((v) => Number(v) || 0),
  paymentMethod: z.enum(['qris', 'dana', 'transfer']),
}).refine(
  (d) => d.deliveryMethod !== 'pickup' || d.pickupDateTime.length > 0,
  { message: 'Pilih waktu pengambilan', path: ['pickupDateTime'] }
).refine(
  (d) => d.deliveryMethod !== 'delivery' || d.deliveryAddress.length > 0,
  { message: 'Masukkan alamat pengiriman', path: ['deliveryAddress'] }
);

type FormValues = {
  customerName: string;
  whatsappNumber: string;
  notes: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupDateTime: string;
  deliveryAddress: string;
  deliveryFee: number;
  paymentMethod: 'qris' | 'dana' | 'transfer';
};

export default function OrderPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { items, subtotal, setCustomerInfo, setDelivery, setPaymentMethod, clearCart } = useOrderStore();
  const { grouped, loading: productsLoading } = useProducts();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      whatsappNumber: '',
      notes: '',
      deliveryMethod: 'pickup',
      paymentMethod: 'qris',
      deliveryFee: 0,
      pickupDateTime: '',
      deliveryAddress: '',
    },
  });

  const deliveryMethod = watch('deliveryMethod');
  const paymentMethodVal = watch('paymentMethod');
  const deliveryFeeVal = watch('deliveryFee');

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig).catch(() => {});
    seedProductsIfEmpty().catch(() => {});
  }, []);

  useEffect(() => {
    setDelivery({
      deliveryMethod: deliveryMethod as DeliveryMethod,
      deliveryFee: deliveryMethod === 'delivery' ? (deliveryFeeVal ?? 0) : 0,
    });
  }, [deliveryMethod, deliveryFeeVal, setDelivery]);

  useEffect(() => {
    setPaymentMethod(paymentMethodVal as PaymentMethod);
  }, [paymentMethodVal, setPaymentMethod]);

  const onSubmit = async (data: FormValues) => {
    if (items.length === 0) {
      toastError('Pilih minimal 1 menu terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const phone = normalizePhone(data.whatsappNumber);
      const orderNumber = await generateOrderNumber();
      const fee = data.deliveryMethod === 'delivery' ? (data.deliveryFee ?? 0) : 0;
      const sub = subtotal;
      const total = sub + fee;

      const orderItems = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));

      const orderId = await createOrder({
        orderNumber,
        customerName: data.customerName,
        whatsappNumber: phone,
        deliveryMethod: data.deliveryMethod,
        pickupDateTime: data.deliveryMethod === 'pickup' ? data.pickupDateTime : undefined,
        deliveryAddress: data.deliveryMethod === 'delivery' ? data.deliveryAddress : undefined,
        deliveryFee: fee,
        items: orderItems,
        subtotal: sub,
        total,
        status: 'pending',
        paymentMethod: data.paymentMethod,
        paymentStatus: 'unpaid',
        notes: data.notes,
      });

      await upsertCustomer(data.customerName, phone, total);

      clearCart();
      toastSuccess('Pesanan berhasil dibuat!');
      router.push(`/confirmation/${orderId}`);
    } catch (err) {
      console.error(err);
      toastError('Gagal membuat pesanan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryKeys = ['kecil', 'besar', 'paket'] as const;

  return (
    <main className="min-h-screen bg-cream pb-40">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-safe-top pb-6">
        <div className="max-w-lg mx-auto pt-4">
          <div className="flex items-center gap-3 mb-1">
            <UtensilsCrossed size={24} />
            <h1 className="font-display font-bold text-xl">Pempek Domino</h1>
          </div>
          <p className="text-white/70 text-sm">Pesan Pempek Palembang, Nikmat di Mana Saja</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="max-w-lg mx-auto px-4 space-y-6 mt-6">

          {/* Section 1: Data Pemesan */}
          <section aria-labelledby="section-pemesan">
            <h2 id="section-pemesan" className="font-display font-bold text-brown text-lg mb-3">
              1. Data Pemesan
            </h2>
            <div className="bg-white rounded-card shadow-card p-4 space-y-4">
              <Input
                label="Nama Lengkap"
                placeholder="Contoh: Budi Santoso"
                error={errors.customerName?.message}
                {...register('customerName', {
                  onChange: (e) => setCustomerInfo({ customerName: e.target.value }),
                })}
              />
              <Input
                label="Nomor WhatsApp"
                placeholder="08xxxxxxxxxx"
                type="tel"
                inputMode="tel"
                error={errors.whatsappNumber?.message}
                helperText="Format: 08xxxxxxxxxx atau +62xxxxxxxxx"
                {...register('whatsappNumber', {
                  onChange: (e) => setCustomerInfo({ whatsappNumber: e.target.value }),
                })}
              />
              <Textarea
                label="Catatan (opsional)"
                placeholder="Contoh: tanpa cuka, sambal terpisah..."
                {...register('notes', {
                  onChange: (e) => setCustomerInfo({ notes: e.target.value }),
                })}
              />
            </div>
          </section>

          {/* Section 2: Pilihan Pengiriman */}
          <section aria-labelledby="section-pengiriman">
            <h2 id="section-pengiriman" className="font-display font-bold text-brown text-lg mb-3">
              2. Pilihan Pengiriman
            </h2>
            <div className="space-y-2">
              <RadioCard
                id="delivery-pickup"
                name="deliveryMethod"
                value="pickup"
                checked={deliveryMethod === 'pickup'}
                onChange={(v) => setValue('deliveryMethod', v as 'pickup' | 'delivery')}
                label="Ambil Sendiri"
                description="Ambil di tempat sesuai jadwal"
                icon={<MapPin size={18} />}
              />
              <RadioCard
                id="delivery-send"
                name="deliveryMethod"
                value="delivery"
                checked={deliveryMethod === 'delivery'}
                onChange={(v) => setValue('deliveryMethod', v as 'pickup' | 'delivery')}
                label="Dikirim"
                description="Diantar ke alamat kamu"
                icon={<Truck size={18} />}
              />
            </div>

            <div className="mt-3 bg-white rounded-card shadow-card p-4">
              {deliveryMethod === 'pickup' ? (
                <Input
                  label="Tanggal & Jam Ambil"
                  type="datetime-local"
                  error={errors.pickupDateTime?.message}
                  {...register('pickupDateTime')}
                />
              ) : (
                <div className="space-y-3">
                  <Textarea
                    label="Alamat Lengkap"
                    placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
                    error={errors.deliveryAddress?.message}
                    {...register('deliveryAddress')}
                  />
                  <Input
                    label="Ongkos Kirim (Rp)"
                    type="number"
                    inputMode="numeric"
                    placeholder="10000"
                    helperText="Diskusikan dengan penjual"
                    {...register('deliveryFee')}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Metode Pembayaran */}
          <section aria-labelledby="section-pembayaran">
            <h2 id="section-pembayaran" className="font-display font-bold text-brown text-lg mb-3">
              3. Metode Pembayaran
            </h2>
            <div className="space-y-2">
              <RadioCard
                id="pay-qris"
                name="paymentMethod"
                value="qris"
                checked={paymentMethodVal === 'qris'}
                onChange={(v) => setValue('paymentMethod', v as PaymentMethod)}
                label="QRIS"
                description="Scan QR untuk bayar"
                icon={<QrCode size={18} />}
              />
              <RadioCard
                id="pay-dana"
                name="paymentMethod"
                value="dana"
                checked={paymentMethodVal === 'dana'}
                onChange={(v) => setValue('paymentMethod', v as PaymentMethod)}
                label="Dana"
                description="Transfer ke akun Dana"
                icon={<Smartphone size={18} />}
              />
              <RadioCard
                id="pay-transfer"
                name="paymentMethod"
                value="transfer"
                checked={paymentMethodVal === 'transfer'}
                onChange={(v) => setValue('paymentMethod', v as PaymentMethod)}
                label="Transfer Bank"
                description="Transfer ke rekening bank"
                icon={<Building2 size={18} />}
              />
            </div>
            <PaymentPreview method={paymentMethodVal} config={paymentConfig} />
          </section>

          {/* Section 4: Pilih Menu */}
          <section aria-labelledby="section-menu">
            <h2 id="section-menu" className="font-display font-bold text-brown text-lg mb-3">
              4. Pilih Menu
            </h2>

            {productsLoading ? (
              <SkeletonList count={3} />
            ) : (
              categoryKeys.map((cat) => {
                const prods = grouped[cat];
                if (!prods.length) return null;
                return (
                  <div key={cat} className="mb-6">
                    <h3 className="font-semibold text-brown/70 text-sm uppercase tracking-wide mb-2">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {prods.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>

        </div>

        <OrderSummarySheet onSubmit={handleSubmit(onSubmit)} loading={submitting} />
      </form>
    </main>
  );
}
