'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { loginWithGoogle, isAdmin, onAuthStateChanged, logout } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, redirect appropriately
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        if (isAdmin(user)) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/order');
        }
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (isAdmin(user)) {
        router.push('/admin/dashboard');
      } else {
        router.push('/order');
      }
    } catch (err) {
      console.error('Google login error:', err);
      const message = err instanceof Error ? err.message : 'Gagal login dengan Google';
      // User cancelled popup — don't show error
      if (!message.includes('popup-closed-by-user')) {
        toastError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 animate-page-in">
      <div className="w-full max-w-sm">
        {/* Hero */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-28 h-28 rounded-2xl overflow-visible bg-primary flex items-center justify-center flex-shrink-0 mb-4 shadow-card">
            <Image
              src="/icons/icon-192.png"
              alt="Logo Pempek Domino"
              width={112}
              height={112}
              className="w-28 h-28 object-contain"
              priority
            />
          </div>
          <h1 className="font-display font-bold text-3xl text-brown mb-1">Pempek Domino</h1>
          <p className="text-brown/50 text-sm">Pesan Pempek Palembang Terbaik</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardBody className="p-6 space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleGoogleLogin}
              loading={loading}
            >
              {/* Google Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-neutral-400">atau</span>
              </div>
            </div>

            <Link href="/order" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Pesan Tanpa Login
                <ArrowRight size={16} />
              </Button>
            </Link>
          </CardBody>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-brown/40 mt-8">
          &copy; {new Date().getFullYear()} Pempek Domino. All rights reserved.
        </p>
      </div>
    </main>
  );
}
