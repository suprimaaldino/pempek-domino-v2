'use client';

import { MapPin, ExternalLink, Clock } from 'lucide-react';
import type { BusinessSettings } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { formatStoreHours } from '@/lib/utils';

interface StoreLocationPreviewProps {
  settings: BusinessSettings | null;
}

export function StoreLocationPreview({ settings }: StoreLocationPreviewProps) {
  if (!settings?.address && !settings?.googleMapsUrl) return null;

  const hoursLabel = formatStoreHours(settings);

  return (
    <Card className="mt-3 border border-secondary/30">
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-brown font-semibold">
          <MapPin size={18} className="text-primary" />
          Lokasi Toko
        </div>
        <div className="bg-cream rounded-input p-3 space-y-3">
          {settings.address && (
            <div className="space-y-1">
              <span className="text-sm text-brown/60">Alamat</span>
              <p className="text-sm font-semibold text-brown leading-relaxed">{settings.address}</p>
            </div>
          )}
          {hoursLabel && (
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-brown/60 shrink-0">Jam Operasional</span>
              <span className="font-semibold text-brown text-right">{hoursLabel}</span>
            </div>
          )}
          {settings.googleMapsUrl && (
            <div className="flex justify-between gap-3 text-sm items-center">
              <span className="text-brown/60 shrink-0">Google Maps</span>
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-right"
              >
                Buka di Maps
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
        <p className="text-xs text-brown/60 text-center flex items-center justify-center gap-1">
          <Clock size={12} className="text-primary shrink-0" aria-hidden="true" />
          Gunakan alamat di atas untuk pengambilan pesan (Ambil Sendiri)
        </p>
      </CardBody>
    </Card>
  );
}
