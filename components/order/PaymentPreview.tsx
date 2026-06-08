'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { QrCode, Smartphone, Building2, ZoomIn, Download, X, Copy, Check, AlertCircle } from 'lucide-react';
import type { PaymentConfig } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PaymentPreviewProps {
  method: string;
  config: PaymentConfig | null;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

// Toast Component
function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white min-w-[200px] max-w-[90vw]`}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function PaymentPreview({ method, config }: PaymentPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    if (!text || text === '-') {
      setToast({ message: 'Tidak ada nomor rekening untuk disalin', type: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setToast({ message: 'Nomor rekening/account berhasil disalin ✓', type: 'success' });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setToast({ message: 'Gagal menyalin, silakan coba lagi', type: 'error' });
    }
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!config) return null;

  // Find the configured method, or fallback to default structure
  const activeMethod = config.methods?.find((m) => m.id === method) || {
    id: method,
    methodType: method as 'qris' | 'dana' | 'ewallet' | 'transfer' | 'bank',
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
      <>
        <Card className="mt-3 border border-secondary/30">
          <CardBody className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-brown font-semibold">
              <QrCode size={18} className="text-primary" />
              {activeMethod.name}
            </div>

            {qrisUrl ? (
              <div className="flex flex-col items-center gap-3 w-full">
                {/* QR Code Container with Hover/Tap effect */}
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="group relative w-48 h-48 rounded-input overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 bg-white border border-brown/5 flex items-center justify-center cursor-zoom-in"
                  aria-label="Perbesar QR Code"
                >
                  <Image
                    src={qrisUrl}
                    alt={`${activeMethod.provider} Code`}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="bg-white/90 text-brown text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ZoomIn size={14} className="text-primary" />
                      <span>Tap untuk Zoom</span>
                    </div>
                  </div>
                </button>

                {/* Controls */}
                <div className="flex gap-2 w-full max-w-[200px]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1 py-1 h-8 rounded-lg"
                    onClick={() => setIsZoomed(true)}
                  >
                    <ZoomIn size={12} />
                    <span>Zoom</span>
                  </Button>
                  <a
                    href={qrisUrl}
                    download="qris-pempek-domino.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs py-1 h-8 px-3 rounded-lg border border-primary text-primary hover:bg-primary/5 font-semibold transition-colors duration-200"
                  >
                    <Download size={12} />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 bg-brown/5 rounded-input flex flex-col items-center justify-center gap-2">
                <QrCode size={48} className="text-brown/20" />
                <p className="text-xs text-brown/40">QR Code belum tersedia</p>
              </div>
            )}

            <p className="text-xs text-brown/60 text-center">
              Scan {activeMethod.provider} di atas, atau download & tap untuk perbesar.
            </p>
          </CardBody>
        </Card>

        {/* Zoom Lightbox Modal */}
        {isZoomed && qrisUrl && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsZoomed(false)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
              onClick={() => setIsZoomed(false)}
              aria-label="Tutup"
            >
              <X size={24} />
            </button>

            <div
              className="w-full max-w-[90vw] md:max-w-[400px] bg-white rounded-card p-5 shadow-card-lg flex flex-col items-center gap-4 relative animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="font-display font-bold text-brown text-lg">QRIS Pempek Domino</h3>
                <p className="text-xs text-brown/50">Tunjukkan kode QR ini ke aplikasi e-wallet Anda</p>
              </div>

              <div className="relative w-full aspect-square max-w-[280px] bg-white border border-brown/5 rounded-xl overflow-hidden p-2">
                <Image
                  src={qrisUrl}
                  alt="QRIS Pempek Domino Zoomed"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>

              <div className="flex gap-2 w-full mt-2">
                <a
                  href={qrisUrl}
                  download="qris-pempek-domino.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm py-2 px-4 rounded-xl bg-primary text-white hover:bg-primary-600 font-semibold transition-colors duration-200 shadow-md"
                >
                  <Download size={16} />
                  <span>Download QRIS</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="flex-1 py-2 px-4 border border-brown/10 rounded-xl font-semibold text-brown/70 hover:bg-brown/5 transition-colors duration-200 text-sm"
                >
                  Tutup
                </button>
              </div>
              <p className="text-[10px] text-brown/40 text-center">
                Atau tekan dan tahan gambar untuk menyimpan ke galeri HP Anda.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (activeMethod.methodType === 'dana' || activeMethod.methodType === 'ewallet') {
    return (
      <>
        <Card className="mt-3 border border-secondary/30">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-brown font-semibold">
              <Smartphone size={18} className="text-primary" />
              {activeMethod.name}
            </div>
            <div className="bg-cream rounded-input p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-brown/60 text-sm">E-Wallet</span>
                <span className="font-semibold text-brown">{activeMethod.provider || '-'}</span>
              </div>
              
              <div className="flex justify-between items-center gap-3">
                <span className="text-brown/60 text-sm">No. Account</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-base tracking-wider select-all">
                    {activeMethod.accountNumber || '-'}
                  </span>
                  {activeMethod.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(activeMethod.accountNumber!, 'ewallet-account')}
                      className="p-1.5 hover:bg-primary/10 rounded-md transition-all duration-200 text-primary/60 hover:text-primary group"
                      aria-label="Copy nomor account"
                    >
                      {copiedField === 'ewallet-account' ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="group-hover:scale-105 transition-transform" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {activeMethod.accountName && (
                <div className="flex justify-between items-center">
                  <span className="text-brown/60 text-sm">Atas Nama</span>
                  <span className="font-semibold text-brown">{activeMethod.accountName}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-brown/60 text-center">
              Transfer ke {activeMethod.provider} di atas, lalu upload bukti bayar ke WhatsApp
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  if (activeMethod.methodType === 'transfer' || activeMethod.methodType === 'bank') {
    return (
      <>
        <Card className="mt-3 border border-secondary/30">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-brown font-semibold">
              <Building2 size={18} className="text-primary" />
              {activeMethod.name}
            </div>
            <div className="bg-cream rounded-input p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-brown/60 text-sm">Bank / Penyedia Jasa</span>
                <span className="font-semibold text-brown">{activeMethod.provider || '-'}</span>
              </div>
              
              <div className="flex justify-between items-center gap-3">
                <span className="text-brown/60 text-sm">No. Rekening / Account</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-base tracking-wider select-all">
                    {activeMethod.accountNumber || '-'}
                  </span>
                  {activeMethod.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(activeMethod.accountNumber!, 'bank-account')}
                      className="p-1.5 hover:bg-primary/10 rounded-md transition-all duration-200 text-primary/60 hover:text-primary group"
                      aria-label="Copy nomor rekening"
                    >
                      {copiedField === 'bank-account' ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="group-hover:scale-105 transition-transform" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {activeMethod.accountName && (
                <div className="flex justify-between items-center">
                  <span className="text-brown/60 text-sm">Atas Nama</span>
                  <span className="font-semibold text-brown">{activeMethod.accountName}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-brown/60 text-center flex-wrap">
              Transfer sesuai total pesanan, lalu upload bukti bayar ke WhatsApp
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}