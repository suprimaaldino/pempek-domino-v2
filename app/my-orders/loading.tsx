import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function MyOrdersLoading() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto pt-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full text-neutral-300">
              <ArrowLeft size={18} />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 text-base leading-tight">Cek Pesanan</h1>
              <p className="text-xs text-neutral-400 font-medium">Masukkan nomor pesanan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6">
        {/* Security notice */}
        <div className="flex items-start gap-2 bg-white border border-neutral-100 rounded-card px-3 py-2.5 mb-4 shadow-card">
          <ShieldAlert size={14} className="text-neutral-300 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-400 leading-relaxed font-medium">
            Hanya pemesan yang tahu nomor pesanannya yang bisa melihat detail pesanan ini.
          </p>
        </div>

        {/* Search Form Skeleton */}
        <div className="mb-6 bg-white rounded-card shadow-card border border-neutral-100 p-4 space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-input" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          <div className="h-10 w-full rounded-pill bg-neutral-100 flex items-center justify-center gap-2 text-neutral-300 font-semibold text-sm">
            <Search size={15} />
            Cek Pesanan
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-3">
          <SkeletonCard />
        </div>
      </div>
    </main>
  );
}
