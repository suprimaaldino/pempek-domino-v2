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

  // Find the configured method, or fallback to default structure
  const activeMethod = config.methods?.find((m) => m.id === method) || {
    id: method,
    methodType: method as 'qris' | 'dana' | 'transfer',
    name: method === 'qris' ? 'QRIS' : method === 'dana' ? 'Dana' : 'Transfer Bank',
    provider: method === 'qris' ? 'QRIS' : method === 'dana' ? 'Dana' : config.bankName,
    accountNumber: method === 'qris' ? config.qrisImageUrl : method === 'dana' ? config.danaNumber : config.bankAccountNumber,
    accountName: method === 'transfer' ? config.bankAccountName : undefined,
    isActive: true,
  };

  if (!activeMethod.isActive) return null;

  if (activeMethod.methodType === 'qris') {
    const qrisUrl = activeMethod.accountNumber || config.qrisImageUrl;
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <QrCode size={18} className="text-primary" />
            {activeMethod.name}
          </div>
          {qrisUrl ? (
            <div className="relative w-48 h-48 rounded-input overflow-hidden shadow-card">
              <Image src={qrisUrl} alt={`${activeMethod.provider} Code`} fill className="object-contain" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-brown/5 rounded-input flex flex-col items-center justify-center gap-2">
              <QrCode size={48} className="text-brown/20" />
              <p className="text-xs text-brown/40">QR Code belum tersedia</p>
            </div>
          )}
          <p className="text-xs text-brown/60 text-center">
            Scan {activeMethod.provider} di atas, lalu upload bukti bayar ke WhatsApp
          </p>
        </CardBody>
      </Card>
    );
  }

  if (activeMethod.methodType === 'dana') {
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <Smartphone size={18} className="text-primary" />
            {activeMethod.name}
          </div>
          <div className="text-center">
            <p className="text-xs text-brown/50 font-semibold mb-1">{activeMethod.provider}</p>
            <p className="text-2xl font-bold text-primary tracking-wider">
              {activeMethod.accountNumber || '(belum diisi)'}
            </p>
            {activeMethod.accountName && (
              <p className="text-sm font-semibold text-brown/70 mt-1">
                a.n. {activeMethod.accountName}
              </p>
            )}
          </div>
          <p className="text-xs text-brown/60 text-center">
            Transfer ke {activeMethod.provider} di atas, lalu upload bukti bayar ke WhatsApp
          </p>
        </CardBody>
      </Card>
    );
  }

  if (activeMethod.methodType === 'transfer') {
    return (
      <Card className="mt-3 border border-secondary/30">
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-brown font-semibold">
            <Building2 size={18} className="text-primary" />
            {activeMethod.name}
          </div>
          <div className="bg-cream rounded-input p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-brown/60">Bank / Penyedia Jasa</span>
              <span className="font-semibold text-brown">{activeMethod.provider || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brown/60">No. Rekening / Account</span>
              <span className="font-bold text-primary text-base tracking-wider">
                {activeMethod.accountNumber || '-'}
              </span>
            </div>
            {activeMethod.accountName && (
              <div className="flex justify-between text-sm">
                <span className="text-brown/60">Atas Nama</span>
                <span className="font-semibold text-brown">{activeMethod.accountName}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-brown/60 text-center flex-wrap">
            Transfer sesuai total pesanan, lalu upload bukti bayar ke WhatsApp
          </p>
        </CardBody>
      </Card>
    );
  }

  return null;
}
