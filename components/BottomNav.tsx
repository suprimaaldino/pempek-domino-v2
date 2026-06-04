'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/order', label: 'Menu', icon: ShoppingBag },
  { href: '/my-orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/admin/login', label: 'Admin', icon: ShieldCheck },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/confirmation')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 safe-area-pb"
      aria-label="Navigasi bawah"
    >
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/order'
              ? pathname === '/order' || pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-4 relative"
            >
              <div
                className={cn(
                  'w-10 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-primary/10' : 'bg-transparent'
                )}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-neutral-400'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors duration-200 leading-none',
                  isActive ? 'text-primary' : 'text-neutral-400'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
