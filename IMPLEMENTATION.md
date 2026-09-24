# IMPLEMENTATION.md — Pempek Domino v2

Implementation plan hasil audit komprehensif (security, auth, testing, a11y, UX).
Setiap task: Goal → Files → Steps → Tests → Acceptance Criteria.
Jalankan phase berurutan. Jangan skip verifikasi tiap phase.

---

## Phase 1 — Critical Security

### 1.1 Protect `POST /api/upload`

**Goal:** Tolak upload tanpa sesi admin valid.

**Affected files:**
- `app/api/upload/route.ts`
- `__tests__/security/upload.test.ts` (baru)

**Steps:**
1. Import `verifyAdminToken` dari `@/lib/server-auth`.
2. Baca cookie `firebaseAuthToken` via `req.cookies.get(...)`.
3. Jika tidak ada atau `verifyAdminToken(token) === false` → `401 { error: 'Unauthorized' }`.
4. Pertahankan validasi path/type/size yang sudah ada.

**Tests:**
- POST tanpa cookie → 401.
- POST dengan cookie tidak valid → 401.
- (Manual) POST dengan cookie admin valid → 200.

**Acceptance:**
- [x] Unauthenticated upload selalu 401.
- [x] Path allowlist tetap berlaku.

---

### 1.2 Firestore rules: `isAdmin()`

**Goal:** Pelanggan Google login tidak punya hak admin.

**Affected files:**
- `firestore.rules`
- `__tests__/security/firestore.rules.test.ts` (rewrite)

**Steps:**
1. Tambah helper:
   ```
   function isAdmin() {
     return request.auth != null &&
            request.auth.token.email == adminEmail; // via custom access or env-injected — use string constant
   }
   ```
   Karena rules tidak bisa baca env, hardcode email admin via variable atau gunakan custom claim `admin == true`. **Rekomendasi:** set custom claim `admin: true` untuk akun admin, atau hardcode email admin di rules.
2. Terapkan:
   - `products`: create/update/delete → `isAdmin()`; read tetap publik.
   - `orders`: create tetap validasi data (guest boleh); get/list → `isAdmin() || (request.auth != null && request.auth.uid == resource.data.userId)`; update status/payment → `isAdmin()`; delete → `isAdmin()`.
   - `customers`: read/list/delete → `isAdmin()`; create → validasi phone (guest OK); update → `isAdmin()` atau phone sendiri.
   - `paymentConfig`, `settings`: write → `isAdmin()`; read tetap publik.
   - `orderLookups`: get → publik (guest); update/delete/list → `isAdmin()`.
   - `counters`: create/update tetap harden untuk guest checkout (increment by 1).
3. Deploy: `npx firebase deploy --only firestore:rules`.

**Tests:**
- Emulator: non-admin update product → denied.
- Emulator: non-admin update order status → denied.
- Emulator: admin update product → allowed.

**Acceptance:**
- [x] Customer session tidak bisa mutate products/orders/settings. *(rules ditulis + structural test; deploy manual: `npx firebase deploy --only firestore:rules`)*

---

### 1.3 Server-authoritative order creation

**Goal:** Harga/total dihitung server, bukan dipercaya dari client.

**Affected files:**
- `app/api/order/route.ts` (baru — POST)
- `app/order/page.tsx`
- `firestore.rules` (create order tetap di rules untuk guest flow existing)

**Steps:**
1. Buat `POST /api/order`:
   - Body: `{ customerName, whatsappNumber, items: [{productId, quantity}], deliveryMethod, pickupDateTime?, deliveryAddress?, deliveryFee, paymentMethod, notes?, paymentProofUrl?, userId? }`.
   - Load produk dari Firestore (Admin SDK) berdasarkan `productId`.
   - Hitung ulang `price`, `subtotal`, `total` server-side.
   - Validasi quantity (1–1000), deliveryFee (0–1_000_000).
   - Generate order number (pola `PD-YYYYMMDD-NNN-XXXX`).
   - Tulis `orders` + `orderLookups` + `counters` via Admin SDK.
   - Return `{ orderId, orderNumber }`.
2. Di `app/order/page.tsx` `onSubmit`: ganti `createOrder(...)` client call dengan `fetch('/api/order', { method: 'POST', body })`.
3. Pertahankan sanitasi input client (UX) tapi angka uang diambil dari response server.

**Tests:**
- POST dengan price tampered → server pakai harga katalog.
- POST quantity 0 → 400.
- POST total mismatch → server hitung ulang.

**Acceptance:**
- [x] Stored total selalu = sum(katalog price × qty) + validated fee.

---

