'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Users,
  UtensilsCrossed,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      router.push('/admin/login');
    } catch {
      toastError('Gagal logout. Coba lagi.');
    }
  };

  const mainNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/admin/recap', label: 'Rekap', icon: BarChart3 },
  ];

  const orderCustomerGroup = [
    { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  ];

  const paymentSettingsGroup = [
    { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-brown/10 shadow-card fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-brown/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input overflow-visible bg-primary flex items-center justify-center">
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

      {/* Mobile Bottom Navigation - Grouped */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brown/10 shadow-card-lg safe-area-pb"
        aria-label="Navigasi bawah"
      >
        {/* Expanded Menu (if any group is expanded) */}
        {expandedGroup && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-brown/10 shadow-lg">
            {expandedGroup === 'orders-customers' && (
              <div className="flex flex-col">
                {orderCustomerGroup.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setExpandedGroup(null)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-semibold border-b border-brown/5 last:border-b-0',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-brown/70 hover:bg-brown/5'
                      )}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
            {expandedGroup === 'payment-settings' && (
              <div className="flex flex-col">
                {paymentSettingsGroup.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setExpandedGroup(null)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-semibold border-b border-brown/5 last:border-b-0',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-brown/70 hover:bg-brown/5'
                      )}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Main Nav Items */}
        <div className="flex items-center justify-around px-1.5 py-1">
          {mainNavItems.map(({ href, label, icon: Icon }) => {
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

          {/* Orders & Customers Group */}
          <button
            onClick={() =>
              setExpandedGroup(
                expandedGroup === 'orders-customers' ? null : 'orders-customers'
              )
            }
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-input transition-all',
              expandedGroup === 'orders-customers'
                ? 'text-primary'
                : orderCustomerGroup.some((item) =>
                    pathname.startsWith(item.href)
                  )
                ? 'text-primary'
                : 'text-brown/50'
            )}
          >
            <ShoppingBag size={20} />
            <span className="text-[10px] font-semibold">Pesanan</span>
          </button>

          {/* Payment & Settings Group */}
          <button
            onClick={() =>
              setExpandedGroup(
                expandedGroup === 'payment-settings' ? null : 'payment-settings'
              )
            }
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-input transition-all',
              expandedGroup === 'payment-settings'
                ? 'text-primary'
                : paymentSettingsGroup.some((item) =>
                    pathname.startsWith(item.href)
                  )
                ? 'text-primary'
                : 'text-brown/50'
            )}
          >
            <CreditCard size={20} />
            <span className="text-[10px] font-semibold">Lainnya</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-input transition-all text-brown/50 hover:text-error hover:bg-error/5"
            aria-label="Logout"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-semibold">Keluar</span>
          </button>
        </div>
      </nav>
    </>
  );
}
