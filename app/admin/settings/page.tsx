'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save,
} from 'lucide-react';
import { 
  getBusinessSettings, 
  updateBusinessSettings, 
} from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { BusinessSettings } from '@/types';

export default function SettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    storeName: 'Pempek Domino',
    whatsappNumber: '',
    address: '',
    openingHours: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const biz = await getBusinessSettings();
        if (biz) setBusinessSettings(biz);
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
          <p className="text-brown/50">Kelola profil bisnis toko.</p>
        </div>
      </div>

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
    </div>
  );
}
