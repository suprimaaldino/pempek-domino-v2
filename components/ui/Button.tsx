'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
  secondary:
    'bg-neutral-100 text-neutral-800 font-semibold hover:bg-neutral-200 active:bg-neutral-300',
  outline:
    'border border-primary text-primary bg-transparent hover:bg-primary hover:text-white active:bg-primary-600',
  ghost:
    'bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  danger:
    'bg-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm rounded-pill',
  md: 'px-5 py-2.5 text-sm rounded-pill',
  lg: 'px-6 py-3.5 text-base rounded-pill',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight',
        'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
