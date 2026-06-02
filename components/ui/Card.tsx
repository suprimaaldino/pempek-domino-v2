import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-card shadow-card border border-brown/5',
        hoverable && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between p-4 pb-0', className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h3 className="font-display font-semibold text-brown text-lg leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-brown/60 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
