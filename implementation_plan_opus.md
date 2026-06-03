# Pempek Domino PWA — Implementation Plan

Build a production-ready PWA for a pre-order management system for a traditional Indonesian Pempek Palembang food business. The project lives in `d:\pempek-domino-v2` (currently empty).

## User Review Required

> [!IMPORTANT]
> **Tailwind CSS**: The prompt specifies Tailwind CSS v3. This overrides the default "vanilla CSS" guideline. Confirming we will use Tailwind as requested.

> [!WARNING]
> **Firebase Credentials**: You must create a Firebase project and fill in `.env.local` with real credentials before the app will work. The plan generates an `.env.local.example` template only.

> [!IMPORTANT]
> **Admin Auth Flow**: The prompt describes a bcrypt-based client-side password check against an env hash, then Firebase Auth with a mapped email. This is functional but note: the `ADMIN_PASSWORD_HASH` env var must be a bcrypt hash of `p3mp3Kd0m!n0`. We'll use `bcryptjs` (pure JS, no native bindings) for browser/Node compatibility.

> [!IMPORTANT]
> **next-pwa**: The `next-pwa` package is no longer actively maintained for Next.js 14 App Router. We'll use `@ducanh2912/next-pwa` (active fork, same API) which has full App Router support. If you prefer the original `next-pwa`, let me know.

---

## Proposed Changes

Implementation is organized into **7 phases**, each building on the previous. Files are listed per phase.

---

### Phase 1: Project Foundation

Initialize the Next.js 14 project, install all dependencies, and configure the base setup.

#### [NEW] [package.json](file:///d:/pempek-domino-v2/package.json)
- Next.js 14, React 18, TypeScript
- Dependencies: `firebase`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `date-fns`, `lucide-react`, `bcryptjs`, `@ducanh2912/next-pwa`
- DevDependencies: `tailwindcss`, `postcss`, `autoprefixer`, `@types/bcryptjs`, `@types/node`, `@types/react`

#### [NEW] [tsconfig.json](file:///d:/pempek-domino-v2/tsconfig.json)
- Strict mode enabled, path aliases `@/*` → `./`

