'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  LogOut,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { signInWithGoogleCustomer, logoutCustomer } from '@/lib/auth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { formatWhatsApp } from '@/lib/utils';

export default function AccountPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [busy, setBusy] = useState(false);

  // Sync Firebase auth state + load users/{uid} profile (soft-auth, non-blocking).
  useCustomerAuth();

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogleCustomer();
      // useCustomerAuth's onAuthStateChanged will pick up the new user.
    } catch {
      toastError('Gagal masuk. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutCustomer();
      toastSuccess('Berhasil keluar.');
    } catch {
      toastError('Gagal keluar. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 animate-page-in">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto pt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/order')}
              aria-label="Kembali"
              className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-neutral-600" />
            </button>
            <div>
              <h1 className="font-bold text-neutral-900 text-base leading-tight">Akun Saya</h1>
              <p className="text-xs text-neutral-400">
                Kelola informasi dan riwayat pesanan
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        {isLoading ? (
          <Card>
            <CardBody className="text-center text-sm text-neutral-400 py-8">
              Memuat...
            </CardBody>
          </Card>
        ) : !isAuthenticated || !user ? (
          /* Guest state — soft-auth, never blocking */
          <Card>
            <CardBody className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <UserIcon size={26} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Masuk untuk menyimpan pesananmu</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Masuk dengan Google untuk melihat riwayat pesanan di semua perangkat dan
                  mempercepat pemesanan berikutnya. (Opsional)
                </p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleGoogleSignIn} loading={busy}>
                  <LogIn size={16} />
                  Masuk dengan Google
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/order')}>
                  Lanjut sebagai tamu
                </Button>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Kamu tetap bisa memesan tanpa membuat akun kapan saja.
              </p>
            </CardBody>
          </Card>
        ) : (
          /* Authenticated state */
          <>
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.name ? (
                      <span className="font-bold text-primary text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <UserIcon size={22} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-900 truncate">{user.name || 'Pengguna'}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-primary" />
                      Masuk sebagai pelanggan
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-3 text-sm">
                  {user.name && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <UserIcon size={15} className="text-primary shrink-0" />
                      <span className="truncate">{user.name}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Mail size={15} className="text-primary shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Phone size={15} className="text-primary shrink-0" />
                    <span>{user.phone ? formatWhatsApp(user.phone) : 'Belum diisi (isikan saat checkout)'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => router.push('/my-orders')}>
              Lihat Riwayat Pesanan
            </Button>

            <Button variant="danger" className="w-full" onClick={handleLogout} loading={busy}>
              <LogOut size={16} />
              Keluar
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
