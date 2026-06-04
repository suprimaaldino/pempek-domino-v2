import { Timestamp } from 'firebase/firestore';

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductCategory = 'kecil' | 'besar' | 'paket';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  isActive: boolean;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type DeliveryMethod = 'pickup' | 'delivery';
export type OrderStatus = 'pending' | 'ready' | 'completed' | 'delivered';
export type PaymentMethod = 'qris' | 'dana' | 'transfer';
export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  deliveryMethod: DeliveryMethod;
  pickupDateTime?: string | null;
  deliveryAddress?: string | null;
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string | null;
  notes?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  whatsappNumber: string;
  totalOrders: number;
  totalSpending: number;
  lastOrderAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Payment Config ───────────────────────────────────────────────────────────

export type PaymentMethodType = 'qris' | 'ewallet' | 'bank' | 'dana' | 'transfer';

export interface PaymentMethodItem {
  id: string;
  /** 'qris' | 'ewallet' | 'bank' — 'dana' and 'transfer' kept for backward compat */
  methodType: PaymentMethodType;
  name: string;
  /** For ewallet: provider name (Dana / Gopay / Shopeepay). For bank: bank name (BCA / BNI / …). For qris: 'QRIS' */
  provider: string;
  /** E-wallet or bank account number. For QRIS: base64 image data */
  accountNumber: string;
  accountName?: string;
  qrisImageUrl?: string;
  isActive: boolean;
}

export interface PaymentConfig {
  qrisImageUrl: string;
  danaNumber: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankName: string;
  defaultDeliveryFee?: number;
  deliveryArea?: string;
  methods?: PaymentMethodItem[];
}

// ─── Business Settings ────────────────────────────────────────────────────────

export interface BusinessSettings {
  storeName: string;
  address: string;
  whatsappNumber: string;
  openingHours: string;
}

// ─── Cart (client-side only) ──────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKPI {
  ordersToday: number;
  revenueToday: number;
  pendingPickup: number;
  completedToday: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface ProductSalesData {
  productName: string;
  quantity: number;
  revenue: number;
}
