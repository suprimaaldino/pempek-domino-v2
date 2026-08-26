import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  runTransaction,
  increment,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import type {
  Product,
  Order,
  Customer,
  PaymentConfig,
  BusinessSettings,
  OrderStatus,
  ProductCategory,
} from '@/types';
import { format } from 'date-fns';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  isActive: z.boolean(),
  description: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  whatsappNumber: z.string(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  pickupDateTime: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryFee: z.number(),
    items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    price: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
    category: z.string().optional(),
  })),
  subtotal: z.number(),
  total: z.number(),
  status: z.enum(['pending', 'ready', 'completed', 'delivered']),
  paymentMethod: z.enum(['qris', 'dana', 'transfer']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid']),
  paymentProofUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  whatsappNumber: z.string(),
  totalOrders: z.number(),
  totalSpending: z.number(),
  lastOrderAt: z.any(),
  createdAt: z.any(),
});

function parseProduct(id: string, data: DocumentData): Product | null {
  const result = ProductSchema.safeParse({ id, ...data });
  return result.success ? result.data as Product : null;
}

function parseOrder(id: string, data: DocumentData): Order | null {
  const result = OrderSchema.safeParse({ id, ...data });
  return result.success ? result.data as Order : null;
}

function parseCustomer(id: string, data: DocumentData): Customer | null {
  const result = CustomerSchema.safeParse({ id, ...data });
  return result.success ? result.data as Customer : null;
}

function nonNull<T>(item: T | null): item is T {
  return item !== null;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('isActive', '==', true),
    orderBy('category'),
    orderBy('name')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseProduct(d.id, d.data())).filter(nonNull);
}

export async function getAllProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('category'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseProduct(d.id, d.data())).filter(nonNull);
}

export function subscribeToProducts(
  callback: (products: Product[]) => void
): () => void {
  const q = query(collection(db, 'products'), orderBy('category'), orderBy('name'));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    callback(snap.docs.map((d) => parseProduct(d.id, d.data())).filter(nonNull));
  });
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'products', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// ─── Order Number Generator ────────────────────────────────────────────────
//
// Format: PD-YYYYMMDD-NNN-XXXX (XXXX = random suffix).
// The daily sequence keeps orders sortable; the random suffix makes numbers
// unguessable so public lookups (/my-orders, orderLookups) cannot enumerate
// other customers' orders.

const ORDER_SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function randomOrderSuffix(length: number = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (b) => ORDER_SUFFIX_ALPHABET[b % ORDER_SUFFIX_ALPHABET.length]
  ).join('');
}

export async function generateOrderNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const counterRef = doc(db, 'counters', today);

  const nextNum = await runTransaction(db, async (txn) => {
    const snap = await txn.get(counterRef);
    const current = snap.exists() ? (snap.data().count as number) : 0;
    const next = current + 1;
    txn.set(counterRef, { count: next });
    return next;
  });

  return `PD-${today}-${String(nextNum).padStart(3, '0')}-${randomOrderSuffix()}`;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  await setDoc(doc(db, 'orderLookups', data.orderNumber.toUpperCase().trim()), {
    orderId: ref.id,
    createdAt: now,
  });
  return ref.id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return parseOrder(snap.id, snap.data());
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function updateOrder(
  id: string,
  data: Partial<Omit<Order, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'orders', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', id));
}

export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  filters?: { status?: OrderStatus; dateFrom?: Date; dateTo?: Date }
): () => void {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.dateFrom) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
  }

  const q = query(collection(db, 'orders'), ...constraints);
  return onSnapshot(q, (snap: QuerySnapshot) => {
    callback(snap.docs.map((d) => parseOrder(d.id, d.data())).filter(nonNull));
  });
}

export async function getOrdersByDateRange(
  from: Date,
  to: Date
): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('createdAt', '>=', Timestamp.fromDate(from)),
    where('createdAt', '<=', Timestamp.fromDate(to)),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseOrder(d.id, d.data())).filter(nonNull);
}

export async function getRecentOrders(count: number = 5): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseOrder(d.id, d.data())).filter(nonNull);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function upsertCustomer(
  name: string,
  whatsappNumber: string,
  orderTotal: number
): Promise<void> {
  const now = Timestamp.now();
  // Use normalized phone as document ID → natural dedup, no read needed
  const docId = whatsappNumber.replace(/\D/g, '');
  const customerRef = doc(db, 'customers', docId);

  await setDoc(
    customerRef,
    {
      name,
      whatsappNumber,
      totalOrders: increment(1),
      totalSpending: increment(orderTotal),
      lastOrderAt: now,
      createdAt: now, // only meaningful on first write; merge keeps existing if needed
    },
    { merge: true }
  );
}