### 1.4 Confirmation page → public order API

**Goal:** Guest bisa lihat konfirmasi pesanan.

**Affected files:**
- `app/confirmation/[orderId]/page.tsx`

**Steps:**
1. Ganti `getOrder(orderId)` (client Firestore) dengan `fetch(\`/api/order/${orderNumber}\`)`.
2. Problem: confirmation route param adalah `orderId` (Firestore doc id), bukan `orderNumber`.  
   **Solusi:** setelah create order via API, simpan `orderNumber` di localStorage (sudah ada `pempek-domino-orders`). Atau: redirect ke `/confirmation/[orderNumber]` dan resolve via `GET /api/order/[orderNumber]`.
3. Rekomendasi: ubah param menjadi `orderNumber` dan fetch dari API. Update `app/order/page.tsx` redirect ke `router.push(\`/confirmation/${orderNumber}\`)`.

**Tests:**
- Guest order → confirmation menampilkan data.

**Acceptance:**
- [x] Guest confirmation load tanpa auth.

---

## Phase 2 — Auth & Session

### 2.1 Admin session: cookie TTL alignment

**Goal:** Cookie tidak hidup lebih lama dari ID token tanpa refresh.

**Affected files:**
- `app/api/admin/login/route.ts`
- `lib/server-auth.ts`

**Steps:**
1. Set cookie `maxAge` = 3600 (1h) selaras dengan ID token default, ATAU
2. Implement refresh: saat `verifyAdminToken` sukses tapi token hampir expired, minta token baru via Admin SDK dan set cookie baru.
3. **Rekomendasi minimal:** turunkan maxAge ke 1 jam; user re-login setelah jam kerja. Atau pertahankan 24h dan refresh token tiap verify.

**Acceptance:**
- [x] Tidak ada cookie valid berisi token expired yang diterima middleware.

---

### 2.2 Admin login: single credential path

**Goal:** Hapus dual password (bcrypt + Firebase) yang rapuh.

**Affected files:**
- `app/api/admin/login/route.ts`
- `lib/auth.ts`

**Steps (pilihan A — Firebase-only, disarankan):**
1. Login route cukup `signInWithEmailAndPassword` dengan `ADMIN_EMAIL` + password dari body (validasi rate limit tetap).
2. Set cookie ID token.
3. Buang check bcrypt / `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (atau pertimbangkan fallback).
4. Client `loginAdmin` cukup panggil API; tidak perlu `signInWithEmailAndPassword` kedua (server sudah handle).

**Pilihan B (pertahankan bcrypt):** buang `signInWithEmailAndPassword` di client; cukup cookie.

**Acceptance:**
- [x] Satu jalur kredensial; logout bersih.

---

### 2.3 Refresh user profile on Google login

**Goal:** `users/{uid}` sinkron dengan Google profile terbaru.

**Affected files:**
- `lib/firestore.ts` (`getOrCreateUser`)

**Steps:**
1. Saat existing doc ada, update `email`/`name` dari input jika berbeda (merge).

**Acceptance:**
- [x] Rename Google → profile app ikut update setelah login.

---

## Phase 3 — API hardening

### 3.1 Shared rate-limit helper

**Goal:** Rate limit konsisten, siap pindah ke KV.

**Files:** `lib/rate-limit.ts` (baru), login/lookup/cancel routes.

**Steps:**
1. Ekstrak logic Map ke helper `checkRateLimit(key, max, windowMs)`.
2. Gunakan di login (5/15m), lookup (10/60s), cancel (5/60s).

**Acceptance:**
- [x] Duplikasi kode rate-limit hilang.

---

### 3.2 Generic 500 messages

**Files:** `app/api/order/[orderNumber]/cancel/route.ts`

**Steps:**
1. Jangan return `error.message` mentah; return pesan generik, log detail.

---

## Phase 4 — Testing & CI

### 4.1 Rewrite security tests

**Files:**
- `__tests__/security/auth.test.ts` — ganti tautologi dengan import & invoke middleware/login handler langsung (mock fetch).
- `__tests__/security/firestore.rules.test.ts` — minimal refactor ke komentar + skip, atau hapus klaim palsu; notes bahwa rules diuji via emulator.
- `__tests__/security/upload.test.ts` — baru (401).

### 4.2 CI workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test:ci
      - run: npm run build
```

**Acceptance:**
- [x] CI hijau. *(workflow di `.github/workflows/ci.yml`; verifikasi lokal lint/tsc/test/build hijau)*

---

## Phase 5 — A11y & Responsive

### 5.1 Password toggle tabIndex

