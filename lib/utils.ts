import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { BusinessSettings } from '@/types';

// ─── Tailwind class helper ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format number to Rupiah: 15000 → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Format WA number for display: "6281776400024" → "0817-7640-0024"
 */
export function formatWhatsApp(number: string): string {
  // Convert 628xxx → 08xxx
  let local = number.startsWith('62') ? '0' + number.slice(2) : number;
  // Remove non-digits
  local = local.replace(/\D/g, '');
  // Format: 08xx-xxxx-xxxx
  if (local.length >= 10) {
    return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
  }
  return local;
}

/**
 * Normalize phone to 628xxx format for storage.
 * Accepts: 08xxx, +628xxx, 628xxx
 */
export function normalizePhone(input: string): string {
  let cleaned = input.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('628')) {
    // already correct
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// ─── Store hours ─────────────────────────────────────────────────────────────

export function formatStoreHours(
  settings: Pick<BusinessSettings, 'operationalDays' | 'openingTime' | 'closingTime' | 'openingHours'>
): string | null {
  const hasTime = Boolean(settings.openingTime && settings.closingTime);
  const timeRange = hasTime ? `${settings.openingTime} - ${settings.closingTime}` : null;

  if (settings.operationalDays && timeRange) {
    return `${settings.operationalDays}, ${timeRange}`;
  }
  if (timeRange) return timeRange;
  if (settings.operationalDays) return settings.operationalDays;
  if (settings.openingHours) return settings.openingHours;
  return null;
}

// ─── WhatsApp Links ────────────────────────────────────────────────────────────

/**
 * Build a wa.me link.
 * @param phone - in 628xxx format
 * @param message - plain text message (will be URI encoded)
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

// ─── Date ─────────────────────────────────────────────────────────────────────

/**
 * Format a Date or Firestore Timestamp to a friendly Indonesian string.
 * e.g. "Senin, 15 Juni 2024 · 14:30"
 */
export function formatDateId(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return format(d, "EEEE, d MMMM yyyy '·' HH:mm", { locale: localeId });
}

/**
 * Format date as short: "15 Jun 2024"
 */
export function formatDateShort(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return format(d, 'd MMM yyyy', { locale: localeId });
}

/**
 * Format time only: "14:30"
 */
export function formatTime(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return format(d, 'HH:mm');
}

// ─── Status Labels ─────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  ready: 'Siap',
  completed: 'Selesai',
  delivered: 'Dikirim',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Belum Bayar',
  paid: 'Sudah Bayar',
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  pickup: 'Ambil Sendiri',
  delivery: 'Dikirim',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  qris: 'QRIS',
  dana: 'Dana',
  transfer: 'Transfer Bank',
};

export const CATEGORY_LABELS: Record<string, string> = {
  kecil: 'Pempek Kecil',
  besar: 'Pempek Besar',
  paket: 'Paket Hemat',
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
