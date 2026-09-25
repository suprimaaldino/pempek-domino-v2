'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mount animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Trigger entrance on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    }
  }, [isOpen]);

  // Close with exit animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 150);
  };

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key + focus first focusable + focus trap + restore focus on close
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel) return;
      const els = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm',
          visible ? 'animate-modal-backdrop' : 'animate-modal-backdrop-out'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-white shadow-card-lg z-10',
          'rounded-t-card sm:rounded-card',
          'max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          visible ? 'animate-modal-panel' : 'animate-modal-panel-out',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-brown/10">
            <h2 className="font-display font-bold text-brown text-xl">{title}</h2>
            <button
              onClick={handleClose}
              aria-label="Tutup"
              className="p-2 rounded-full hover:bg-brown/10 active:scale-95 transition-all"
            >
              <X size={20} className="text-brown/60" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
