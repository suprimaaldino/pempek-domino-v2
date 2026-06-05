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
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { BusinessSettings } from '@/types';

const DEFAULT_SETTINGS: BusinessSettings = {
  storeName: 'Pempek Domino',
  whatsappNumber: '',
  address: '',
  operationalDays: '',
  openingTime: '08:00',
  closingTime: '20:00',
  googleMapsUrl: '',
};

function normalizeBusinessSettings(raw: BusinessSettings): BusinessSettings {
  const settings = { ...DEFAULT_SETTINGS, ...raw };

  if (!settings.operationalDays && !settings.openingTime && !settings.closingTime && settings.openingHours) {
    const timeMatch = settings.openingHours.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
    if (timeMatch) {
      settings.openingTime = timeMatch[1].replace('.', ':').padStart(5, '0');
      settings.closingTime = timeMatch[2].replace('.', ':').padStart(5, '0');
    }
    const withoutTimes = settings.openingHours
      .replace(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/, '')
      .replace(/^[\s,]+|[\s,]+$/g, '');
    if (withoutTimes) {
      settings.operationalDays = withoutTimes;
    }
  }

  return settings;
}

export default function SettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function fetchData() {
      try {
        const biz = await getBusinessSettings();
        if (biz) setBusinessSettings(normalizeBusinessSettings(biz));
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
      const { openingHours: _legacy, ...toSave } = businessSettings;
      await updateBusinessSettings(toSave);
      toastSuccess('Pengaturan bisnis berhasil disimpan');
    } catch (err) {
      toastError('Gagal menyimpan pengaturan bisnis');
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
              label="Hari Operasional" 
              placeholder="Contoh: Senin - Minggu" 
              value={businessSettings.operationalDays}
              onChange={(e) => setBusinessSettings({...businessSettings, operationalDays: e.target.value})}
              helperText="Tuliskan hari buka toko, misalnya Setiap Hari atau Senin - Sabtu"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                type="time"
                label="Jam Buka" 
                value={businessSettings.openingTime}
                onChange={(e) => setBusinessSettings({...businessSettings, openingTime: e.target.value})}
              />
              <Input 
                type="time"
                label="Jam Tutup" 
                value={businessSettings.closingTime}
                onChange={(e) => setBusinessSettings({...businessSettings, closingTime: e.target.value})}
              />
            </div>
            <Textarea 
              label="Alamat Toko" 
              placeholder="Alamat lengkap toko"
              value={businessSettings.address}
              onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
              rows={3}
            />
            <Input 
              type="url"
              label="Link Alamat Toko (Google Maps)" 
              placeholder="https://maps.app.goo.gl/..." 
              value={businessSettings.googleMapsUrl || ''}
              onChange={(e) => setBusinessSettings({...businessSettings, googleMapsUrl: e.target.value})}
              helperText="Contoh: https://maps.app.goo.gl/AxHH5q4qa9GMi13x6"
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
