'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error = useCallback((msg: string) => toast(msg, 'error'), [toast]);
  const info = useCallback((msg: string) => toast(msg, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} className="text-success shrink-0" />,
    error: <AlertCircle size={18} className="text-error shrink-0" />,
    info: <Info size={18} className="text-blue-600 shrink-0" />,
  };
  const bgClasses: Record<ToastType, string> = {
    success: 'border-success/30 bg-white',
    error: 'border-error/30 bg-white',
    info: 'border-blue-200 bg-white',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm',
        'flex items-start gap-3 px-4 py-3 rounded-card shadow-card-lg border',
        'animate-in slide-in-from-bottom-2 duration-300',
        bgClasses[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium text-brown leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 text-brown/40 hover:text-brown/70 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
