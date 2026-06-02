'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueDataPoint } from '@/types';

interface DailyBarChartProps {
  data: RevenueDataPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brown/10 rounded-input px-3 py-2 shadow-card text-sm">
      <p className="font-semibold text-brown mb-1">{label}</p>
      <p className="text-primary font-bold">Rp {payload[0].value.toLocaleString('id-ID')}</p>
    </div>
  );
}

export function DailyBarChart({ data }: DailyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,42,32,0.07)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#3A2A20', opacity: 0.6 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#3A2A20', opacity: 0.6 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" fill="#8B1E1E" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
