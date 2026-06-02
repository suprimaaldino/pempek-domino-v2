'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Minus, ShoppingBag, Truck, MapPin, Search } from 'lucide-react';
import { 
  createOrder, 
  generateOrderNumber, 
  upsertCustomer, 
  subscribeToProducts 
} from '@/lib/firestore';
import { formatRupiah, normalizePhone, CATEGORY_LABELS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RadioCard } from '@/components/ui/RadioCard';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { Product, OrderItem, PaymentMethod, DeliveryMethod } from '@/types';

const schema = z.object({
  customerName: z.string().min(2, 'Nama minimal 2 karakter'),
  whatsappNumber: z.string().min(1, 'Nomor WA wajib diisi'),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  pickupDateTime: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryFee: z.any().transform((v) => Number(v) || 0),
  paymentMethod: z.enum(['qris', 'dana', 'transfer']),
  paymentStatus: z.enum(['paid', 'unpaid']),
  notes: z.string().optional(),
});

type FormValues = {
  customerName: string;
  whatsappNumber: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupDateTime?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  paymentMethod: 'qris' | 'dana' | 'transfer';
  paymentStatus: 'paid' | 'unpaid';
  notes?: string;
};

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderFormModal({ isOpen, onClose }: OrderFormModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: 'pickup',
      deliveryFee: 0,
      paymentMethod: 'qris',
      paymentStatus: 'unpaid',
    },
  });

  const deliveryMethod = watch('deliveryMethod');

  useEffect(() => {
    const unsub = subscribeToProducts((data) => setProducts(data.filter(p => p.isActive)));
    return () => unsub();
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const calculateSubtotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return sum + (p?.price || 0) * qty;
    }, 0);
  };

  const onSubmit = async (data: FormValues) => {
    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
      toastError('Pilih minimal 1 menu');
      return;
    }

    setSubmitting(true);
    try {
      const phone = normalizePhone(data.whatsappNumber);
      const orderNumber = await generateOrderNumber();
      const subtotal = calculateSubtotal();
      const total = subtotal + data.deliveryFee;

      const orderItems: OrderItem[] = cartEntries.map(([id, qty]) => {
        const p = products.find(prod => prod.id === id)!;
        return {
          productId: id,
          productName: p.name,
          price: p.price,
          quantity: qty,
          subtotal: p.price * qty,
        };
      });

      await createOrder({
        orderNumber,
        customerName: data.customerName,
        whatsappNumber: phone,
        deliveryMethod: data.deliveryMethod,
        pickupDateTime: data.deliveryMethod === 'pickup' ? data.pickupDateTime : undefined,
        deliveryAddress: data.deliveryMethod === 'delivery' ? data.deliveryAddress : undefined,
        deliveryFee: data.deliveryFee,
        items: orderItems,
        subtotal,
        total,
        status: 'pending',
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
      });

      await upsertCustomer(data.customerName, phone, total);
      toastSuccess('Pesanan admin berhasil dibuat');
      reset();
      setCart({});
      onClose();
    } catch (err) {
      toastError('Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Pesanan Baru (Admin)" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Customer Details */}
          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-brown text-sm uppercase tracking-wider">Data Pelanggan</h3>
            <Input label="Nama Pelanggan" {...register('customerName')} error={errors.customerName?.message} />
            <Input label="WhatsApp" {...register('whatsappNumber')} error={errors.whatsappNumber?.message} />
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brown">Tipe Pengiriman</label>
              <div className="grid grid-cols-2 gap-2">
                <RadioCard 
                  id="adm-pickup" name="deliveryMethod" value="pickup" label="Pickup" icon={<MapPin size={14} />}
                  checked={deliveryMethod === 'pickup'} onChange={(v) => reset({ ...watch(), deliveryMethod: 'pickup' })}
                />
                <RadioCard 
                  id="adm-delivery" name="deliveryMethod" value="delivery" label="Dikirim" icon={<Truck size={14} />}
                  checked={deliveryMethod === 'delivery'} onChange={(v) => reset({ ...watch(), deliveryMethod: 'delivery' })}
                />
              </div>
            </div>

            {deliveryMethod === 'pickup' ? (
              <Input label="Waktu Ambil" type="datetime-local" {...register('pickupDateTime')} />
            ) : (
              <>
                <Textarea label="Alamat" {...register('deliveryAddress')} />
                <Input label="Ongkir (Rp)" type="number" {...register('deliveryFee')} />
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-brown/60">Status Bayar</label>
                 <select className="w-full rounded-input border border-brown/20 px-3 py-2 text-sm" {...register('paymentStatus')}>
                   <option value="unpaid">Belum Bayar</option>
                   <option value="paid">Sudah Bayar</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-brown/60">Metode</label>
                 <select className="w-full rounded-input border border-brown/20 px-3 py-2 text-sm" {...register('paymentMethod')}>
                   <option value="qris">QRIS</option>
                   <option value="dana">Dana</option>
                   <option value="transfer">Transfer</option>
                 </select>
               </div>
            </div>

            <Textarea label="Catatan" {...register('notes')} />
          </div>

          {/* Right Column: Menu Selection */}
          <div className="flex flex-col h-[500px]">
            <h3 className="font-semibold text-brown text-sm uppercase tracking-wider mb-3">Pilih Menu</h3>
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" size={16} />
              <input 
                type="text" 
                placeholder="Cari menu..." 
                className="w-full pl-10 pr-4 py-2 border border-brown/10 rounded-badge text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-input border border-brown/5 bg-white hover:border-primary/20 transition-all">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-brown truncate">{p.name}</p>
                    <p className="text-[10px] text-primary font-bold">{formatRupiah(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cart[p.id] ? (
                      <>
                        <button type="button" onClick={() => updateQty(p.id, -1)} className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center">
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{cart[p.id]}</span>
                        <button type="button" onClick={() => updateQty(p.id, 1)} className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                          <Plus size={12} />
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => updateQty(p.id, 1)} className="px-3 py-1 rounded-badge border border-brown/20 text-xs font-semibold text-brown/60 hover:border-primary hover:text-primary">
                        Tambah
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Preview */}
            <div className="mt-4 p-3 bg-primary text-white rounded-input">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs opacity-80">Subtotal</span>
                <span className="font-bold">{formatRupiah(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-display font-medium">Total</span>
                <span className="font-bold font-display">{formatRupiah(calculateSubtotal() + Number(watch('deliveryFee') || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-brown/5">
          <Button variant="outline" className="flex-1" type="button" onClick={onClose}>Batal</Button>
          <Button className="flex-1" type="submit" loading={submitting}>Simpan Pesanan</Button>
        </div>
      </form>
    </Modal>
  );
}
