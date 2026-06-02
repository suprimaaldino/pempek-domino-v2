'use client';

import Image from 'next/image';
import { QrCode, Smartphone, Building2 } from 'lucide-react';
import type { PaymentConfig, PaymentMethod } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';

interface PaymentPreviewProps {
  method: PaymentMethod;
  config: PaymentConfig | null;
}

export function PaymentPreview({ method, config }: PaymentPreviewProps) {
  if (!config) return null;

  if (method === 'qris') {
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <QrCode size={18} className="text-primary" />
            Bayar via QRIS
          </div>
          {config.qrisImageUrl ? (
            <div className="relative w-48 h-48 rounded-input overflow-hidden shadow-card">
              <Image src={config.qrisImageUrl} alt="QRIS Code" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-brown/5 rounded-input flex flex-col items-center justify-center gap-2">
              <QrCode size={48} className="text-brown/20" />
              <p className="text-xs text-brown/40">QR Code belum tersedia</p>
            </div>
          )}
          <p className="text-xs text-brown/60 text-center">Scan QR di atas, lalu upload bukti bayar ke WhatsApp</p>
        </CardBody>
      </Card>
    );
  }

  if (method === 'dana') {
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <Smartphone size={18} className="text-primary" />
            Bayar via Dana
          </div>
          <p className="text-2xl font-bold text-primary tracking-wider">
            {config.danaNumber || '(belum diisi)'}
          </p>
          <p className="text-xs text-brown/60 text-center">Transfer ke nomor Dana di atas, lalu upload bukti bayar ke WhatsApp</p>
        </CardBody>
      </Card>
    );
  }

  if (method === 'transfer') {
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <Building2 size={18} className="text-primary" />
            Transfer Bank
          </div>
          <div className="bg-cream rounded-input p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-brown/60">Bank</span>
              <span className="font-semibold text-brown">{config.bankName || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brown/60">No. Rekening</span>
              <span className="font-bold text-primary text-base tracking-wider">
                {config.bankAccountNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brown/60">Atas Nama</span>
              <span className="font-semibold text-brown">{config.bankAccountName || '-'}</span>
            </div>
          </div>
          <p className="text-xs text-brown/60 text-center">Transfer sesuai total pesanan, lalu upload bukti bayar ke WhatsApp</p>
        </CardBody>
      </Card>
    );
  }

  return null;
}
