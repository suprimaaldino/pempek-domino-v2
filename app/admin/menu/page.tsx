'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  UtensilsCrossed, 
  PackageCheck, 
  AlertCircle,
  PackageSearch
} from 'lucide-react';
import { 
  subscribeToProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/firestore';
import { CATEGORY_LABELS } from '@/lib/utils';
import { MenuItemCard } from '@/components/admin/MenuItemCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Product, ProductCategory } from '@/types';

const CATEGORIES: ProductCategory[] = ['kecil', 'besar', 'paket'];

export default function MenuManagementPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'kecil' as ProductCategory,
    description: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    const unsub = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description || '',
        imageUrl: product.imageUrl,
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        category: 'kecil',
        description: '',
        imageUrl: '',
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      toastError('Nama dan harga harus diisi dengan benar.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toastSuccess('Menu berhasil diperbarui');
      } else {
        await createProduct(formData);
        toastSuccess('Menu baru berhasil ditambahkan');
      }
      setModalOpen(false);
    } catch (err) {
      toastError('Gagal menyimpan menu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateProduct(id, { isActive });
      toastSuccess(`Menu ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (err) {
      toastError('Gagal mengubah status menu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus menu ini secara permanen?')) return;
    try {
      await deleteProduct(id);
      toastSuccess('Menu berhasil dihapus');
    } catch (err) {
      toastError('Gagal menghapus menu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brown/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UtensilsCrossed size={24} />
            </div>
            <h1 className="font-display font-bold text-3xl text-brown">Manajemen Menu</h1>
          </div>
          <p className="text-brown/50">Atur produk, harga, dan ketersediaan menu.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={18} />
          Tambah Menu
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white rounded-badge border border-brown/5 px-4 py-2 flex items-center gap-2 shadow-sm">
          <PackageCheck size={16} className="text-success" />
          <span className="text-sm font-semibold text-brown">{products.filter(p => p.isActive).length} Aktif</span>
        </div>
        <div className="bg-white rounded-badge border border-brown/5 px-4 py-2 flex items-center gap-2 shadow-sm">
          <AlertCircle size={16} className="text-error" />
          <span className="text-sm font-semibold text-brown">{products.filter(p => !p.isActive).length} Nonaktif</span>
        </div>
      </div>

      {/* Grid by Categories */}
      {loading ? (
        <SkeletonList count={6} />
      ) : products.length > 0 ? (
        <div className="space-y-10">
          {CATEGORIES.map(cat => {
            const catProds = products.filter(p => p.category === cat);
            if (catProds.length === 0) return null;

            return (
              <section key={cat} aria-label={CATEGORY_LABELS[cat]}>
                <h2 className="text-sm font-bold text-brown/40 uppercase tracking-widest mb-4 border-l-4 border-primary pl-3">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catProds.map(product => (
                    <MenuItemCard 
                      key={product.id} 
                      product={product} 
                      onEdit={openModal}
                      onDelete={handleDelete}
                      onToggleActive={handleToggle}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          type="products" 
          action={<Button onClick={() => openModal()}><Plus size={18} /> Buat Menu Pertama</Button>}
        />
      )}

      {/* Form Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingProduct ? 'Edit Menu' : 'Tambah Menu Baru'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload 
            label="Foto Produk"
            currentUrl={formData.imageUrl} 
            storagePath="products" 
            onUploaded={(url) => setFormData({ ...formData, imageUrl: url })} 
          />
          
          <Input 
            label="Nama Produk" 
            placeholder="Contoh: Pempek Lenjer" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Harga (Rp)" 
              type="number" 
              value={formData.price} 
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-brown">Kategori</label>
              <select 
                className="w-full rounded-input border border-brown/20 px-4 py-3 text-brown bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <Textarea 
            label="Deskripsi (Opsional)" 
            placeholder="Keterangan isi paket atau bahan..." 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isActive" 
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-brown/20"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-brown">Aktifkan menu agar dapat dipesan</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brown/5 mt-6">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Simpan Menu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
