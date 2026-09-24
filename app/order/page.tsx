'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, MapPin, Smartphone, Building2, QrCode, ClipboardList, ChevronDown, LogIn, LogOut } from 'lucide-react';
// Payment proof upload via Firebase Storage — disabled (via WhatsApp instead).
// Requires Blaze Storage; re-enable when available.
// import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input, Textarea } from '@/components/ui/Input';
import { RadioCard } from '@/components/ui/RadioCard';
import { ProductCard } from '@/components/order/ProductCard';
import { OrderSummarySheet } from '@/components/order/OrderSummarySheet';
import { PaymentPreview } from '@/components/order/PaymentPreview';
import { StoreLocationPreview } from '@/components/order/StoreLocationPreview';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useOrderStore } from '@/store/orderStore';
import { useProducts } from '@/hooks/useProducts';
import { getPaymentConfig, getBusinessSettings, getOrCreateUser, updateUserPhone } from '@/lib/firestore';
import { getCurrentUser, getFirebaseToken, signInWithGoogleCustomer, logoutCustomer } from '@/lib/auth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useAuthStore } from '@/store/authStore';
import { normalizePhone, CATEGORY_LABELS } from '@/lib/utils';
import { validateOrderData } from '@/lib/sanitize';
import type { PaymentConfig, PaymentMethod, DeliveryMethod, BusinessSettings } from '@/types';

