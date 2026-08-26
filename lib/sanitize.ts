import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks.
 * Removes all HTML tags and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  if (typeof window === 'undefined') return input.trim().replace(/\s+/g, ' ');

  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  return cleaned.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize and validate a name field.
 * Only allows letters, numbers, spaces, and common punctuation.
 */
export function sanitizeName(name: string): string {
  const sanitized = sanitizeInput(name);
  // Remove any characters that aren't letters, numbers, spaces, or common punctuation
  return sanitized.replace(/[^a-zA-Z0-9\s\-'\.]/g, '').trim();
}

/**
 * Sanitize phone number - only allows digits.
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * Sanitize address - allows letters, numbers, spaces, and address-related punctuation.
 */
export function sanitizeAddress(address: string): string {
  const sanitized = sanitizeInput(address);
  // Allow common address characters
  return sanitized.replace(/[^a-zA-Z0-9\s,\.\-\/#()]/g, '').trim();
}

/**
 * Sanitize notes - allows more characters but still removes HTML.
 */
export function sanitizeNotes(notes: string): string {
  const sanitized = sanitizeInput(notes);
  // Allow common punctuation for notes
  return sanitized.replace(/[^a-zA-Z0-9\s,\.\-!?()@#$%&*]/g, '').trim();
}

interface OrderData {
  customerName: string;
  whatsappNumber: string;
  deliveryAddress: string | null;
  notes: string;
  deliveryFee: number;
  total: number;
}

/**
 * Validate and normalize order data before submission.
 */
export function validateOrderData(data: {
  customerName: string;
  whatsappNumber: string;
  deliveryAddress?: string | null;
  notes?: string;
  deliveryFee: number;
  total: number;
}): {
  isValid: boolean;
  errors: string[];
  sanitizedData: OrderData;
} {
  const errors: string[] = [];
  
  // Sanitize inputs
  const sanitizedData = {
    ...data,
    customerName: sanitizeName(data.customerName),
    whatsappNumber: sanitizePhone(data.whatsappNumber),
    deliveryAddress: data.deliveryAddress ? sanitizeAddress(data.deliveryAddress) : null,
    notes: sanitizeNotes(data.notes || ''),
    // Ensure deliveryFee is non-negative and reasonable
    deliveryFee: Math.max(0, Math.min(data.deliveryFee || 0, 1000000)),
    // Ensure total is positive and reasonable
    total: Math.max(0, Math.min(data.total || 0, 100000000)),
  };
  
  // Validate customer name
  if (sanitizedData.customerName.length < 2) {
    errors.push('Nama minimal 2 karakter');
  }
  if (sanitizedData.customerName.length > 100) {
    errors.push('Nama maksimal 100 karakter');
  }
  
  // Validate WhatsApp number (Indonesia format: 628xxx)
  if (!/^628[0-9]{8,12}$/.test(sanitizedData.whatsappNumber)) {
    errors.push('Nomor WhatsApp tidak valid');
  }
  
  // Validate address if delivery
  if (data.deliveryAddress && sanitizedData.deliveryAddress && sanitizedData.deliveryAddress.length < 5) {
    errors.push('Alamat pengiriman minimal 5 karakter');
  }
  
  // Validate notes length
  if (sanitizedData.notes.length > 500) {
    errors.push('Catatan maksimal 500 karakter');
  }
  
  // Validate total
  if (sanitizedData.total <= 0) {
    errors.push('Total pesanan tidak valid');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}
