import { getSavedPhone } from '@/lib/saved-orders';

/**
 * Cancel a guest order.
 *
 * The cancel API requires the order's WhatsApp number as proof of ownership
 * (the public lookup route redacts it), so the caller must supply one. We
 * prefer the number this device recorded when the order was placed, and fall
 * back to asking. Returns true when the server confirms the cancellation.
 */
export async function cancelOrderAsGuest(orderNumber: string): Promise<boolean> {
  const saved = getSavedPhone(orderNumber);
  const phone =
    saved ??
    window.prompt(
      'Masukkan nomor WhatsApp yang Anda gunakan saat memesan untuk membatalkan pesanan.'
    )?.trim();

  if (!phone) throw new Error('Nomor WhatsApp diperlukan untuk membatalkan pesanan.');

  const res = await fetch(
    `/api/order/${encodeURIComponent(orderNumber)}/cancel`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: phone }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Gagal membatalkan pesanan');
  return true;
}
