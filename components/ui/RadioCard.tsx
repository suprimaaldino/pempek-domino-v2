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
        'flex items-start gap-3 p-4 rounded-input border-2 cursor-pointer',
        'transition-all duration-150 select-none',
        checked
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-brown/20 bg-white hover:border-brown/40',
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
      {/* Radio dot */}
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
          checked ? 'border-primary' : 'border-brown/30'
        )}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
      {icon && <div className="text-primary mt-0.5 shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <span className={cn('font-semibold text-brown block', checked && 'text-primary')}>
          {label}
        </span>
        {description && <span className="text-sm text-brown/60 block mt-0.5">{description}</span>}
      </div>
    </label>
  );
}
