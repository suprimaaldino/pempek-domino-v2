'use client';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-input px-3 py-2 shadow-card text-sm">
      <p className="font-semibold text-neutral-900 mb-1">{label}</p>
      <p className="text-primary font-bold">
        {formatter ? formatter(payload[0].value) : `Rp ${payload[0].value.toLocaleString('id-ID')}`}
      </p>
    </div>
  );
}
