'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, MapPin, Smartphone, Building2, QrCode, ShieldCheck, ClipboardList, Upload, ChevronDown } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import appleIcon from '../apple-icon.png';
import { Input, Textarea } from '@/components/ui/Input';
import { RadioCard } from '@/components/ui/RadioCard';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/order/ProductCard';
import { OrderSummarySheet } from '@/components/order/OrderSummarySheet';
import { PaymentPreview } from '@/components/order/PaymentPreview';
import { StoreLocationPreview } from '@/components/order/StoreLocationPreview';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useOrderStore } from '@/store/orderStore';
import { useProducts } from '@/hooks/useProducts';
import { createOrder, generateOrderNumber, upsertCustomer, getPaymentConfig, seedProductsIfEmpty, getBusinessSettings } from '@/lib/firestore';
import { normalizePhone, CATEGORY_LABELS } from '@/lib/utils';
import type { PaymentConfig, PaymentMethod, DeliveryMethod, BusinessSettings } from '@/types';

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
  paymentMethod: z.string().min(1, 'Pilih metode pembayaran'),
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
  paymentMethod: string;
};

export default function OrderPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { items, subtotal, setCustomerInfo, setDelivery, setPaymentMethod, clearCart } = useOrderStore();
  const { grouped, loading: productsLoading } = useProducts();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    kecil: true,
    besar: false,
    paket: false,
  });

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
    getPaymentConfig().then((pay) => {
      setPaymentConfig(pay);
      if (pay?.methods) {
        const firstActive = pay.methods.find((m) => m.isActive);
        if (firstActive) {
          setValue('paymentMethod', firstActive.id);
        }
      }
    }).catch(() => {});
    getBusinessSettings().then((biz) => {
      setBusinessSettings(biz);
    }).catch(() => {});
    seedProductsIfEmpty().catch(() => {});
  }, [setValue]);

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
        pickupDateTime: data.deliveryMethod === 'pickup' ? data.pickupDateTime : null,
        deliveryAddress: data.deliveryMethod === 'delivery' ? data.deliveryAddress : null,
        deliveryFee: fee,
        items: orderItems,
        subtotal: sub,
        total,
        status: 'pending',
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentStatus: 'unpaid',
        ...(paymentProofUrl ? { paymentProofUrl } : {}),
        notes: data.notes || '',
      });

      try {
        await upsertCustomer(data.customerName, phone, total);
      } catch (custErr) {
        console.error('Failed to upsert customer details:', custErr);
      }

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
  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-44">
      {/* Header — clean white with red accent */}
      <div className="bg-white border-b border-neutral-100 px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto pt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-visible shrink-0 flex items-center justify-center">
              <Image src="/icons/icon-192.png" alt="Logo Pempek Domino" width={40} height={40} className="w-10 h-10 object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 text-base leading-tight">Pempek Domino</h1>
              <p className="text-xs text-neutral-400">Pesan Pempek Palembang</p>
            </div>
          </div>
          <Link
            href="/my-orders"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors border border-neutral-200"
          >
            <ClipboardList size={14} />
            Cek Pesanan
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="max-w-lg mx-auto px-4 space-y-8 mt-6">

          {/* Section 1: Pilih Menu */}
          <section aria-labelledby="section-menu">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">1</span>
              <h2 id="section-menu" className="font-bold text-neutral-900 text-base">Pilih Menu</h2>
            </div>

            {productsLoading ? (
              <SkeletonList count={4} />
            ) : (
              categoryKeys.map((cat) => {
                const prods = grouped[cat];
                if (!prods.length) return null;
                const isExpanded = expandedCategories[cat];
                return (
                  <div key={cat} className="mb-5">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between gap-3 rounded-card border border-neutral-100 bg-white px-3 py-3 shadow-card text-left"
                      aria-expanded={isExpanded}
                      aria-controls={`category-${cat}`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                          {CATEGORY_LABELS[cat]}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{prods.length} menu</p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {isExpanded && (
                      <div id={`category-${cat}`} className="space-y-2 mt-2">
                        {prods.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Section 2: Data Pemesan */}
          <section aria-labelledby="section-pemesan">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">2</span>
              <h2 id="section-pemesan" className="font-bold text-neutral-900 text-base">Data Pemesan</h2>
            </div>
            <div className="bg-white rounded-card shadow-card border border-neutral-100 p-4 space-y-4">
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

          {/* Section 3: Pengiriman */}
          <section aria-labelledby="section-pengiriman">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">3</span>
              <h2 id="section-pengiriman" className="font-bold text-neutral-900 text-base">Pengiriman</h2>
            </div>
            <div className="space-y-2">
              <RadioCard
                id="delivery-pickup"
                name="deliveryMethod"
                value="pickup"
                checked={deliveryMethod === 'pickup'}
                onChange={(v) => setValue('deliveryMethod', v as 'pickup' | 'delivery')}
                label="Ambil Sendiri"
                description="Ambil di tempat sesuai jadwal"
                icon={<MapPin size={16} />}
              />
              <RadioCard
                id="delivery-send"
                name="deliveryMethod"
                value="delivery"
                checked={deliveryMethod === 'delivery'}
                onChange={(v) => setValue('deliveryMethod', v as 'pickup' | 'delivery')}
                label="Dikirim"
                description="Diantar ke alamat kamu"
                icon={<Truck size={16} />}
              />
            </div>

            {deliveryMethod === 'pickup' ? (
              <div className="mt-2 space-y-2">
                {/* Tanggal & Jam Ambil */}
                <div className="bg-white rounded-card shadow-card border border-neutral-100 p-4">
                  <Input
                    label="Tanggal & Jam Ambil"
                    type="datetime-local"
                    error={errors.pickupDateTime?.message}
                    {...register('pickupDateTime')}
                  />
                </div>

                {/* Lokasi Toko — hanya tampil saat Ambil Sendiri */}
                <StoreLocationPreview settings={businessSettings} />
              </div>
            ) : (
              <div className="mt-2 bg-white rounded-card shadow-card border border-neutral-100 p-4">
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
              </div>
            )}
          </section>

          {/* Section 4: Pembayaran */}
          <section aria-labelledby="section-pembayaran">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">4</span>
              <h2 id="section-pembayaran" className="font-bold text-neutral-900 text-base">Pembayaran</h2>
            </div>
            <div className="space-y-2">
              {(paymentConfig?.methods?.filter(m => m.isActive) || [
                { id: 'qris', name: 'QRIS', provider: 'QRIS', methodType: 'qris' as const },
                { id: 'dana', name: 'Dana', provider: 'Dana', methodType: 'dana' as const },
                { id: 'transfer', name: 'Transfer Bank', provider: 'BCA', methodType: 'transfer' as const }
              ]).map((method) => (
                <RadioCard
                  key={method.id}
                  id={`pay-${method.id}`}
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethodVal === method.id}
                  onChange={(v) => setValue('paymentMethod', v)}
                  label={method.name}
                  description={
                    method.methodType === 'qris'
                      ? 'Scan QR untuk bayar'
                      : method.methodType === 'dana'
                      ? `Transfer ke akun ${method.provider}`
                      : `Transfer ke rekening ${method.provider}`
                  }
                  icon={
                    method.methodType === 'qris' ? (
                      <QrCode size={16} />
                    ) : method.methodType === 'dana' ? (
                      <Smartphone size={16} />
                    ) : (
                      <Building2 size={16} />
                    )
                  }
                />
              ))}
            </div>
            <PaymentPreview method={paymentMethodVal} config={paymentConfig} />

            {/* Upload Bukti Pembayaran */}
            <div className="mt-3 bg-white rounded-card shadow-card border border-neutral-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload size={14} className="text-primary" />
                <p className="font-semibold text-neutral-800 text-sm">Upload Bukti Pembayaran</p>
                <span className="ml-auto text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-pill">opsional</span>
              </div>
              <ImageUpload
                label=""
                currentUrl={paymentProofUrl}
                storagePath="payment-proofs"
                onUploaded={(url) => setPaymentProofUrl(url)}
              />
              <p className="text-xs text-neutral-400 mt-2">Upload sekarang atau kirim via WhatsApp setelah pesan dibuat.</p>
            </div>
          </section>

        </div>

        <OrderSummarySheet onSubmit={handleSubmit(onSubmit)} loading={submitting} />
      </form>
    </main>
  );
}
