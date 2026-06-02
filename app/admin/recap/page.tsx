'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  ShoppingBag,
  DollarSign,
  Package
} from 'lucide-react';
import { getOrdersByDateRange } from '@/lib/firestore';
import { formatRupiah, downloadCSV, CATEGORY_LABELS } from '@/lib/utils';
import { KPICard } from '@/components/admin/KPICard';
import { DailyBarChart } from '@/components/charts/DailyBarChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { startOfDay, endOfDay, format, startOfMonth, eachDayOfInterval } from 'date-fns';
import type { Order, RevenueDataPoint, ProductSalesData } from '@/types';

export default function RecapPage() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecap() {
      setLoading(true);
      try {
        const from = startOfDay(new Date(dateFrom));
        const to = endOfDay(new Date(dateTo));
        const data = await getOrdersByDateRange(from, to);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecap();
  }, [dateFrom, dateTo]);

  // Derived Statistics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  
  // Product Breakdown
  const productSalesMap = new Map<string, { quantity: number, revenue: number }>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productSalesMap.get(item.productName) || { quantity: 0, revenue: 0 };
      productSalesMap.set(item.productName, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.subtotal
      });
    });
  });

  const productStats: ProductSalesData[] = Array.from(productSalesMap.entries())
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  const totalProductsSold = productStats.reduce((sum, p) => sum + p.quantity, 0);

  // Daily Chart Data
  const dailyData: RevenueDataPoint[] = eachDayOfInterval({
    start: new Date(dateFrom),
    end: new Date(dateTo)
  }).map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const revenue = orders
      .filter(o => format(o.createdAt.toDate(), 'yyyy-MM-dd') === dayStr)
      .reduce((sum, o) => sum + o.total, 0);
    return {
      date: format(day, 'dd/MM'),
      revenue
    };
  });

  const handleExport = () => {
    const headers = ['Tanggal', 'No. Pesanan', 'Pelanggan', 'Status', 'Total'];
    const rows = orders.map(o => [
      format(o.createdAt.toDate(), 'dd/MM/yyyy HH:mm'),
      o.orderNumber,
      o.customerName,
      o.status,
      o.total.toString()
    ]);
    downloadCSV(`Rekap_PempekDomino_${dateFrom}_${dateTo}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-brown">Rekap Penjualan</h1>
          <p className="text-brown/50">Laporan performa bisnis dalam periode tertentu.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={orders.length === 0}>
          <Download size={18} />
          Ekspor CSV
        </Button>
      </div>

      {/* Date Picker */}
      <Card className="bg-white">
        <CardBody className="flex flex-col sm:flex-row items-end gap-4">
          <Input 
            label="Dari Tanggal" 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1"
          />
          <Input 
            label="Sampai Tanggal" 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1"
          />
        </CardBody>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard 
          title="Total Pendapatan" 
          value={formatRupiah(totalRevenue)} 
          icon={<DollarSign size={20} />} 
          colorClass="bg-success/10 text-success"
        />
        <KPICard 
          title="Total Pesanan" 
          value={`${totalOrders} Pesanan`} 
          icon={<ShoppingBag size={20} />} 
          colorClass="bg-blue-100 text-blue-600"
        />
        <KPICard 
          title="Produk Terjual" 
          value={`${totalProductsSold} Porsi`} 
          icon={<Package size={20} />} 
          colorClass="bg-accent/10 text-accent"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Perkembangan Harian" subtitle="Total omset per tanggal" />
          <CardBody>
            <DailyBarChart data={dailyData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Produk Terlaris" subtitle="Berdasarkan kuantitas terjual" />
          <CardBody>
            <TopProductsChart data={productStats.slice(0, 5)} />
          </CardBody>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader title="Rincian Produk" action={<Badge label={`${productStats.length} Produk`} variant="neutral" />} />
        <CardBody className="overflow-x-auto pt-0">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-brown/10 text-brown/40 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 pr-4">Nama Produk</th>
                <th className="py-3 px-4 text-center">Terjual</th>
                <th className="py-3 pl-4 text-right">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown/5">
              {productStats.map((p, i) => (
                <tr key={i} className="hover:bg-brown/5 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-brown">{p.productName}</td>
                  <td className="py-3 px-4 text-center text-brown/60 font-medium">{p.quantity}</td>
                  <td className="py-3 pl-4 text-right font-bold text-primary">{formatRupiah(p.revenue)}</td>
                </tr>
              ))}
              {productStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-brown/40 italic">Tidak ada data untuk periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