#### [NEW] [tailwind.config.ts](file:///d:/pempek-domino-v2/tailwind.config.ts)
- Extend colors with brand tokens: `primary` (#8B1E1E), `secondary` (#D9A441), `accent` (#E67E22), `cream` (#FFF8F0), `brown` (#3A2A20)
- Extend fontFamily: `display` → Playfair Display, `sans` → Plus Jakarta Sans
- Extend borderRadius: `card` (16px), `input` (12px), `badge` (8px)
- Extend boxShadow: `card` → `0 2px 12px rgba(58,42,32,0.08)`

#### [NEW] [postcss.config.js](file:///d:/pempek-domino-v2/postcss.config.js)

#### [NEW] [app/globals.css](file:///d:/pempek-domino-v2/app/globals.css)
- Tailwind directives, CSS custom properties for brand colors, Google Fonts import

#### [NEW] [next.config.js](file:///d:/pempek-domino-v2/next.config.js)
- PWA configuration with `@ducanh2912/next-pwa`
- Runtime caching for Firestore product data

#### [NEW] [public/manifest.json](file:///d:/pempek-domino-v2/public/manifest.json)
- PWA manifest with app name, theme color (#8B1E1E), background (#FFF8F0), icons

#### [NEW] [.env.local.example](file:///d:/pempek-domino-v2/.env.local.example)
- Template with all Firebase + Admin env keys (empty values)

---

### Phase 2: Core Library & Types

#### [NEW] [types/index.ts](file:///d:/pempek-domino-v2/types/index.ts)
- Interfaces: `Product`, `Order`, `OrderItem`, `Customer`, `PaymentConfig`, `BusinessSettings`
- Type unions: `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `DeliveryMethod`, `ProductCategory`

#### [NEW] [lib/firebase.ts](file:///d:/pempek-domino-v2/lib/firebase.ts)
- Initialize Firebase app (singleton)
- Export `db` (Firestore), `auth` (Auth), `storage` (Storage)

#### [NEW] [lib/firestore.ts](file:///d:/pempek-domino-v2/lib/firestore.ts)
- Typed CRUD helpers for each collection:
  - `getProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`
  - `createOrder()`, `getOrder()`, `updateOrderStatus()`, `getOrdersByDate()`, `generateOrderNumber()`
  - `upsertCustomer()`, `getCustomers()`
  - `getPaymentConfig()`, `updatePaymentConfig()`
  - `getBusinessSettings()`, `updateBusinessSettings()`
- Real-time listeners: `subscribeToOrders()`, `subscribeToProducts()`
- Seed data function: `seedProducts()`

#### [NEW] [lib/auth.ts](file:///d:/pempek-domino-v2/lib/auth.ts)
- `loginAdmin(username, password)` — validate username, bcrypt verify password against env hash, then `signInWithEmailAndPassword` with mapped email
- `logoutAdmin()` — Firebase sign out
- `onAuthStateChanged` helper

#### [NEW] [lib/utils.ts](file:///d:/pempek-domino-v2/lib/utils.ts)
- `formatRupiah(n)` → `Rp 5.000`
- `formatWhatsApp(n)` → `0817-7640-0024`
- `normalizePhone(input)` → `628xxx` format
- `cn(...classes)` — Tailwind class merge utility
- `generateWhatsAppLink(phone, message)` → `wa.me/...` URL

#### [NEW] [store/orderStore.ts](file:///d:/pempek-domino-v2/store/orderStore.ts)
- Cart management: `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- Customer info state, delivery method, payment method
- Computed: `subtotal`, `deliveryFee`, `total`

#### [NEW] [store/authStore.ts](file:///d:/pempek-domino-v2/store/authStore.ts)
- `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `initAuth()`

#### [NEW] [store/adminStore.ts](file:///d:/pempek-domino-v2/store/adminStore.ts)
- Orders list, filters, search, selected order
- Products list for menu management
- Dashboard KPI data

#### [NEW] [hooks/useProducts.ts](file:///d:/pempek-domino-v2/hooks/useProducts.ts)
- Real-time Firestore subscription to active products, return grouped by category

#### [NEW] [hooks/useOrders.ts](file:///d:/pempek-domino-v2/hooks/useOrders.ts)
- Real-time Firestore subscription with filters (status, date, search)

#### [NEW] [hooks/useAuth.ts](file:///d:/pempek-domino-v2/hooks/useAuth.ts)
- Firebase `onAuthStateChanged` listener, populate auth store

---

### Phase 3: UI Components

#### [NEW] [components/ui/Button.tsx](file:///d:/pempek-domino-v2/components/ui/Button.tsx)
- Variants: primary, secondary, outline, ghost, danger
- Sizes: sm, md, lg
- Loading state with spinner

#### [NEW] [components/ui/Input.tsx](file:///d:/pempek-domino-v2/components/ui/Input.tsx)
- Text, number, textarea variants
- Label, error message, helper text integration
- React Hook Form compatible via `forwardRef`

#### [NEW] [components/ui/Card.tsx](file:///d:/pempek-domino-v2/components/ui/Card.tsx)
- Standard card container with brand shadow and border radius

#### [NEW] [components/ui/Badge.tsx](file:///d:/pempek-domino-v2/components/ui/Badge.tsx)
- Status badges: pending (orange), ready (blue), completed (green), delivered (green)
- Payment badges: unpaid (red), paid (green)

#### [NEW] [components/ui/Modal.tsx](file:///d:/pempek-domino-v2/components/ui/Modal.tsx)
- Overlay modal with animation, close on backdrop click, portal-based

#### [NEW] [components/ui/Skeleton.tsx](file:///d:/pempek-domino-v2/components/ui/Skeleton.tsx)
- Skeleton loader primitives (rect, circle, text lines)

#### [NEW] [components/ui/Toast.tsx](file:///d:/pempek-domino-v2/components/ui/Toast.tsx)
- Toast notification system (success, error, info)
- Context provider + `useToast()` hook

#### [NEW] [components/ui/RadioCard.tsx](file:///d:/pempek-domino-v2/components/ui/RadioCard.tsx)
- Selectable card with radio behavior (for delivery method, payment method)

#### [NEW] [components/ui/Tabs.tsx](file:///d:/pempek-domino-v2/components/ui/Tabs.tsx)
- Tab bar for order status filtering

#### [NEW] [components/ui/DatePicker.tsx](file:///d:/pempek-domino-v2/components/ui/DatePicker.tsx)
- Date and time picker (native HTML inputs styled with brand)

#### [NEW] [components/ui/SearchInput.tsx](file:///d:/pempek-domino-v2/components/ui/SearchInput.tsx)
- Search input with debounce and clear button

#### [NEW] [components/ui/EmptyState.tsx](file:///d:/pempek-domino-v2/components/ui/EmptyState.tsx)
- Empty state illustration + message

#### [NEW] [components/ui/StatusStepper.tsx](file:///d:/pempek-domino-v2/components/ui/StatusStepper.tsx)
- Horizontal step indicator for order status progression

#### [NEW] [components/order/ProductCard.tsx](file:///d:/pempek-domino-v2/components/order/ProductCard.tsx)
- Product card with image, name, price, quantity controls (−/+)

#### [NEW] [components/order/OrderSummarySheet.tsx](file:///d:/pempek-domino-v2/components/order/OrderSummarySheet.tsx)
- Sticky bottom sheet: subtotal, delivery fee, grand total, CTA button

#### [NEW] [components/order/PaymentPreview.tsx](file:///d:/pempek-domino-v2/components/order/PaymentPreview.tsx)
- Payment method details (QRIS image, Dana number, bank details)

#### [NEW] [components/admin/Sidebar.tsx](file:///d:/pempek-domino-v2/components/admin/Sidebar.tsx)
- Navigation sidebar for admin panel (responsive: bottom nav on mobile, sidebar on desktop)

#### [NEW] [components/admin/KPICard.tsx](file:///d:/pempek-domino-v2/components/admin/KPICard.tsx)
- Dashboard KPI card with icon, label, value, trend

#### [NEW] [components/admin/OrderCard.tsx](file:///d:/pempek-domino-v2/components/admin/OrderCard.tsx)
- Order list item card with status, customer, total, time

#### [NEW] [components/admin/OrderFormModal.tsx](file:///d:/pempek-domino-v2/components/admin/OrderFormModal.tsx)
- Admin order creation modal (same form logic as customer, with admin extras)

#### [NEW] [components/admin/CustomerCard.tsx](file:///d:/pempek-domino-v2/components/admin/CustomerCard.tsx)
- Customer list card with name, WA, total orders, spending

#### [NEW] [components/admin/MenuItemCard.tsx](file:///d:/pempek-domino-v2/components/admin/MenuItemCard.tsx)
- Menu item card with toggle active, edit/delete actions

#### [NEW] [components/admin/ImageUpload.tsx](file:///d:/pempek-domino-v2/components/admin/ImageUpload.tsx)
- Firebase Storage image upload component with preview and progress

#### [NEW] [components/charts/RevenueLineChart.tsx](file:///d:/pempek-domino-v2/components/charts/RevenueLineChart.tsx)
- 7-day revenue trend line chart (Recharts, color #D9A441)

#### [NEW] [components/charts/DailyBarChart.tsx](file:///d:/pempek-domino-v2/components/charts/DailyBarChart.tsx)
- Daily revenue bar chart for recap page

#### [NEW] [components/charts/TopProductsChart.tsx](file:///d:/pempek-domino-v2/components/charts/TopProductsChart.tsx)
- Horizontal bar chart for top products

---

### Phase 4: Public Pages

#### [NEW] [app/layout.tsx](file:///d:/pempek-domino-v2/app/layout.tsx)
- Root layout: `<html lang="id">`, Google Fonts loading, PWA metadata
- Toast provider wrapper
- Viewport meta for mobile-first (390px)

#### [NEW] [app/page.tsx](file:///d:/pempek-domino-v2/app/page.tsx)
- Redirect to `/order` using `redirect()`

#### [NEW] [app/order/page.tsx](file:///d:/pempek-domino-v2/app/order/page.tsx)
- Full customer order form with 4 sections:
  1. Data Pemesan (name, WA, notes) — React Hook Form + Zod
  2. Pilihan Pengiriman (radio card: pickup vs delivery)
  3. Metode Pembayaran (radio card: QRIS / Dana / Transfer)
  4. Pilih Menu (product cards grouped by category with qty selectors)
- Sticky bottom sheet with totals + "Pesan Sekarang" CTA
- On submit: generate order number, save to Firestore, upsert customer, redirect

#### [NEW] [app/confirmation/[orderId]/page.tsx](file:///d:/pempek-domino-v2/app/confirmation/[orderId]/page.tsx)
- Fetch order by ID from Firestore
- Display: order number, items, price breakdown, payment instructions
- "Bagikan ke WhatsApp" button with pre-filled message
- "Buat Pesanan Baru" link back to `/order`

---

### Phase 5: Admin Pages

#### [NEW] [app/admin/login/page.tsx](file:///d:/pempek-domino-v2/app/admin/login/page.tsx)
- Login form: username + password fields
- Validate against env, authenticate with Firebase Auth

#### [NEW] [app/admin/layout.tsx](file:///d:/pempek-domino-v2/app/admin/layout.tsx)
- Auth guard: check Firebase auth state, redirect to login if unauthenticated
- Admin layout with sidebar/bottom nav + main content area

#### [NEW] [app/admin/dashboard/page.tsx](file:///d:/pempek-domino-v2/app/admin/dashboard/page.tsx)
- 4 KPI cards (real-time)
- Last 5 orders preview
- 7-day revenue line chart
- Best seller products today (top 5)
- Quick action buttons

#### [NEW] [app/admin/orders/page.tsx](file:///d:/pempek-domino-v2/app/admin/orders/page.tsx)
- Real-time order list with `onSnapshot`
- Search + filter tabs (Semua/Pending/Siap/Selesai/Dikirim)
- Order cards, FAB for new order

#### [NEW] [app/admin/orders/[orderId]/page.tsx](file:///d:/pempek-domino-v2/app/admin/orders/[orderId]/page.tsx)
- Full order detail with status stepper
- Status transition buttons
- Payment status toggle
- WhatsApp share button

#### [NEW] [app/admin/recap/page.tsx](file:///d:/pempek-domino-v2/app/admin/recap/page.tsx)
- Date range picker
- Summary cards (total orders, revenue, products sold)
- Product breakdown table (sortable)
- Daily bar chart + top products chart
- Export CSV button

#### [NEW] [app/admin/customers/page.tsx](file:///d:/pempek-domino-v2/app/admin/customers/page.tsx)
- Customer list with search
- Customer cards: name, WA, orders count, spending
- Click through to detail view (order history, favorites)

#### [NEW] [app/admin/menu/page.tsx](file:///d:/pempek-domino-v2/app/admin/menu/page.tsx)
- Product list grouped by category
- Toggle active/inactive
- Edit modal: name, price, category, image upload, description
- Add new product per category

#### [NEW] [app/admin/settings/page.tsx](file:///d:/pempek-domino-v2/app/admin/settings/page.tsx)
- Business info form (name, address, WhatsApp)
- Payment config CRUD (QRIS image upload, Dana number, bank details)
- Default delivery fee setting

---

### Phase 6: Data & Security

#### [NEW] [firestore.rules](file:///d:/pempek-domino-v2/firestore.rules)
- `products`: public read, auth write
- `orders`: public create, auth read/update/delete
- `customers`: auth only
- `paymentConfig`: public read, auth write
- `settings`: auth only

#### [NEW] [scripts/seed.ts](file:///d:/pempek-domino-v2/scripts/seed.ts)
- Seed script to populate `products` collection with 12 initial items
- One-time run with `npx tsx scripts/seed.ts`

---

### Phase 7: Polish & Deployment

#### [NEW] [vercel.json](file:///d:/pempek-domino-v2/vercel.json)
- Vercel deployment config for Next.js

#### [NEW] [README.md](file:///d:/pempek-domino-v2/README.md)
- Project overview, setup instructions, env var guide, deployment steps

#### [NEW] [public/icons/icon-192.png](file:///d:/pempek-domino-v2/public/icons/icon-192.png)
#### [NEW] [public/icons/icon-512.png](file:///d:/pempek-domino-v2/public/icons/icon-512.png)
- Generated PWA icons with brand colors

---

## Verification Plan

### Automated Tests

Since this is a greenfield project with no existing test infrastructure, we'll use the following verification approach:

1. **TypeScript compilation check**
   ```bash
   cd d:\pempek-domino-v2 && npx tsc --noEmit
   ```
   Ensures all types are correct and there are no compilation errors.

2. **Next.js build check**
   ```bash
   cd d:\pempek-domino-v2 && npm run build
   ```
   Verifies the entire application compiles and builds successfully.

3. **Lint check**
   ```bash
   cd d:\pempek-domino-v2 && npm run lint
   ```

### Browser Verification

After running the dev server (`npm run dev`), verify these flows using the browser tool:

1. **Customer Order Flow**
   - Navigate to `http://localhost:3000/order`
   - Verify the order form renders with all 4 sections
   - Verify product cards display with quantity controls
   - Verify the sticky bottom sheet shows totals
   - Verify form validation (empty name, invalid phone)

2. **Admin Login Flow**
   - Navigate to `http://localhost:3000/admin/login`
   - Verify login form renders
   - Verify redirect to `/admin/dashboard` after login (requires Firebase setup)

3. **Admin Dashboard**
   - Navigate to `http://localhost:3000/admin/dashboard`
   - Verify KPI cards, charts, and recent orders render

4. **Responsive Design**
   - Test at 390px viewport width — verify no horizontal scroll
   - Verify mobile bottom nav vs desktop sidebar

### Manual Verification (User)

> [!NOTE]
> These require a Firebase project with real credentials:

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore**, **Authentication** (Email/Password), and **Storage**
3. Create the admin user in Firebase Auth: email `suprimaaldino@gmail.com`, password `p3mp3Kd0m!n0`
4. Fill in `.env.local` with your Firebase credentials
5. Run `npx tsx scripts/seed.ts` to populate products
6. Test the full order flow: place an order → view confirmation → check WhatsApp link
7. Test admin login → dashboard → order management → settings
8. Deploy to Vercel and verify PWA install prompt on mobile
