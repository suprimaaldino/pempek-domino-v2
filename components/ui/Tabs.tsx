'use client';

import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto scrollbar-none p-1 bg-brown/5 rounded-input',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'shrink-0 px-3 py-1.5 text-sm font-semibold rounded-badge transition-all duration-150',
            value === tab.value
              ? 'bg-white text-primary shadow-sm'
              : 'text-brown/60 hover:text-brown'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold',
                value === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-brown/15 text-brown/70'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
