'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueDataPoint } from '@/types';
import { ChartTooltip } from './ChartTooltip';

interface RevenueLineChartProps {
  data: RevenueDataPoint[];
}

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#D42B2B"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#D42B2B', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#D42B2B' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
