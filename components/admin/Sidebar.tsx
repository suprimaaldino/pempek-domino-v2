'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Users,
  UtensilsCrossed,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/recap', label: 'Rekap', icon: BarChart3 },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { error: toastError } = useToast();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      router.push('/admin/login');
    } catch {
      toastError('Gagal logout. Coba lagi.');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-brown/10 shadow-card fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-brown/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-input overflow-hidden bg-primary flex items-center justify-center">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-brown text-base leading-tight">Pempek Domino</p>
              <p className="text-xs text-brown/50">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Navigasi admin">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brown/10 shadow-card-lg safe-area-pb"
        aria-label="Navigasi bawah"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-input transition-all',
                  active ? 'text-primary' : 'text-brown/50'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
