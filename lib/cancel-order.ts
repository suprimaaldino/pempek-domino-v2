import { getSavedPhone } from '@/lib/saved-orders';

/**
 * An order can only be cancelled while it is still `pending` (Menunggu).
 * Once the shop has processed it (`ready`, `completed`, `delivered`) it is too
 * late, and `cancelled` is terminal.
 *
 * The server enforces this too (POST /api/order/[n]/cancel returns 400 for a
 * non-pending order); this is the UI guard so the button is simply not offered.
 */
export function canCancelOrder(order: { status: string }): boolean {
  return order.status === 'pending';
}

/**
 * Cancel a guest order.
 *
 * The cancel API requires the order's WhatsApp number as proof of ownership
 * (the public lookup route redacts it), so the caller must supply one. Callers
 * should pass `phoneOverride` when the customer has just typed it into the
 * confirmation dialog; otherwise the number this device recorded is used.
 *
 * Never falls back to `window.prompt` — the UI collects the value through
 * ConfirmDialog instead, so no native dialog ever appears.
 */
export async function cancelOrderAsGuest(
  orderNumber: string,
  phoneOverride?: string
): Promise<boolean> {
  const phone = (phoneOverride ?? getSavedPhone(orderNumber) ?? '').trim();

  if (!phone) {
    throw new Error('Nomor WhatsApp diperlukan untuk membatalkan pesanan.');
  }

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
