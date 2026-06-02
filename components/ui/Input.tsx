'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-brown">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/50">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-input border px-4 py-3 text-brown bg-white',
              'placeholder:text-brown/40 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
              error
                ? 'border-error focus:ring-error/40 focus:border-error'
                : 'border-brown/20 hover:border-brown/40',
              leftIcon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-brown/60">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-brown">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full rounded-input border px-4 py-3 text-brown bg-white resize-none',
            'placeholder:text-brown/40 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
            error
              ? 'border-error focus:ring-error/40 focus:border-error'
              : 'border-brown/20 hover:border-brown/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-brown/60">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
