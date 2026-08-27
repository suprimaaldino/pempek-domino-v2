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
import { ChartTooltip } from './ChartTooltip';

interface DailyBarChartProps {
  data: RevenueDataPoint[];
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
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="revenue" fill="#D42B2B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
