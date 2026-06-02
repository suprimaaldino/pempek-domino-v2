import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { OrderStatus } from '@/types';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'ready', label: 'Siap' },
  { key: 'completed', label: 'Selesai' },
];

const ORDER: Record<OrderStatus, number> = {
  pending: 0,
  ready: 1,
  completed: 2,
  delivered: 2,
};

interface StatusStepperProps {
  status: OrderStatus;
}

export function StatusStepper({ status }: StatusStepperProps) {
  const currentIdx = ORDER[status];

  return (
    <div className="flex items-center gap-0" aria-label="Status pesanan">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all',
                  done && 'bg-success border-success text-white',
                  active && 'bg-primary border-primary text-white',
                  !done && !active && 'bg-white border-brown/20 text-brown/40'
                )}
              >
                {done ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-semibold whitespace-nowrap',
                  active ? 'text-primary' : done ? 'text-success' : 'text-brown/40'
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mb-5 mx-1 rounded-full',
                  done ? 'bg-success' : 'bg-brown/15'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
