'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ClipboardList, ShieldCheck, ShoppingBag, Info, Phone } from 'lucide-react';
// use public high-res icon to ensure sharp logo
import { cn } from '@/lib/utils';

interface CustomerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
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
      label: 'Area Admin',
      href: '/admin/login',
      icon: ShieldCheck,
      isAdmin: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 right-0 z-50 w-[280px] max-w-[85vw] bg-cream shadow-card-lg border-l border-brown/5 transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
              <Image
                src="/icons/icon-192.png"
                alt="Logo Pempek Domino"
                width={32}
                height={32}
                className="w-8 h-8 object-contain rounded-md bg-white"
                priority
              />
            <div>
              <h2 className="font-display font-bold text-base leading-tight">Pempek Domino</h2>
              <p className="text-[10px] text-white/70">Pesan Pempek Palembang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/order' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm border',
                  isActive
                    ? 'bg-primary/5 text-primary border-primary/10 shadow-sm font-semibold'
                    : 'text-brown/70 border-transparent hover:bg-brown/5 hover:text-brown'
                )}
              >
                <Icon size={18} className={isActive ? 'text-primary' : 'text-brown/40'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-brown/5 bg-brown/5 space-y-2">
          <div className="flex items-start gap-2 text-xs text-brown/50">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              Jam Operasional:<br />
              Setiap Hari 08.00 - 21.00 WIB
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brown/50">
            <Phone size={14} className="shrink-0" />
            <p>WhatsApp: 0817-7640-0024</p>
          </div>
        </div>
      </div>
    </>
  );
}
