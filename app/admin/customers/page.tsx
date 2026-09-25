'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCustomers } from '@/lib/firestore';
import { CustomerCard } from '@/components/admin/CustomerCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setError(null);
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data pelanggan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.whatsappNumber.includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brown/10 pb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-brown">Daftar Pelanggan</h1>
          <p className="text-brown/60">Database pelanggan yang pernah memesan.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-md">
        <SearchInput 
          placeholder="Cari nama atau nomor WA..." 
          onSearch={setSearchQuery} 
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error rounded-card p-4 text-center">
            <p className="font-semibold">{error}</p>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonList count={6} />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
            {filteredCustomers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onClick={() => window.open(`https://wa.me/${customer.whatsappNumber}`, '_blank', 'noopener,noreferrer')}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            type={customers.length === 0 ? 'customers' : 'search'} 
            title={customers.length === 0 ? 'Belum Ada Pelanggan' : 'Pelanggan Tidak Ditemukan'}
            description={customers.length === 0 
              ? 'Data pelanggan akan otomatis muncul ketika ada pesanan pertama.'
              : 'Tidak ada pelanggan yang sesuai dengan pencarian Anda.'}
          />
        )}
      </div>
    </div>
  );
}
