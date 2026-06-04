'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Detects when a new Service Worker is installed and waiting,
 * then shows a banner prompting the user to reload/update.
 */
export function PWAUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check if there's already a waiting SW when the page loads
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      setRegistration(reg);

      if (reg.waiting) {
        // A new SW is already installed and waiting
        setShowBanner(true);
      }

      // Listen for future updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed, old one still controlling — show banner
            setShowBanner(true);
          }
        });
      });
    });

    // When SW takes control (after skipWaiting), reload the page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting SW to skip waiting and take control
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: just hard reload
      window.location.reload();
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 px-4 py-3 bg-primary text-white shadow-lg"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <RefreshCw size={16} className="shrink-0" />
        <span>Versi baru tersedia!</span>
      </div>
      <button
        onClick={handleUpdate}
        className="shrink-0 bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/90 active:scale-95 transition-all"
      >
        Perbarui Sekarang
      </button>
    </div>
  );
}
