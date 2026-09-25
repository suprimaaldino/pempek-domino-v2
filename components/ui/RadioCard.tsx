import React from 'react';
import { cn } from '@/lib/utils';

interface RadioCardProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function RadioCard({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-input border cursor-pointer',
        'transition-all duration-150 select-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1',
        checked
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-neutral-200 bg-white hover:border-neutral-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="sr-only"
      />

      {/* Custom radio dot */}
      <div
        className={cn(
          'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0',
          checked ? 'border-primary' : 'border-neutral-300'
        )}
        style={{ width: '18px', height: '18px' }}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>

      {icon && (
        <div className={cn('shrink-0', checked ? 'text-primary' : 'text-neutral-500')}>
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-semibold block', checked ? 'text-primary' : 'text-neutral-800')}>
          {label}
        </span>
        {description && (
          <span className="text-xs text-neutral-500 block mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}
