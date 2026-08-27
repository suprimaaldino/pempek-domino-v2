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
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mount animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
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
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      setClosing(false);
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

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
