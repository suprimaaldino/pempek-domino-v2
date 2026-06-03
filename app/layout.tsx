import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Pempek Domino — Pesan Pempek Palembang',
    template: '%s | Pempek Domino',
  },
  description: 'Pesan Pempek Palembang terbaik secara online. Aneka pilihan pempek kecil, besar, dan paket hemat.',
  keywords: ['pempek', 'palembang', 'pempek domino', 'pesan pempek online'],
  authors: [{ name: 'Pempek Domino' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pempek Domino',
  },
  openGraph: {
    title: 'Pempek Domino',
    description: 'Pesan Pempek Palembang, Nikmat di Mana Saja',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#8B1E1E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
