'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ProductSalesData } from '@/types';

interface TopProductsChartProps {
  data: ProductSalesData[];
}

const COLORS = ['#8B1E1E', '#B01E1E', '#D9A441', '#C08930', '#E67E22'];

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,42,32,0.07)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#3A2A20', opacity: 0.6 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="productName"
          tick={{ fontSize: 11, fill: '#3A2A20', opacity: 0.8 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          formatter={(value: any) => [`${value} porsi`, 'Terjual']}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid rgba(58,42,32,0.1)',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
