'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive actions, `primary` otherwise. */
  variant?: 'primary' | 'danger';
  loading?: boolean;
  /** When set, the dialog asks for a value and `onConfirm` receives it. */
  input?: {
    label: string;
    placeholder?: string;
    helperText?: string;
  };
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

/**
 * In-app replacement for `window.confirm` / `window.prompt`.
 *
 * The native dialogs render as an unstyled browser alert, which breaks the
 * design and cannot be translated. This reuses the existing Modal (which
 * already handles Escape, focus trapping and scroll locking) and the existing
 * Input, so it stays consistent with the rest of the app.
 *
 * Optionally collects a single value, which covers the "confirm ownership"
 * case (entering the WhatsApp number used for the order) without needing a
 * second dialog component.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'primary',
  loading = false,
  input,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [value, setValue] = useState('');

  const handleClose = () => {
    if (loading) return;
    setValue('');
    onCancel();
  };

  const handleConfirm = () => {
    if (input && !value.trim()) return;
    onConfirm(input ? value.trim() : undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" ariaLabel={title}>
      <div className="text-center sm:text-left">
        {variant === 'danger' && (
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto sm:mx-0 mb-3">
            <AlertTriangle size={22} className="text-error" aria-hidden="true" />
          </div>
        )}

        <h2 className="font-display font-bold text-brown text-lg">{title}</h2>
        {description && (
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{description}</p>
        )}

        {input && (
          <div className="mt-4 text-left">
            <Input
              label={input.label}
              placeholder={input.placeholder}
              helperText={input.helperText}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
            disabled={Boolean(input) && !value.trim()}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
