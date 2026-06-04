'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomerNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Pesan Pempek',
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
    <div className="bg-white border-b border-brown/10 sticky top-0 z-30 shadow-xs">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/order' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-all duration-200',
                isActive
                  ? 'border-primary text-primary bg-primary/[0.02]'
                  : 'border-transparent text-brown/50 hover:text-brown/80 hover:bg-brown/[0.01]'
              )}
            >
              <Icon size={14} className={isActive ? 'text-primary' : 'text-brown/40'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
