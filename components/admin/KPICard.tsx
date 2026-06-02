import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  colorClass?: string;
}

export function KPICard({ title, value, icon, trend, colorClass = 'bg-primary/10 text-primary' }: KPICardProps) {
  return (
    <div className="bg-white rounded-card shadow-card border border-brown/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-brown/60 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-display font-bold text-brown leading-tight">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs font-semibold',
              trend.up ? 'text-success' : 'text-error'
            )}>
              {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-input flex items-center justify-center shrink-0', colorClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
