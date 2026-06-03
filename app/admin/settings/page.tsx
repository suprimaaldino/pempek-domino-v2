'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Building2, 
  Smartphone, 
  QrCode,
  Save,
} from 'lucide-react';
import { 
  getBusinessSettings, 
  updateBusinessSettings, 
  getPaymentConfig, 
  updatePaymentConfig 
} from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import type { BusinessSettings, PaymentConfig, PaymentMethodItem } from '@/types';

export default function SettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    storeName: 'Pempek Domino',
    whatsappNumber: '',
    address: '',
    openingHours: '',
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    qrisImageUrl: '',
    danaNumber: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    methods: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [biz, pay] = await Promise.all([
          getBusinessSettings(),
          getPaymentConfig()
        ]);
        if (biz) setBusinessSettings(biz);
        if (pay) {
          const payData = { ...pay };
          if (!payData.methods || payData.methods.length === 0) {
            payData.methods = [
              {
                id: 'qris',
                methodType: 'qris',
                name: 'QRIS',
                provider: 'QRIS',
                accountNumber: payData.qrisImageUrl || '',
                isActive: true
              },
              {
                id: 'dana',
                methodType: 'dana',
                name: 'Dana',
                provider: 'Dana',
                accountNumber: payData.danaNumber || '',
                isActive: true
              },
              {
                id: 'transfer',
                methodType: 'transfer',
                name: 'Transfer Bank',
                provider: payData.bankName || 'BCA',
                accountNumber: payData.bankAccountNumber || '',
                accountName: payData.bankAccountName || '',
                isActive: true
              }
            ];
          }
          setPaymentConfig(payData);
        } else {
          setPaymentConfig({
            qrisImageUrl: '',
            danaNumber: '',
            bankName: 'BCA',
            bankAccountNumber: '',
            bankAccountName: '',
            methods: [
              {
                id: 'qris',
                methodType: 'qris',
                name: 'QRIS',
                provider: 'QRIS',
                accountNumber: '',
                isActive: true
              },
              {
                id: 'dana',
                methodType: 'dana',
                name: 'Dana',
                provider: 'Dana',
                accountNumber: '',
                isActive: true
              },
              {
                id: 'transfer',
                methodType: 'transfer',
                name: 'Transfer Bank',
                provider: 'BCA',
                accountNumber: '',
                accountName: '',
                isActive: true
              }
            ]
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBusinessSettings(businessSettings);
      toastSuccess('Pengaturan bisnis berhasil disimpan');
    } catch (err) {
      toastError('Gagal menyimpan pengaturan basis');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (method: PaymentMethodItem) => {
    setEditingMethod({ ...method });
    setModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    setSaving(true);
    try {
      const updatedMethods = paymentConfig.methods?.map((m) =>
        m.id === editingMethod.id ? editingMethod : m
      ) || [];

      const newConfig = {
        ...paymentConfig,
        methods: updatedMethods,
        // Legacy compatibility: update root fields based on editingMethod
        ...(editingMethod.id === 'qris' ? { qrisImageUrl: editingMethod.accountNumber } : {}),
        ...(editingMethod.id === 'dana' ? { danaNumber: editingMethod.accountNumber } : {}),
        ...(editingMethod.id === 'transfer' ? {
          bankName: editingMethod.provider,
          bankAccountNumber: editingMethod.accountNumber,
          bankAccountName: editingMethod.accountName || '',
        } : {}),
      };

      await updatePaymentConfig(newConfig);
      setPaymentConfig(newConfig);
      toastSuccess('Metode pembayaran berhasil disimpan');
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toastError('Gagal menyimpan metode pembayaran');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-brown/5 rounded w-1/4"></div>
        <div className="h-64 bg-brown/5 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-brown/10 pb-6">
        <div className="p-2 rounded-lg bg-brown/5 text-brown">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl text-brown">Pengaturan</h1>
          <p className="text-brown/50">Kelola profil bisnis dan metode pembayaran.</p>
        </div>
      </div>

      <Tabs 
        tabs={[
          { value: 'business', label: 'Profil Bisnis' },
          { value: 'payment', label: 'Pembayaran' }
        ]} 
        value={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === 'business' ? (
        <form onSubmit={handleSaveBusiness}>
          <Card>
            <CardHeader title="Informasi Toko" />
            <CardBody className="space-y-4">
              <Input 
                label="Nama Toko" 
                value={businessSettings.storeName}
                onChange={(e) => setBusinessSettings({...businessSettings, storeName: e.target.value})}
                required
              />
              <Input 
                label="Nomor WhatsApp Admin" 
                placeholder="62812xxx" 
                value={businessSettings.whatsappNumber}
                onChange={(e) => setBusinessSettings({...businessSettings, whatsappNumber: e.target.value})}
                helperText="Gunakan format internasional tanpa +, contoh: 6281776400024"
                required
              />
              <Input 
                label="Jam Operasional" 
                placeholder="Contoh: Setiap Hari, 08.00 - 20.00" 
                value={businessSettings.openingHours}
                onChange={(e) => setBusinessSettings({...businessSettings, openingHours: e.target.value})}
              />
              <Input 
                label="Alamat Toko (untuk Ambil Sendiri)" 
                value={businessSettings.address}
                onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
              />
              <div className="pt-4 flex justify-end">
                <Button type="submit" loading={saving}>
                  <Save size={18} />
                  Simpan Perubahan
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Metode Pembayaran" icon={<CreditCard size={18} className="text-primary" />} />
            <CardBody className="space-y-4">
              <div className="divide-y divide-brown/10">
                {paymentConfig.methods?.map((method) => (
                  <div key={method.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {method.methodType === 'qris' ? (
                          <QrCode size={20} />
                        ) : method.methodType === 'dana' ? (
                          <Smartphone size={20} />
                        ) : (
                          <Building2 size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-brown">{method.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            method.isActive ? 'bg-success/15 text-success' : 'bg-brown/10 text-brown/50'
                          }`}>
                            {method.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-sm text-brown/50">
                          {method.provider} &bull; {method.methodType === 'qris' ? (method.accountNumber ? 'QR Code Tersedia' : 'Belum Upload') : method.accountNumber || '(belum diisi)'}
                          {method.accountName ? ` (a.n. ${method.accountName})` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(method)}
                      type="button"
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Edit Metode Pembayaran"
          >
            {editingMethod && (
              <form onSubmit={handleSaveMethod} className="space-y-4">
                <Input
                  label="Metode Pembayaran"
                  value={editingMethod.name}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  required
                />
                <Input
                  label="Bank / Penyedia Jasa"
                  value={editingMethod.provider}
                  onChange={(e) => setEditingMethod({ ...editingMethod, provider: e.target.value })}
                  required
                />
                {editingMethod.methodType === 'qris' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-brown">Upload Gambar QRIS (No Rekening/ Account)</label>
                    <ImageUpload
                      label="Upload Gambar QRIS"
                      currentUrl={editingMethod.accountNumber}
                      storagePath="settings"
                      onUploaded={(url) => setEditingMethod({ ...editingMethod, accountNumber: url })}
                    />
                  </div>
                ) : (
                  <Input
                    label="No Rekening/ Account"
                    value={editingMethod.accountNumber}
                    onChange={(e) => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                    required
                  />
                )}
                {editingMethod.methodType !== 'qris' && (
                  <Input
                    label="Nama Akun"
                    placeholder="Masukkan nama pemilik akun/rekening"
                    value={editingMethod.accountName || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, accountName: e.target.value })}
                    required
                  />
                )}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="methodIsActive"
                    checked={editingMethod.isActive}
                    onChange={(e) => setEditingMethod({ ...editingMethod, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-brown/20 animate-none"
                  />
                  <label htmlFor="methodIsActive" className="text-sm font-medium text-brown">
                    Aktifkan metode pembayaran ini agar dapat digunakan pelanggan
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-brown/5 mt-6">
                  <Button variant="outline" className="flex-1" type="button" onClick={() => setModalOpen(false)}>
                    Batal
                  </Button>
                  <Button className="flex-1" type="submit" loading={saving}>
                    Simpan
                  </Button>
                </div>
              </form>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
