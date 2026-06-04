'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomerNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Pesan',
      href: '/order',
      icon: ShoppingBag,
    },
    {
      label: 'Pesanan Saya',
      href: '/my-orders',
      icon: ClipboardList,
    },
    {
      label: 'Admin',
      href: '/admin/login',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brown/10 shadow-card-lg safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/order' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive ? 'text-primary' : 'text-brown/50 hover:text-brown/80'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
