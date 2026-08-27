'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  MoreHorizontal,
  LogOut,
  Users,
  CreditCard,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { MobileMoreSheet } from './MobileMoreSheet';

const DESKTOP_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/recap', label: 'Rekap', icon: BarChart3 },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/settings', label: 'Pengaturan', icon: SettingsIcon },
];

// Mobile: 5-Tab Clean Layout
const MOBILE_MAIN_ITEMS = [
  { href: '/admin/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/recap', label: 'Rekap', icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch {
      toastError('Gagal logout. Coba lagi.');
    }
  };

  // Check if current path is in "More" section
  const morePaths = ['/admin/customers', '/admin/payments', '/admin/settings'];
  const isInMoreSection = morePaths.some(path => pathname.startsWith(path));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-brown/10 shadow-card fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-brown/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input overflow-visible bg-primary flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny local icon; next/image adds layout overhead here */}
              <img src="/icons/icon-192.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="font-display font-bold text-brown text-base leading-tight">Pempek Domino</p>
              <p className="text-xs text-brown/50">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Navigasi admin">
          {DESKTOP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-semibold transition-all duration-150',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-brown/70 hover:bg-brown/5 hover:text-brown'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-brown/10">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-input text-sm font-semibold text-brown/60 hover:bg-error/10 hover:text-error transition-all duration-150"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - 5 Tab Clean */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brown/10 shadow-card-lg"
        aria-label="Navigasi bawah"
      >
        <div className="flex items-center justify-around px-1 py-1">
          {MOBILE_MAIN_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[64px] px-2 py-2 rounded-xl transition-all',
                  active ? 'text-primary' : 'text-brown/50 hover:text-brown/70'
                )}
              >
                <Icon 
                  size={22} 
                  strokeWidth={active ? 2.5 : 2}
                  className={cn(
                    'transition-transform',
                    active && 'scale-110'
                  )}
                />
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[64px] px-2 py-2 rounded-xl transition-all',
              isInMoreSection || isMoreSheetOpen
                ? 'text-primary'
                : 'text-brown/50 hover:text-brown/70'
            )}
            aria-label="Menu lainnya"
            aria-expanded={isMoreSheetOpen}
          >
            <MoreHorizontal 
              size={22} 
              strokeWidth={isInMoreSection || isMoreSheetOpen ? 2.5 : 2}
              className={cn(
                'transition-transform',
                (isInMoreSection || isMoreSheetOpen) && 'scale-110'
              )}
            />
            <span className="text-[10px] font-semibold leading-tight">Lainnya</span>
          </button>
        </div>

        {/* Safe area padding for iPhone */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>

      {/* Mobile More Sheet */}
      <MobileMoreSheet 
        isOpen={isMoreSheetOpen} 
        onClose={() => setIsMoreSheetOpen(false)} 
      />
    </>
  );
}
