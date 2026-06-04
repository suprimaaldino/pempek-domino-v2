'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-input border bg-white px-4 py-3 text-sm text-neutral-900',
              'placeholder:text-neutral-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              error
                ? 'border-error focus:ring-error/20 focus:border-error'
                : 'border-neutral-200 hover:border-neutral-300',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error flex items-center gap-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full rounded-input border bg-white px-4 py-3 text-sm text-neutral-900 resize-none',
            'placeholder:text-neutral-400 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            error
              ? 'border-error focus:ring-error/20 focus:border-error'
              : 'border-neutral-200 hover:border-neutral-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
