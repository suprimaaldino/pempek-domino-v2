import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/types';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-brown/10 text-brown/70 border border-brown/20',
};

export function Badge({ label, variant = 'neutral', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-badge',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Menunggu', variant: 'warning' },
    ready: { label: 'Siap', variant: 'info' },
    completed: { label: 'Selesai', variant: 'success' },
    delivered: { label: 'Dikirim', variant: 'success' },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      label={status === 'paid' ? 'Sudah Bayar' : 'Belum Bayar'}
      variant={status === 'paid' ? 'success' : 'error'}
    />
  );
}