**File:** `app/admin/login/page.tsx`  
Hapus `tabIndex={-1}` pada tombol eye; tambah `aria-label`.

### 5.2 Viewport zoom

**File:** `app/layout.tsx`  
Hapus `maximumScale: 1`.

### 5.3 Aria-live error di Input

**File:** `components/ui/Input.tsx`  
Error `<p>` → `role="alert"`.

### 5.4 prefers-reduced-motion

**File:** `app/globals.css`  
Bungkus animation dengan `@media (prefers-reduced-motion: reduce)`.

### 5.5 Ganti alert/confirm

**Files:** `app/my-orders/page.tsx`, `app/confirmation/[orderId]/page.tsx`  
Gunakan `useToast` untuk error; Modal untuk konfirmasi bila sudah ada, atau pertahankan confirm tapi tambah label jelas.

### 5.6 Modal focus trap + Escape

**File:** `components/ui/Modal.tsx`  
Escape handler + focus first focusable.

**Acceptance:**
- [x] Zoom diizinkan.
- [x] Error input ter-announce.
- [x] Toggle password bisa di-tab.

---

## Phase 6 — UX (hanya item terverifikasi)

### 6.1 Error state dashboard & recap

**Files:** `app/admin/dashboard/page.tsx`, `app/admin/recap/page.tsx`, `app/admin/customers/page.tsx`, `app/admin/settings/page.tsx`  
State `error` + retry button.

### 6.2 Toast alih-alih silent catch

**File:** `app/order/page.tsx` — config load catch (sudah ada toast, verify).

### 6.3 Chart colors → theme

**Files:** `components/charts/*.tsx`  
Ganti hex hardcoded dengan `#D42B2B` scale.

### 6.4 Hanya eksekusi item ENHANCEMENT_PLAN yang masih valid

Selalu diff vs kode dulu — jangan percaya plan lama blind.

---

## Phase 7 — Technical debt

### 7.1 Dead code (verify import dulu)

Cek dengan grep sebelum hapus:
- `components/order/CustomerSidebar.tsx` / `CustomerNavbar.tsx`
- `hooks/useAuth.ts` / bagian `useUtils` yang tak terpakai

### 7.2 Extract OrderDetailCard (opsional)

Jika masih inline di `my-orders/page.tsx` — pindah ke `components/order/OrderDetailCard.tsx`.

### 7.3 Duplikat OrderSchema di dashboard

Import dari `lib/firestore.ts` / `types`.

---

## File Impact Map (ringkas)

| Phase | File utama |
|-------|-----------|
| 1.1 | `app/api/upload/route.ts` |
| 1.2 | `firestore.rules` |
| 1.3 | `app/api/order/route.ts`, `app/order/page.tsx` |
| 1.4 | `app/confirmation/[orderId]/page.tsx`, `app/order/page.tsx` |
| 2.x | `app/api/admin/login/route.ts`, `lib/auth.ts`, `lib/firestore.ts` |
| 3.x | `lib/rate-limit.ts`, cancel/login routes |
| 4.x | `__tests__/security/*`, `.github/workflows/ci.yml` |
| 5.x | login page, layout, Input, globals.css, my-orders, Modal |
| 6.x | admin pages, charts |
| 7.x | dead code (verified) |

---

## Verification (tiap phase + akhir)

```bash
npm run lint
npx tsc --noEmit
npm run test:ci
npm run build
```

Manual:
1. Guest order → confirmation → my-orders lookup → cancel.
2. Admin login → menu edit → logout → /admin redirect.
3. Google sign-in → my-orders → logout.
4. `curl` upload tanpa cookie → 401.

---

## Acceptance Criteria (project)

**Security:** Tidak ada unauthenticated upload; rules admin-only untuk data sensitif; total order server-computed. *(deploy rules manual)*

**Google Auth:** Login valid OK; token invalid 401; logout bersih; profile sync.

**Testing:** Test security meaningful; CI hijau; guest checkout E2E/manual OK.

**UI/UX:** Tema `#D42B2B` dipertahankan; zoom OK; aria-live errors; tanpa redesign visual.

---

## Status eksekusi (final)

- Phase 1–7: kode selesai; verifikasi lokal `lint` / `tsc` / `test:ci` / `build` hijau.
- Manual tersisa (butuh env/kredensial, di luar repo):
  1. Isi `.env.local` dari `.env.local.example`.
  2. `npx firebase deploy --only firestore:rules,storage`.
  3. Re-login admin agar custom claim `admin: true` terpasang.
  4. Smoke test alur guest order → confirmation → my-orders → cancel; admin login → edit → logout.
