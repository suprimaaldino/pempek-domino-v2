'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  CreditCard,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MORE_ITEMS = [
  { href: '/admin/customers', label: 'Pelanggan', icon: Users, description: 'Data pelanggan' },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard, description: 'Metode pembayaran' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, description: 'Pengaturan toko' },
];

export function MobileMoreSheet({ isOpen, onClose }: MobileMoreSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { error: toastError } = useToast();

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.push('/admin/login');
    } catch {
      toastError('Gagal logout. Coba lagi.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Menu lainnya"
      >
        <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
            <div className="w-12 h-1.5 bg-brown/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 border-b border-brown/10">
            <h2 className="text-lg font-bold text-brown">Menu Lainnya</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-brown/5 text-brown/60 transition-colors"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-2">
            {MORE_ITEMS.map(({ href, label, icon: Icon, description }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-xl transition-all',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-brown/5 text-brown'
                  )}
                >
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center',
                    active ? 'bg-primary text-white' : 'bg-brown/10 text-brown'
                  )}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'font-semibold',
                      active ? 'text-primary' : 'text-brown'
                    )}>
                      {label}
                    </p>
                    <p className="text-sm text-brown/50">{description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-2 border-t border-brown/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-4 rounded-xl w-full hover:bg-error/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-error/10 text-error">
                <LogOut size={22} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-error">Keluar</p>
                <p className="text-sm text-brown/50">Logout dari admin</p>
              </div>
            </button>
          </div>

          {/* Safe area padding */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </>
  );
}
