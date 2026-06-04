'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { getPaymentConfig, updatePaymentConfig } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { PaymentConfig, PaymentMethodItem, PaymentMethodType } from '@/types';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_TYPES: { value: PaymentMethodType; label: string; icon: React.ReactNode }[] = [
  { value: 'qris', label: 'QRIS', icon: <QrCode size={18} /> },
  { value: 'ewallet', label: 'E-Wallet', icon: <Smartphone size={18} /> },
  { value: 'bank', label: 'Bank Transfer', icon: <Building2 size={18} /> },
];

const EWALLET_PROVIDERS = ['Dana', 'GoPay', 'ShopeePay', 'OVO', 'LinkAja', 'Lainnya'];
const BANK_OPTIONS = ['BCA', 'BNI', 'BRI', 'Mandiri', 'Seabank', 'BSI', 'CIMB', 'Danamon', 'Lainnya'];

function getMethodIcon(type: PaymentMethodType) {
  switch (type) {
    case 'qris': return <QrCode size={20} className="text-purple-600" />;
    case 'ewallet':
    case 'dana': return <Smartphone size={20} className="text-blue-500" />;
    case 'bank':
    case 'transfer': return <Building2 size={20} className="text-green-600" />;
    default: return <CreditCard size={20} className="text-brown/50" />;
  }
}

function getMethodLabel(type: PaymentMethodType) {
  switch (type) {
    case 'qris': return 'QRIS';
    case 'ewallet': return 'E-Wallet';
    case 'dana': return 'E-Wallet (Dana)';
    case 'bank': return 'Bank Transfer';
    case 'transfer': return 'Bank Transfer';
  }
}

