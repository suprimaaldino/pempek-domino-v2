'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/order', label: 'Menu Pesanan', icon: ShoppingBag },
  { href: '/my-orders', label: 'Cek Pesanan', icon: ClipboardList },
  { href: '/admin/login', label: 'Admin', icon: ShieldCheck },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on admin routes (except if you want admin login to show it, but usually not)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brown/10 shadow-card-lg safe-area-pb"
      aria-label="Navigasi bawah"
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href) && href !== '/order' && href !== '/admin/login';
          // special case for /order since it's the root/default
          const isActive = href === '/order' ? pathname === '/order' || pathname === '/' : active;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-input transition-all',
                isActive ? 'text-primary' : 'text-brown/50'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
