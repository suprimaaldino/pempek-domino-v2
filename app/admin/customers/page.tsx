'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Search, Phone, ExternalLink } from 'lucide-react';
import { getCustomers } from '@/lib/firestore';
import { formatRupiah, formatWhatsApp, formatDateShort } from '@/lib/utils';
import { CustomerCard } from '@/components/admin/CustomerCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error(err);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brown/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <h1 className="font-display font-bold text-3xl text-brown">Daftar Pelanggan</h1>
          </div>
          <p className="text-brown/50">Database pelanggan yang pernah memesan.</p>
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonList count={6} />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onClick={() => window.open(`https://wa.me/${customer.whatsappNumber}`, '_blank')}
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