function getMethodBadgeClass(type: PaymentMethodType) {
  switch (type) {
    case 'qris': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ewallet':
    case 'dana': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'bank':
    case 'transfer': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-brown/5 text-brown/60 border-brown/10';
  }
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM = {
  methodType: 'qris' as PaymentMethodType,
  name: '',
  provider: '',
  accountName: '',
  accountNumber: '',
  qrisImageUrl: '',
  isActive: true,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ ...DEFAULT_FORM });

  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const cfg = await getPaymentConfig();
      setConfig(cfg);
      setMethods(cfg?.methods ?? []);
    } catch {
      toastError('Gagal memuat konfigurasi pembayaran');
    } finally {
      setLoading(false);
    }
  }

  // ─── Save helpers ────────────────────────────────────────────────────────────

  async function saveMethods(updated: PaymentMethodItem[]) {
    setSaving(true);
    try {
      await updatePaymentConfig({ ...config, methods: updated } as Partial<PaymentConfig>);
      setMethods(updated);
      toastSuccess('Metode pembayaran disimpan');
    } catch {
      toastError('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setModalOpen(true);
  }

  function openEdit(method: PaymentMethodItem) {
    setEditingId(method.id);
    setForm({
      methodType: method.methodType,
      name: method.name,
      provider: method.provider ?? '',
      accountName: method.accountName ?? '',
      accountNumber: method.accountNumber ?? '',
      qrisImageUrl: method.qrisImageUrl ?? '',
      isActive: method.isActive,
    });
    setModalOpen(true);
  }

  function handleFormChange(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleTypeChange(type: PaymentMethodType) {
    setForm({ ...DEFAULT_FORM, methodType: type });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) { toastError('Nama metode harus diisi'); return; }
    if (form.methodType === 'qris' && !form.qrisImageUrl) {
      toastError('Gambar QRIS harus diupload'); return;
    }
    if ((form.methodType === 'ewallet') && !form.provider.trim()) {
      toastError('Nama penyedia e-wallet harus diisi'); return;
    }
    if ((form.methodType === 'ewallet') && !form.accountNumber.trim()) {
      toastError('Nomor akun harus diisi'); return;
    }
    if (form.methodType === 'bank' && !form.provider.trim()) {
      toastError('Nama bank harus diisi'); return;
    }
    if (form.methodType === 'bank' && !form.accountNumber.trim()) {
      toastError('Nomor rekening harus diisi'); return;
    }

    const item: PaymentMethodItem = {
      id: editingId ?? `${form.methodType}-${Date.now()}`,
      methodType: form.methodType,
      name: form.name.trim(),
      provider: form.provider.trim(),
      accountName: form.accountName.trim(),
      // For QRIS: store the image as both accountNumber and qrisImageUrl
      // For others: store the account/rekening number
      accountNumber: form.methodType === 'qris' ? form.qrisImageUrl : form.accountNumber.trim(),
      isActive: form.isActive,
      // Only include qrisImageUrl for QRIS — Firestore rejects undefined values
      ...(form.methodType === 'qris' ? { qrisImageUrl: form.qrisImageUrl } : {}),
    };

    let updated: PaymentMethodItem[];
    if (editingId) {
      updated = methods.map(m => (m.id === editingId ? item : m));
    } else {
      updated = [...methods, item];
    }

    await saveMethods(updated);
    setModalOpen(false);
  }

  async function handleToggleActive(id: string) {
    const updated = methods.map(m =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    await saveMethods(updated);
  }

  async function handleDelete(id: string) {
    const updated = methods.filter(m => m.id !== id);
    await saveMethods(updated);
    setDeleteId(null);
    toastSuccess('Metode pembayaran dihapus');
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeCount = methods.filter(m => m.isActive).length;
  const inactiveCount = methods.filter(m => !m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brown/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CreditCard size={24} />
            </div>
            <h1 className="font-display font-bold text-3xl text-brown">Metode Pembayaran</h1>
          </div>
          <p className="text-brown/50">Kelola metode pembayaran yang tersedia untuk pelanggan.</p>
        </div>
        <Button onClick={openAdd} disabled={saving}>
          <Plus size={18} />
          Tambah Metode
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-badge border border-brown/5 px-4 py-2 flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-sm font-semibold text-brown">{activeCount} Aktif</span>
        </div>
        <div className="bg-white rounded-badge border border-brown/5 px-4 py-2 flex items-center gap-2 shadow-sm">
          <XCircle size={16} className="text-error" />
          <span className="text-sm font-semibold text-brown">{inactiveCount} Nonaktif</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList count={3} />
      ) : methods.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-primary/50" />
          </div>
          <p className="text-brown/60 font-semibold text-lg mb-1">Belum ada metode pembayaran</p>
          <p className="text-brown/40 text-sm mb-6">Tambahkan QRIS, E-Wallet, atau Bank Transfer.</p>
          <Button onClick={openAdd}>
            <Plus size={18} /> Tambah Metode Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map(method => (
            <div
              key={method.id}
              className={cn(
                'bg-white rounded-card shadow-card border transition-all',
                method.isActive ? 'border-brown/5' : 'border-brown/5 opacity-60'
              )}
            >
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brown/5 flex items-center justify-center shrink-0">
                      {getMethodIcon(method.methodType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brown truncate">{method.name}</p>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5',
                        getMethodBadgeClass(method.methodType)
                      )}>
                        {getMethodLabel(method.methodType)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(method.id)}
                      disabled={saving}
                      aria-label={method.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      className="p-2 rounded-lg hover:bg-brown/5 transition-colors"
                    >
                      {method.isActive
                        ? <ToggleRight size={22} className="text-green-500" />
                        : <ToggleLeft size={22} className="text-brown/30" />}
                    </button>
                    <button
                      onClick={() => openEdit(method)}
                      aria-label="Edit"
                      className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-brown/40"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(method.id)}
                      aria-label="Hapus"
                      className="p-2 rounded-lg hover:bg-error/10 hover:text-error transition-colors text-brown/40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Detail info */}
                <div className="mt-3 pt-3 border-t border-brown/5 space-y-1 text-sm text-brown/70">
                  {method.methodType === 'qris' && (
                    <div className="flex items-center gap-2">
                      {method.qrisImageUrl || method.accountNumber ? (
                        <>
                          {/* QR Preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={method.qrisImageUrl || method.accountNumber}
                            alt="QRIS"
                            className="w-16 h-16 object-contain rounded border border-brown/10"
                          />
                          <span className="text-xs text-brown/50">Gambar QRIS tersimpan</span>
                        </>
                      ) : (
                        <span className="text-xs text-error">Belum ada gambar QRIS</span>
                      )}
                    </div>
                  )}

                  {(method.methodType === 'ewallet' || method.methodType === 'dana') && (
                    <>
                      <p><span className="font-semibold text-brown/50">Provider:</span> {method.provider || '—'}</p>
                      {method.accountName && <p><span className="font-semibold text-brown/50">Nama Akun:</span> {method.accountName}</p>}
                      <p><span className="font-semibold text-brown/50">Nomor:</span> {method.accountNumber || '—'}</p>
                    </>
                  )}

                  {(method.methodType === 'bank' || method.methodType === 'transfer') && (
                    <>
                      <p><span className="font-semibold text-brown/50">Bank:</span> {method.provider || '—'}</p>
                      {method.accountName && <p><span className="font-semibold text-brown/50">Nama Rekening:</span> {method.accountName}</p>}
                      <p><span className="font-semibold text-brown/50">No. Rekening:</span> {method.accountNumber || '—'}</p>
                    </>
                  )}
                </div>

                {/* Status badge */}
                <div className="mt-3 flex items-center gap-1.5">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    method.isActive ? 'bg-green-500' : 'bg-brown/20'
                  )} />
                  <span className={cn('text-xs font-semibold', method.isActive ? 'text-green-600' : 'text-brown/40')}>
                    {method.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Jenis Pembayaran */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-brown">Jenis Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {METHOD_TYPES.map(mt => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => handleTypeChange(mt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-input border-2 text-sm font-semibold transition-all',
                    form.methodType === mt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-brown/20 text-brown/60 hover:border-brown/40'
                  )}
                >
                  {mt.icon}
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Label */}
          <Input
            label="Nama / Label Metode"
            placeholder={
              form.methodType === 'qris' ? 'Contoh: QRIS Pempek Domino' :
              form.methodType === 'ewallet' ? 'Contoh: GoPay Domino' :
              'Contoh: BCA Domino'
            }
            value={form.name}
            onChange={e => handleFormChange('name', e.target.value)}
            required
          />

          {/* ── QRIS fields ─────────────────────────────────────── */}
          {form.methodType === 'qris' && (
            <ImageUpload
              label="Upload Gambar QRIS"
              currentUrl={form.qrisImageUrl}
              storagePath="qris"
              onUploaded={url => handleFormChange('qrisImageUrl', url)}
            />
          )}

          {/* ── E-Wallet fields ─────────────────────────────────── */}
          {form.methodType === 'ewallet' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-brown">Nama Penyedia Jasa</label>
                <select
                  className="w-full rounded-input border border-brown/20 px-4 py-3 text-brown bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  value={form.provider}
                  onChange={e => handleFormChange('provider', e.target.value)}
                  required
                >
                  <option value="">Pilih Provider</option>
                  {EWALLET_PROVIDERS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Nama Akun"
                placeholder="Contoh: Pempek Domino"
                value={form.accountName}
                onChange={e => handleFormChange('accountName', e.target.value)}
              />
              <Input
                label="Nomor Akun"
                placeholder="Contoh: 081234567890"
                type="tel"
                value={form.accountNumber}
                onChange={e => handleFormChange('accountNumber', e.target.value)}
                required
              />
            </>
          )}

          {/* ── Bank fields ─────────────────────────────────────── */}
          {form.methodType === 'bank' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-brown">Nama Bank</label>
                <select
                  className="w-full rounded-input border border-brown/20 px-4 py-3 text-brown bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  value={form.provider}
                  onChange={e => handleFormChange('provider', e.target.value)}
                  required
                >
                  <option value="">Pilih Bank</option>
                  {BANK_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Nama Rekening"
                placeholder="Contoh: Pempek Domino"
                value={form.accountName}
                onChange={e => handleFormChange('accountName', e.target.value)}
              />
              <Input
                label="Nomor Rekening"
                placeholder="Contoh: 1234567890"
                type="text"
                inputMode="numeric"
                value={form.accountNumber}
                onChange={e => handleFormChange('accountNumber', e.target.value)}
                required
              />
            </>
          )}

          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-input bg-brown/5">
            <button
              type="button"
              onClick={() => handleFormChange('isActive', !form.isActive)}
              aria-label="Toggle aktif"
            >
              {form.isActive
                ? <ToggleRight size={28} className="text-green-500" />
                : <ToggleLeft size={28} className="text-brown/30" />}
            </button>
            <div>
              <p className="text-sm font-semibold text-brown">
                {form.isActive ? 'Aktif' : 'Nonaktif'}
              </p>
              <p className="text-xs text-brown/50">
                {form.isActive
                  ? 'Metode ini akan tampil di halaman pemesanan'
                  : 'Metode ini disembunyikan dari pelanggan'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-brown/5">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" type="submit" loading={saving}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Metode'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Metode Pembayaran"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
              <Trash2 size={28} className="text-error" />
            </div>
            <p className="text-brown text-center">
              Yakin ingin menghapus metode <strong>
                {methods.find(m => m.id === deleteId)?.name}
              </strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={saving}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