const schema = z.object({
  customerName: z.string().min(2, 'Nama minimal 2 karakter'),
  whatsappNumber: z
    .string()
    .min(1, 'Nomor WhatsApp wajib diisi')
    // Accept local (08xx), intl (628xx / +628xx); normalizePhone → 628 for storage
    .refine(
      (v) => /^628[0-9]{8,12}$/.test(normalizePhone(v)),
      'Nomor WhatsApp tidak valid (contoh: 081234567890)'
    ),
  notes: z.string(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  pickupDateTime: z.string(),
  deliveryAddress: z.string(),
  deliveryFee: z.coerce.number().min(0),
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

  // Optional customer auth (soft-auth): never blocks ordering, never clears
  // the cart/order state (which lives in the separate orderStore).
  useCustomerAuth();
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const [authBusy, setAuthBusy] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProofUrl] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    kecil: true,
    paket: false,
    sup_kuah: false,
    minuman: false,
    lainnya: false,
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
    }).catch(() => {
      toastError('Gagal memuat konfigurasi pembayaran. Beberapa fitur mungkin terbatas.');
    });
    getBusinessSettings().then((biz) => {
      setBusinessSettings(biz);
    }).catch(() => {
      toastError('Gagal memuat informasi toko.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Prefill customer info from the authenticated account (Phase 6).
  // Soft-auth: only prefills if the field is still empty, so it never overwrites
  // manual entry, and never touches the cart (orderStore is separate from auth).
  useEffect(() => {
    if (!isAuthed || !authUser) return;
    const currentName = watch('customerName') || '';
    const currentPhone = watch('whatsappNumber') || '';
    if (!currentName && authUser.name) {
      setValue('customerName', authUser.name);
      setCustomerInfo({ customerName: authUser.name });
    }
    if (!currentPhone && authUser.phone) {
      setValue('whatsappNumber', authUser.phone);
      setCustomerInfo({ whatsappNumber: authUser.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, authUser]);

  const onSubmit = async (data: FormValues) => {
    if (items.length === 0) {
      toastError('Pilih minimal 1 menu terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const phone = normalizePhone(data.whatsappNumber);
      const fee = data.deliveryMethod === 'delivery' ? (data.deliveryFee ?? 0) : 0;

      // Client-side UX validation only — authoritative money math is server-side.
      const validation = validateOrderData({
        customerName: data.customerName,
        whatsappNumber: phone,
        deliveryAddress: data.deliveryAddress || undefined,
        notes: data.notes,
        deliveryFee: fee,
        total: subtotal + fee,
      });

      if (!validation.isValid) {
        toastError(validation.errors.join('. '));
        setSubmitting(false);
        return;
      }

      const { sanitizedData } = validation;

      // Optional identity for ownership stamping (server re-validates Bearer token)
      const currentUser = getCurrentUser();
      const idToken = currentUser ? await getFirebaseToken() : null;

      // Server-authoritative create: prices/totals recomputed from catalog.
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          customerName: sanitizedData.customerName,
          whatsappNumber: sanitizedData.whatsappNumber,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryMethod: data.deliveryMethod,
          pickupDateTime: data.deliveryMethod === 'pickup' ? data.pickupDateTime : null,
          deliveryAddress: data.deliveryMethod === 'delivery' ? sanitizedData.deliveryAddress : null,
          deliveryFee: sanitizedData.deliveryFee,
          paymentMethod: data.paymentMethod as PaymentMethod,
          paymentProofUrl: paymentProofUrl || null,
          notes: sanitizedData.notes,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat pesanan.');
      }

      const { orderId, orderNumber } = result as {
        orderId: string;
        orderNumber: string;
        total: number;
      };

      // Legacy client-side customer aggregate is handled server-side.
      // Stamp phone on authenticated profile (best-effort; server already stamps).
      if (currentUser) {
        try {
          await getOrCreateUser({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName });
          await updateUserPhone(currentUser.uid, sanitizedData.whatsappNumber);
        } catch (userErr) {
          console.error('Failed to stamp user phone:', userErr);
        }
      }

      clearCart();

      // Save order to localStorage for easy access on my-orders page
      try {
        const saved = JSON.parse(localStorage.getItem('pempek-domino-orders') || '[]') as Array<{ orderNumber: string; orderId: string; customerName: string }>;
        saved.push({ orderNumber, orderId, customerName: sanitizedData.customerName });
        // Keep only last 20 orders per device
        if (saved.length > 20) saved.splice(0, saved.length - 20);
        localStorage.setItem('pempek-domino-orders', JSON.stringify(saved));
      } catch { /* localStorage may be unavailable */ }

      toastSuccess('Pesanan berhasil dibuat!');
      // Navigate by orderNumber so confirmation can use the public lookup API
      // (guests cannot Firestore-get orders/{id}).
      router.push(`/confirmation/${encodeURIComponent(orderNumber)}`);
    } catch (err) {
      console.error(err);
      toastError(err instanceof Error ? err.message : 'Gagal membuat pesanan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryKeys = ['kecil', 'paket', 'sup_kuah', 'minuman', 'lainnya'] as const;
  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-44 animate-page-in">
      {/* Header — clean white with red accent */}
      <div className="bg-white border-b border-neutral-100 px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto pt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              <Image src="/icons/icon-192.png" alt="Logo Pempek Domino" width={40} height={40} className="w-10 h-10 object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 text-base leading-tight">Pempek Domino</h1>
              <p className="text-xs text-neutral-400">Pesan Pempek Palembang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/my-orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors border border-neutral-200"
            >
              <ClipboardList size={14} />
              Cek Pesanan
            </Link>
          </div>
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
                      <div id={`category-${cat}`} className="space-y-2 mt-2 animate-stagger">
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
              {/* Optional (soft-auth) customer login — never blocks ordering */}
              {isAuthed && authUser ? (
                <div className="flex items-center justify-between gap-3 rounded-input bg-primary/5 border border-primary/10 px-3 py-2">
                  <p className="text-xs text-neutral-600 truncate">
                    <span className="font-semibold text-primary">Masuk sebagai {authUser.name || authUser.email || 'pengguna'}</span>
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setAuthBusy(true);
                      try {
                        await logoutCustomer();
                      } catch {
                        toastError('Gagal keluar.');
                      } finally {
                        setAuthBusy(false);
                      }
                    }}
                    disabled={authBusy}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-error transition-colors"
                    aria-label="Keluar"
                  >
                    <LogOut size={13} />
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setAuthBusy(true);
                    try {
                      await signInWithGoogleCustomer();
                    } catch {
                      toastError('Gagal masuk. Lanjut sebagai tamu.');
                    } finally {
                      setAuthBusy(false);
                    }
                  }}
                  disabled={authBusy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-input border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-600 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <LogIn size={15} className="text-primary" />
                  {authBusy ? 'Memproses...' : 'Masuk dengan Google (opsional)'}
                </button>
              )}
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
                helperText="Contoh: 081234567890 atau 6281234567890"
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

            {/* Upload Bukti Pembayaran — DISABLED: kirim via WhatsApp (Storage butuh Blaze)
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
            */}
            <p className="mt-3 text-xs text-neutral-400">
              Bukti bayar dikirim via WhatsApp setelah pesanan dibuat.
            </p>
          </section>

        </div>

        <OrderSummarySheet onSubmit={handleSubmit(onSubmit)} loading={submitting} />
      </form>
    </main>
  );
}
