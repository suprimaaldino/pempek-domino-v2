'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Next.js error boundary caught an error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-card shadow-card border border-neutral-100 p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto text-error">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="font-bold text-neutral-900 text-lg">Terjadi Kesalahan</h1>
          <p className="text-sm text-neutral-500 leading-relaxed font-medium">
            Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi atau muat ulang halaman.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
            Muat Ulang Halaman
          </Button>
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            Coba Lagi
          </Button>
        </div>
      </div>
    </main>
  );
}
