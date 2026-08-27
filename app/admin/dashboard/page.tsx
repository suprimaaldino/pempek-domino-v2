'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KPICard } from '@/components/admin/KPICard';
import { OrderCard } from '@/components/admin/OrderCard';
import { RevenueLineChart } from '@/components/charts/RevenueLineChart';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton';
import { formatRupiah } from '@/lib/utils';
import type { Order, DashboardKPI, RevenueDataPoint } from '@/types';
import { z } from 'zod';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  whatsappNumber: z.string(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  deliveryFee: z.number(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    price: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
  })),
  subtotal: z.number(),
  total: z.number(),
  status: z.enum(['pending', 'ready', 'completed', 'delivered']),
  paymentStatus: z.enum(['unpaid', 'paid']),
  createdAt: z.any(),
  updatedAt: z.any(),
});

function parseOrder(id: string, data: unknown): Order | null {
  const result = OrderSchema.safeParse({ id, ...(data as Record<string, unknown>) });
  return result.success ? (result.data as Order) : null;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPI>({
    ordersToday: 0,
    revenueToday: 0,
    pendingPickup: 0,
    completedToday: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);

      const ordersRef = collection(db, 'orders');

      // 1. Fetch KPIs + Chart Data in parallel via a single 7-day query batch
      const kpiPromise = async () => {
        const qToday = query(ordersRef, where('createdAt', '>=', Timestamp.fromDate(start)), where('createdAt', '<=', Timestamp.fromDate(end)));
        const snapToday = await getDocs(qToday);
        let revenueToday = 0;
        let completedToday = 0;
        snapToday.forEach((doc) => {
          const data = doc.data();
          revenueToday += data.total || 0;
          if (data.status === 'completed' || data.status === 'delivered') completedToday++;
        });

        const qPending = query(ordersRef, where('status', 'in', ['pending', 'ready']));
        const snapPending = await getDocs(qPending);

        return {
          ordersToday: snapToday.size,
          revenueToday,
          pendingPickup: snapPending.size,
          completedToday,
        };
      };

      const chartPromise = async () => {
        const sevenDaysAgo = startOfDay(subDays(today, 6));
        const qWeek = query(ordersRef, where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)));
        const snapWeek = await getDocs(qWeek);

        const dayMap = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
          dayMap.set(format(subDays(today, i), 'dd/MM'), 0);
        }
        snapWeek.forEach(doc => {
          const data = doc.data();
          const created = data.createdAt?.toDate?.() ?? new Date();
          const day = format(created, 'dd/MM');
          dayMap.set(day, (dayMap.get(day) || 0) + (data.total || 0));
        });
        return Array.from(dayMap.entries()).map(([date, revenue]) => ({ date, revenue }));
      };

      const recentPromise = async () => {
        const qRecent = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
        const snapRecent = await getDocs(qRecent);
        const recent: Order[] = [];
        snapRecent.forEach((doc) => {
          const parsed = parseOrder(doc.id, doc.data());
          if (parsed) recent.push(parsed);
        });
        return recent;
      };

      const [kpiResult, chartResult, recentResult] = await Promise.all([
        kpiPromise(),
        chartPromise(),
        recentPromise(),
      ]);

      setKpis(kpiResult);
      setChartData(chartResult);
      setRecentOrders(recentResult);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-brown">Ringkasan Bisnis</h1>
          <p className="text-brown/50">Halo Admin, berikut perkembangan hari ini.</p>
        </div>
        <Link href="/order" target="_blank">
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Plus size={16} />
            Pesanan Baru
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error/10 text-error rounded-card p-4 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchDashboardData}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Pesanan Hari Ini" 
          value={String(kpis.ordersToday)} 
          icon={<ShoppingBag size={20} />} 
          colorClass="bg-blue-100 text-blue-600"
        />
        <KPICard 
          title="Pendapatan Hari Ini" 
          value={formatRupiah(kpis.revenueToday)} 
          icon={<DollarSign size={20} />} 
          colorClass="bg-success/10 text-success"
        />
        <KPICard 
          title="Menunggu Pickup" 
          value={String(kpis.pendingPickup)} 
          icon={<Clock size={20} />} 
          colorClass="bg-warning/10 text-warning"
        />
        <KPICard 
          title="Sudah Selesai" 
          value={String(kpis.completedToday)} 
          icon={<CheckCircle2 size={20} />} 
          colorClass="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Tren Pendapatan" 
              subtitle="7 Hari Terakhir"
            />
            <CardBody className="pt-0">
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <RevenueLineChart data={chartData} />
              )}
            </CardBody>
          </Card>

          {/* Quick Actions for Mobile */}
          <div className="flex sm:hidden gap-3">
            <Link href="/admin/orders" className="flex-1">
              <Button variant="outline" className="w-full text-xs">Semua Pesanan</Button>
            </Link>
            <Link href="/admin/recap" className="flex-1">
              <Button variant="outline" className="w-full text-xs">Rekap Harian</Button>
            </Link>
          </div>
        </div>

        {/* Recent Orders Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display font-semibold text-xl text-brown">Pesanan Terbaru</h2>
            <Link href="/admin/orders" className="text-secondary text-sm font-semibold flex items-center gap-1 hover:underline">
              Lihat Semua
              <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <SkeletonList count={3} />
            ) : recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <OrderCard key={order.id} order={order} compact />
              ))
            ) : (
              <p className="text-center text-brown/40 pt-10">Belum ada pesanan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