export async function getCustomers(): Promise<Customer[]> {
  const q = query(
    collection(db, 'customers'),
    orderBy('lastOrderAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseCustomer(d.id, d.data())).filter(nonNull);
}

export async function getCustomerOrders(whatsappNumber: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('whatsappNumber', '==', whatsappNumber),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseOrder(d.id, d.data())).filter(nonNull);
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const normalized = orderNumber.toUpperCase().trim();
  const lookupSnap = await getDoc(doc(db, 'orderLookups', normalized));
  if (!lookupSnap.exists()) return null;

  const orderId = lookupSnap.data().orderId as string | undefined;
  if (!orderId) return null;

  return getOrder(orderId);
}

// ─── Payment Config ───────────────────────────────────────────────────────────

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const snap = await getDoc(doc(db, 'paymentConfig', 'main'));
  if (!snap.exists()) return null;
  return snap.data() as PaymentConfig;
}

export async function updatePaymentConfig(data: Partial<PaymentConfig>): Promise<void> {
  await setDoc(doc(db, 'paymentConfig', 'main'), data, { merge: true });
}

// ─── Business Settings ────────────────────────────────────────────────────────

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'business'));
  if (!snap.exists()) return null;
  return snap.data() as BusinessSettings;
}

export async function updateBusinessSettings(
  data: Partial<BusinessSettings>
): Promise<void> {
  await setDoc(doc(db, 'settings', 'business'), data, { merge: true });
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedProducts: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>> = [
  { name: 'Pempek Lenjer Kecil', category: 'kecil' as ProductCategory, price: 5000, isActive: true },
  { name: 'Pempek Adaan', category: 'kecil' as ProductCategory, price: 5000, isActive: true },
  { name: 'Pempek Telor', category: 'kecil' as ProductCategory, price: 5000, isActive: true },
  { name: 'Pempek Kulit', category: 'kecil' as ProductCategory, price: 5000, isActive: true },
  { name: 'Pempek Lenjer Besar', category: 'besar' as ProductCategory, price: 15000, isActive: true },
  { name: 'Pempek Kapsel', category: 'besar' as ProductCategory, price: 15000, isActive: true },
  { name: 'Pempek Lenggang', category: 'besar' as ProductCategory, price: 15000, isActive: true },
  { name: 'Tekwan', category: 'besar' as ProductCategory, price: 13000, isActive: true },
  { name: 'Mix Isi 5', category: 'paket' as ProductCategory, price: 22000, isActive: true },
  { name: 'Mix Isi 10', category: 'paket' as ProductCategory, price: 44000, isActive: true },
  { name: 'Mix Isi 15', category: 'paket' as ProductCategory, price: 66000, isActive: true },
  { name: 'Mix Isi 20', category: 'paket' as ProductCategory, price: 88000, isActive: true },
];

export async function seedProductsIfEmpty(): Promise<void> {
  const existing = await getDocs(query(collection(db, 'products'), limit(1)));
  if (!existing.empty) return;

  const now = Timestamp.now();
  const batch = seedProducts.map((p) =>
    addDoc(collection(db, 'products'), {
      ...p,
      imageUrl: '',
      createdAt: now,
      updatedAt: now,
    })
  );
  await Promise.all(batch);

  // Seed default payment config
  await setDoc(doc(db, 'paymentConfig', 'main'), {
    qrisImageUrl: '',
    danaNumber: '',
    bankAccountNumber: '',
    bankAccountName: 'Pempek Domino',
    bankName: 'BCA',
    defaultDeliveryFee: 10000,
    deliveryArea: '',
    methods: [
      {
        id: 'qris',
        methodType: 'qris',
        name: 'QRIS',
        provider: 'QRIS',
        accountNumber: '',
        isActive: true,
      },
      {
        id: 'dana',
        methodType: 'dana',
        name: 'Dana',
        provider: 'Dana',
        accountNumber: '',
        isActive: true,
      },
      {
        id: 'transfer',
        methodType: 'transfer',
        name: 'Transfer Bank',
        provider: 'BCA',
        accountNumber: '',
        accountName: 'Pempek Domino',
        isActive: true,
      },
    ],
  } satisfies PaymentConfig);

  // Seed default business settings — ganti dengan data toko sesungguhnya di halaman Settings
  await setDoc(doc(db, 'settings', 'business'), {
    storeName: 'Pempek Domino',
    address: 'Alamat Toko (ubah di Settings)',
    whatsappNumber: '6280000000000',
    operationalDays: 'Setiap Hari',
    openingTime: '08:00',
    closingTime: '20:00',
    googleMapsUrl: '',
  } satisfies BusinessSettings);
}
