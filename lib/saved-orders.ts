/**
 * Guest order history persisted in localStorage.
 *
 * Previously duplicated in three places (order, confirmation, my-orders), each
 * with its own copy/trim logic. Centralized here so the behaviour — including
 * the cap and the malformed-JSON guard — is defined once.
 *
 * The WhatsApp number is stored alongside each order because the cancel API
 * requires it as proof of ownership: the public lookup route deliberately
 * redacts the number, so the browser can only supply what it recorded locally.
 */

const STORAGE_KEY = 'pempek-domino-orders';
const MAX_SAVED = 20;

export interface SavedOrder {
  orderNumber: string;
  orderId: string;
  customerName: string;
  /** Normalized 628… number; absent on records written by older versions. */
  whatsappNumber?: string;
}

function isSavedOrder(value: unknown): value is SavedOrder {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.orderNumber === 'string' && o.orderNumber.length > 0;
}

/** Read saved orders. Returns [] when storage is unavailable or corrupt. */
export function getSavedOrders(): SavedOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedOrder).slice(-MAX_SAVED);
  } catch {
    // localStorage can throw (private mode / disabled / malformed JSON).
    return [];
  }
}

/**
 * Add or update an order, keeping the newest MAX_SAVED entries.
 * No-op when the order number is missing.
 */
export function saveSavedOrder(order: SavedOrder): SavedOrder[] {
  if (!order?.orderNumber) return getSavedOrders();
  try {
    const next = [
      ...getSavedOrders().filter((o) => o.orderNumber !== order.orderNumber),
      order,
    ].slice(-MAX_SAVED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getSavedOrders();
  }
}

/** Remove an order (e.g. the server no longer knows it). */
export function removeSavedOrder(orderNumber: string): SavedOrder[] {
  try {
    const next = getSavedOrders().filter((o) => o.orderNumber !== orderNumber);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getSavedOrders();
  }
}

/** The WhatsApp number recorded for an order, if this device has it. */
export function getSavedPhone(orderNumber: string): string | null {
  const match = getSavedOrders().find((o) => o.orderNumber === orderNumber);
  return match?.whatsappNumber ?? null;
}
