# 📋 ENHANCEMENT PLAN — Pempek Domino v2

> Generated from full UI/UX + Visual Cosmetics audit
> Date: 2026-08-27
> Status: PLAN ONLY — belum dieksekusi

---

## 📌 Table of Contents

1. [Phase 1: Critical Bugs & Broken UX](#phase-1)
2. [Phase 2: Brand Color Harmonization](#phase-2)
3. [Phase 3: Error Handling & Feedback](#phase-3)
4. [Phase 4: Accessibility](#phase-4)
5. [Phase 5: Dead Code Cleanup](#phase-5)
6. [Phase 6: Visual Consistency](#phase-6)
7. [Phase 7: Performance](#phase-7)
8. [Phase 8: Code Refactoring](#phase-8)

---

## <a id="phase-1"></a>Phase 1: Critical Bugs & Broken UX

Priority: **URGENT** — Fix before anything else.

### 1.1 Dead Button — Admin Orders "Pesanan Baru"

**File**: `app/admin/orders/page.tsx:57`

```tsx
// ❌ Current — no onClick or href
<Button>
  <Plus size={18} />
  <span className="hidden sm:inline">Pesanan Baru</span>
</Button>
```

**Fix**: Wire up to `OrderFormModal` or link to `/order`:

```tsx
// ✅ Option A: Open OrderFormModal
const [showOrderForm, setShowOrderForm] = useState(false);
<Button onClick={() => setShowOrderForm(true)}>
  <Plus size={18} />
  <span className="hidden sm:inline">Pesanan Baru</span>
</Button>
<OrderFormModal isOpen={showOrderForm} onClose={() => setShowOrderForm(false)} />

// ✅ Option B: Link to customer order page
<Link href="/order" target="_blank">
  <Button>
    <Plus size={18} />
    <span className="hidden sm:inline">Pesanan Baru</span>
  </Button>
</Link>
```

---

### 1.2 Broken Pluralization — OrderSummarySheet

**File**: `components/order/OrderSummarySheet.tsx:37`

```tsx
// ❌ Current — both branches render empty string (dead ternary)
{itemCount} item{itemCount > 1 ? '' : ''}
```

**Fix**: Remove the dead ternary for clarity (Indonesian doesn't pluralize with "s"):

```tsx
// ✅ Cleaner
{itemCount} item
```

---

### 1.3 Invisible KPICard — Missing `accent` Color

**File**: `app/admin/recap/page.tsx:170`

```tsx
// ❌ Current — accent not defined in tailwind.config.ts
colorClass="bg-accent/10 text-accent"
```

**Fix** — Replace with a valid color:

```tsx
// ✅ Fixed
colorClass="bg-indigo-100 text-indigo-600"
```

---

### 1.4 Wrong WhatsApp Link — Admin Order Detail

**File**: `app/admin/orders/[orderId]/page.tsx:250`

```tsx
// ❌ Current — opens phone dialer, not WhatsApp
href={`tel:${order.whatsappNumber}`}
```

**Fix**:

```tsx
// ✅ Fixed — WhatsApp deep link
href={`https://wa.me/${order.whatsappNumber.replace(/^0/, '62')}`}
target="_blank"
rel="noopener noreferrer"
```

---

## <a id="phase-2"></a>Phase 2: Brand Color Harmonization

Priority: **HIGH** — Visual brand consistency.

### 2.1 Fix `themeColor` Mismatch

**Files**:
- `app/layout.tsx:34` — change `#8B1E1E` → `#D42B2B`
- `public/manifest.json:9` — change `theme_color` to `#D42B2B`
- `public/manifest.json:8` — change `background_color` to `#F7F7F7`

### 2.2 Unify Chart Colors to Theme Palette

**Files**:
- `components/charts/RevenueLineChart.tsx:51` — change `#D9A441` → brand color
- `components/charts/DailyBarChart.tsx:46` — change `#8B1E1E` → brand primary
- `components/charts/TopProductsChart.tsx:19` — replace hardcoded array with theme-derived palette

**Recommended chart palette** (from brand shades):

```ts
const CHART_COLORS = [
  '#D42B2B', // primary-500
  '#F45050', // primary-400
  '#B82222', // primary-600
  '#F88080', // primary-300
  '#971A1A', // primary-700
];
```

### 2.3 Fix Toast Colors

**File**: `components/order/PaymentPreview.tsx:31`

```tsx
// ❌ Current
type === 'success' ? 'bg-green-500' : 'bg-red-500'

// ✅ Fixed — use theme semantic tokens
type === 'success' ? 'bg-success' : 'bg-error'
```

### 2.4 Remove Unused CSS Variable

**File**: `app/globals.css:8`

```css
/* ❌ Remove — unused, Tailwind handles primary via config */
:root { --primary: #D42B2B; }
```

---

## <a id="phase-3"></a>Phase 3: Error Handling & Feedback

Priority: **HIGH** — Silent failures are bad UX.

### 3.1 Dashboard — Add Error State

**File**: `app/admin/dashboard/page.tsx:134`

```tsx
// ❌ Current
catch (err) {
  console.error('Error fetching dashboard data:', err);
}

// ✅ Fixed
const [error, setError] = useState<string | null>(null);
// ...
catch (err) {
  console.error('Error fetching dashboard data:', err);
  setError('Gagal memuat data dashboard. Silakan coba lagi.');
}

// In JSX, add error UI:
{error && (
  <div className="bg-success/10 text-error rounded-card p-4 text-center">
    <p className="font-semibold">{error}</p>
    <Button variant="outline" size="sm" className="mt-2" onClick={fetchDashboardData}>
      Coba Lagi
    </Button>
  </div>
)}
```

### 3.2 Apply Same Pattern to Other Pages

Files that need error state:
- `app/admin/recap/page.tsx:42`
- `app/admin/customers/page.tsx:22`
- `app/admin/settings/page.tsx:60`

### 3.3 Order Page — Show Toast on Config Failure

**File**: `app/order/page.tsx:116`

```tsx
// ❌ Current
.catch(() => {})

// ✅ Fixed
.catch(() => {
  toastError('Gagal memuat konfigurasi pembayaran. Beberapa fitur mungkin terbatas.');
})
```

### 3.4 Clipboard — Check API Availability

**File**: `app/confirmation/[orderId]/page.tsx:36`

```tsx
// ❌ Current
navigator.clipboard.writeText(text)

// ✅ Fixed
if (navigator.clipboard) {
  await navigator.clipboard.writeText(text);
} else {
  // Fallback: textarea + execCommand
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
```

---

## <a id="phase-4"></a>Phase 4: Accessibility

Priority: **MEDIUM** — Legal & UX compliance.

### 4.1 Modal — Add Focus Trap + Escape Key

**File**: `components/ui/Modal.tsx`

Add after `useEffect` for body scroll lock:

```tsx
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);

// Also add ref + focus trap (useRef + useEffect to focus first focusable element)
```

### 4.2 BottomNav — Add ARIA Attributes

**File**: `components/BottomNav.tsx:37`

```tsx
// ❌ Current
<Link key={href} href={href} className="flex flex-col items-center gap-1 py-1 px-4 relative">

// ✅ Fixed
<Link
  key={href}
  href={href}
  aria-label={label}
  aria-current={isActive ? 'page' : undefined}
  className="flex flex-col items-center gap-1 py-1 px-4 relative"
>
```

### 4.3 Login Form — Fix autoComplete

**File**: `app/admin/login/page.tsx:89`

```tsx
// ❌ Current
autoComplete="new-password"

// ✅ Fixed
autoComplete="current-password"
```

---

## <a id="phase-5"></a>Phase 5: Dead Code Cleanup

Priority: **MEDIUM** — Reduce bundle size and confusion.

### Files to DELETE:

| File | Reason |
|------|--------|
| `components/order/CustomerSidebar.tsx` | Never imported anywhere |
| `components/order/CustomerNavbar.tsx` | Never imported anywhere (duplicates BottomNav) |
| `hooks/useAuth.ts` | Never imported (admin layout uses useAuthStore directly) |
| `hooks/useUtils.ts` | `useLocalStorage` never imported |
| `app/admin/page.tsx` | Just `redirect('/admin/dashboard')` — redundant, layout handles this |

### Files to CLEAN UP:

| File | Change |
|------|--------|
| `app/admin/dashboard/page.tsx` | Remove local `OrderSchema` + `parseOrder` (use from `lib/firestore.ts`) |
| `app/admin/menu/page.tsx:27` | Replace local `CATEGORIES` with `PRODUCT_CATEGORIES` from `types/index.ts` |
| `components/ui/SearchInput.tsx` | Replace `brown/*` tokens with `neutral-*` tokens |

---

## <a id="phase-6"></a>Phase 6: Visual Consistency

Priority: **MEDIUM** — Professional polish.

### 6.1 Migrate `brown/*` → `neutral-*`

Complete the color token migration across all files. Replace pattern:

| Old Token | New Token |
|-----------|-----------|
| `text-brown` | `text-neutral-900` |
| `text-brown/50` | `text-neutral-500` |
| `text-brown/60` | `text-neutral-600` |
| `text-brown/40` | `text-neutral-400` |
| `border-brown/10` | `border-neutral-200` |
| `border-brown/5` | `border-neutral-100` |
| `bg-brown/5` | `bg-neutral-50` |
| `bg-cream` | `bg-neutral-50` |

**Files affected**: ~20 files across admin components.

### 6.2 Unify Bottom Nav Styles

Make customer `BottomNav` match admin mobile nav treatment:

```tsx
// Add shadow to customer BottomNav
className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 shadow-card safe-area-pb"
```

Or alternatively, make admin mobile nav match customer (remove shadow). Pick one direction.

### 6.3 Use `rounded-card` Consistently

Replace all `rounded-2xl` with `rounded-card` (same 16px value):
- `components/order/OrderSummarySheet.tsx:21`
- `app/admin/login/page.tsx:59`

### 6.4 Confirmation Page — Use Gradient Header

**File**: `app/confirmation/[orderId]/page.tsx:96`

```tsx
// ❌ Current
className="bg-primary px-4 pt-safe-top pb-10 text-white text-center"

// ✅ Fixed
className="bg-gradient-brand px-4 pt-safe-top pb-10 text-white text-center"
```

### 6.5 Standardize Empty States

Use `EmptyState` component everywhere:
- `app/admin/dashboard/page.tsx:235` — replace plain `<p>` with `EmptyState`
- `app/confirmation/[orderId]/page.tsx:81` — replace inline with `EmptyState`
- `app/admin/orders/[orderId]/page.tsx:121` — replace `return null` with `EmptyState`

### 6.6 Remove `<b>` Tag

**File**: `app/confirmation/[orderId]/page.tsx:261`

```tsx
// ❌ Current
<b>No. Pesanan</b>

// ✅ Fixed
<span className="font-bold">No. Pesanan</span>
```

---

## <a id="phase-7"></a>Phase 7: Performance

Priority: **MEDIUM** — User experience improvement.

### 7.1 Dashboard — Single Firestore Query for Chart

**File**: `app/admin/dashboard/page.tsx:95-110`

```tsx
// ❌ Current — 7 sequential queries in a for loop
for (let i = 6; i >= 0; i--) {
  const qDay = query(ordersRef, ...);
  const snapDay = await getDocs(qDay);
  // ...
}

// ✅ Fixed — 1 query + client-side grouping
const sevenDaysAgo = startOfDay(subDays(today, 6));
const qWeek = query(ordersRef, where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)));
const snapWeek = await getDocs(qWeek);

const dayMap = new Map<string, number>();
// Initialize all 7 days with 0
for (let i = 6; i >= 0; i--) {
  dayMap.set(format(subDays(today, i), 'dd/MM'), 0);
}
// Aggregate
snapWeek.forEach(doc => {
  const data = doc.data();
  const day = format(data.createdAt.toDate(), 'dd/MM');
  dayMap.set(day, (dayMap.get(day) || 0) + (data.total || 0));
});
const points = Array.from(dayMap.entries()).map(([date, revenue]) => ({ date, revenue }));
```

### 7.2 Recap — Add Debounce

**File**: `app/admin/recap/page.tsx:29`

Add debounce to date inputs to prevent rapid-fire fetches:

```tsx
// Use a 300ms debounce before fetching
useEffect(() => {
  const timer = setTimeout(() => {
    fetchRecap();
  }, 300);
  return () => clearTimeout(timer);
}, [dateFrom, dateTo]);
```

### 7.3 Orders List — Memoize Counts

**File**: `app/admin/orders/page.tsx:36`

```tsx
// ❌ Current — recalculated every render
const counts = { all: orders.length, pending: orders.filter(...).length, ... };

// ✅ Fixed
const counts = useMemo(() => ({
  all: orders.length,
  pending: orders.filter(o => o.status === 'pending').length,
  ready: orders.filter(o => o.status === 'ready').length,
  delivered: orders.filter(o => o.status === 'delivered').length,
  completed: orders.filter(o => o.status === 'completed').length,
}), [orders]);
```

---

## <a id="phase-8"></a>Phase 8: Code Refactoring

Priority: **LOW** — Code quality improvement.

### 8.1 Extract Shared Components

| Extract From | Component Name | To |
|-------------|---------------|-----|
| `components/charts/RevenueLineChart.tsx` + `DailyBarChart.tsx` | `ChartTooltip` | `components/charts/ChartTooltip.tsx` |
| `components/charts/*.tsx` (3 files) | axis config constant | `components/charts/chartConfig.ts` |
| `app/admin/orders/[orderId]/page.tsx` + `app/confirmation/[orderId]/page.tsx` | `OrderTotalSummary` | `components/order/OrderTotalSummary.tsx` |
| `app/my-orders/page.tsx:28-179` | `OrderDetailCard` | `components/order/OrderDetailCard.tsx` |
| `app/admin/payments/page.tsx:274-380` | `PaymentMethodCard` | `components/admin/PaymentMethodCard.tsx` |
| `app/admin/recap/page.tsx:198-250` | `DataTable` | `components/ui/DataTable.tsx` |
| `components/order/PaymentPreview.tsx` | Split into `QRISPreview`, `EWalletPreview`, `BankPreview` | `components/order/` |

### 8.2 Deduplicate Code

| Dedup | Location |
|-------|----------|
| `handleLogout` in `Sidebar.tsx:47` ↔ `MobileMoreSheet.tsx:50` | Extract to `lib/auth.ts` as `handleLogout()` |
| Local `Toast` in `PaymentPreview.tsx:22` ↔ global `Toast` in `ui/Toast.tsx` | Delete local Toast, use global |
| `OrderSchema` in `dashboard/page.tsx:26` ↔ `lib/firestore.ts` | Import from shared location |

### 8.3 Order Page — Extract Sections

**File**: `app/order/page.tsx` (460 lines)

Split into sub-components:
- `components/order/CustomerInfoSection.tsx`
- `components/order/MenuSection.tsx`
- `components/order/DeliverySection.tsx`
- `components/order/PaymentSection.tsx`

---

## 📊 Summary

| Phase | Scope | Files Affected | Est. Effort |
|-------|-------|---------------|-------------|
| Phase 1 | Critical Bugs | 4 | 30 min |
| Phase 2 | Brand Colors | 7 | 1 hour |
| Phase 3 | Error Handling | 8 | 1.5 hours |
| Phase 4 | Accessibility | 3 | 45 min |
| Phase 5 | Dead Code | 7 files | 15 min |
| Phase 6 | Visual Consistency | ~25 | 2 hours |
| Phase 7 | Performance | 3 | 1 hour |
| Phase 8 | Refactoring | ~15 | 3 hours |
| **TOTAL** | | **~50+ files** | **~10 hours** |

---

## 🎯 Recommended Execution Order

1. **Phase 1** — Fix bugs first (button mati, broken color, wrong link)
2. **Phase 5** — Delete dead code (quick win, reduces confusion)
3. **Phase 2** — Fix brand colors (high visual impact)
4. **Phase 3** — Add error handling (UX improvement)
5. **Phase 6** — Visual consistency (polish)
6. **Phase 4** — Accessibility (compliance)
7. **Phase 7** — Performance (optimization)
8. **Phase 8** — Refactoring (code quality, lowest priority)
