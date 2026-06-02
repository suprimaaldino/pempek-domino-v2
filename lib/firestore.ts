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
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function docToProduct(id: string, data: DocumentData): Product {
  return { id, ...data } as Product;
}

function docToOrder(id: string, data: DocumentData): Order {
  return { id, ...data } as Order;
}

function docToCustomer(id: string, data: DocumentData): Customer {
  return { id, ...data } as Customer;
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
  return snap.docs.map((d) => docToProduct(d.id, d.data()));
}

export async function getAllProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('category'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToProduct(d.id, d.data()));
}

export function subscribeToProducts(
  callback: (products: Product[]) => void
): () => void {
  const q = query(collection(db, 'products'), orderBy('category'), orderBy('name'));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    callback(snap.docs.map((d) => docToProduct(d.id, d.data())));
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

  return `PD-${today}-${String(nextNum).padStart(3, '0')}`;
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
  return ref.id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return docToOrder(snap.id, snap.data());
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
    callback(snap.docs.map((d) => docToOrder(d.id, d.data())));
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
  return snap.docs.map((d) => docToOrder(d.id, d.data()));
}

export async function getRecentOrders(count: number = 5): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToOrder(d.id, d.data()));
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function upsertCustomer(
  name: string,
  whatsappNumber: string,
  orderTotal: number
): Promise<void> {
  const q = query(
    collection(db, 'customers'),
    where('whatsappNumber', '==', whatsappNumber),
    limit(1)
  );
  const snap = await getDocs(q);
  const now = Timestamp.now();

  if (snap.empty) {
    await addDoc(collection(db, 'customers'), {
      name,
      whatsappNumber,
      totalOrders: 1,
      totalSpending: orderTotal,
      lastOrderAt: now,
      createdAt: now,
    });
  } else {
    const ref = snap.docs[0].ref;
    const existing = snap.docs[0].data() as Omit<Customer, 'id'>;
    await updateDoc(ref, {
      name,
      totalOrders: existing.totalOrders + 1,
      totalSpending: existing.totalSpending + orderTotal,
      lastOrderAt: now,
    });
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const q = query(
    collection(db, 'customers'),
    orderBy('lastOrderAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToCustomer(d.id, d.data()));
}

export async function getCustomerOrders(whatsappNumber: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('whatsappNumber', '==', whatsappNumber),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToOrder(d.id, d.data()));
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
  } satisfies PaymentConfig);

  // Seed default business settings
  await setDoc(doc(db, 'settings', 'business'), {
    storeName: 'Pempek Domino',
    address: '',
    whatsappNumber: '6281776400024',
    openingHours: 'Setiap hari 08.00 - 20.00 WIB',
  } satisfies BusinessSettings);
}
