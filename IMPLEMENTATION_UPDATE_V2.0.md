# IMPLEMENTATION UPDATE v2.0 — Google Auth + Landing Page

## Overview

Migrasi dari username/password login ke Google Auth. Login page pindah ke halaman depan (`/`). Customer wajib login Google sebelum order. Admin login terbatas untuk email yang sesuai `ADMIN_EMAIL`.

---

## 1. Arsitektur Baru

```
/ (landing page + Google login)
├── Login Google (email ≠ ADMIN_EMAIL) → /order
├── Login Google (email = ADMIN_EMAIL) → /admin/dashboard
└── Link "Pesan tanpa login" → /order (opsional)

/order (form pemesanan)
├── Sudah login → auto-fill nama dari Google, phone dari Firestore
└── Belum login → isi semua manual

/confirmation/[orderId]
└── Simpan order ke localStorage + Firestore

/my-orders
├── Auto-load dari localStorage
└── Atau cari manual pakai orderNumber

/admin/* (email === ADMIN_EMAIL only)
└── Auth guard: cek email, redirect ke / kalau tidak match
```

---

## 2. Flow Detail

### 2.1 Landing Page (`/`)

**Layout:**
- Full-screen hero section
- Logo Pempek Domino (centered)
- Tagline: "Pesan Pempek Palembang Terbaik"
- Tombol "Masuk dengan Google" (Google icon + teks)
- Link kecil di bawah: "Pesan tanpa login →"

**Behavior:**
1. Klik "Masuk dengan Google" → `signInWithPopup(GoogleAuthProvider)`
2. Setelah login berhasil:
   - Cek `user.email === process.env.ADMIN_EMAIL`
   - Kalau match → redirect `/admin/dashboard`
   - Kalau tidak match → redirect `/order`
3. Klik "Pesan tanpa login" → redirect `/order` (tanpa auth)

### 2.2 Auth Library (`lib/auth.ts`)

**Hapus:**
- `loginAdmin(username, password)` — tidak dipakai lagi

**Tambah:**
- `loginWithGoogle(): Promise<User>` — signInWithPopup, return user
- `loginAsAdmin(): Promise<User>` — signInWithPopup + cek email
- `getCurrentUser(): User | null` — sudah ada
- `onAuthStateChanged(callback)` — sudah ada
- `logout(): Promise<void>` — signOut + clear cookie

### 2.3 Admin Auth Guard (`app/admin/layout.tsx`)

**Current:**
- Cek `onAuthStateChanged` → kalau tidak ada user, redirect ke `/admin/login`

**New:**
- Cek `onAuthStateChanged` → kalau tidak ada user, redirect ke `/`
- Cek `user.email !== ADMIN_EMAIL` → redirect ke `/`
- Hapus pathname check untuk `/admin/login` (halaman dihapus)

### 2.4 Admin Login Page

**Hapus:**
- `app/admin/login/page.tsx` — digantikan landing page

**Redirect:**
- Semua akses ke `/admin/login` akan redirect ke `/`

### 2.5 Customer Data (Firestore)

**Collection: `customers`**

```typescript
interface Customer {
  id: string;           // email (normalized)
  name: string;         // dari Google displayName
  email: string;        // dari Google Auth
  phone: string;        // diinput manual oleh customer
  photoURL?: string;    // dari Google photoURL
  totalOrders: number;
  totalSpending: number;
  lastOrderAt: Timestamp;
  createdAt: Timestamp;
}
```

**Functions:**
- `getCustomerByEmail(email: string): Promise<Customer | null>`
- `upsertCustomerFromGoogle(name, email, phone?, photoURL?): Promise<void>`

### 2.6 Order Page Auto-fill

**Current:**
- Form selalu kosong, customer isi manual

**New:**
- Kalau user login → auto-fill `customerName` dari Google displayName
- Kalau customer sudah pernah order → auto-fill `phone` dari Firestore
- Kalau belum login → form kosong (isi manual)

---

## 3. File Changes

| # | File | Action | Detail |
|---|------|--------|--------|
| 1 | `app/page.tsx` | **Rewrite** | Landing page + Google login hero |
| 2 | `lib/auth.ts` | **Rewrite** | Google Auth functions |
| 3 | `app/admin/login/page.tsx` | **Hapus** | Redirect ke `/` |
| 4 | `app/admin/layout.tsx` | **Update** | Auth guard: cek email ADMIN_EMAIL |
| 5 | `app/api/admin/login/route.ts` | **Hapus** | Tidak dipakai lagi |
| 6 | `app/api/admin/logout/route.ts` | **Simplify** | Hanya signOut Firebase |
| 7 | `components/BottomNav.tsx` | **Update** | Hapus tab "Admin" |
| 8 | `lib/firestore.ts` | **Update** | Tambah customer email functions |
| 9 | `app/order/page.tsx` | **Update** | Auto-fill dari auth state |
| 10 | `store/authStore.ts` | **Update** | Support Google Auth user |
| 11 | `lib/utils.ts` | **Update** | Hapus labels yang tidak dipakai |
| 12 | `.env.local` | **Update** | Hapus ADMIN_USERNAME, ADMIN_PASSWORD_HASH |
| 13 | `VERCEL_ENV_SETUP.md` | **Update** | Hapus vars yang tidak dipakai |

---

## 4. Dependencies

| Package | Status | Note |
|---------|--------|------|
| `firebase` | Sudah ada | Google Auth provider sudah include |
| `bcryptjs` | Bisa dihapus | Tidak dipakai lagi |
| `next` | Sudah ada | - |
| `zustand` | Sudah ada | Auth store update |

---

## 5. Environment Variables

**Hapus:**
- `ADMIN_USERNAME` — tidak dipakai
- `ADMIN_PASSWORD_HASH` — tidak dipakai

**Tetap:**
- `ADMIN_EMAIL` — email admin untuk whitelist
- `NEXT_PUBLIC_FIREBASE_*` — semua tetap

---

## 6. Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| Admin harus login Google | Admin lama kehilangan akses sementara | Admin cukup klik "Login dengan Google" pakai email yang sama |
| `/admin/login` dihapus | Bookmark lama tidak berfungsi | Redirect otomatis ke `/` |
| Customer wajib login | Tidak ada dampak | Login Google cepat (1 klik) |
| `ADMIN_USERNAME` dihapus | Tidak ada dampak | Admin pakai email Google |
| `ADMIN_PASSWORD_HASH` dihapus | Lebih aman | Tidak ada password yang bisa bocor |

---

## 7. Security

| Aspect | Current | New |
|--------|---------|-----|
| Admin authentication | Username + bcrypt hash | Google OAuth (MFA built-in) |
| Password storage | Bcrypt hash di env var | Tidak ada password |
| Session management | HTTP-only cookie | Firebase Auth token |
| Admin authorization | Email check di API | Email check di client + guard |

---

## 8. Testing Checklist

- [ ] Landing page tampil dengan benar
- [ ] Google login button berfungsi
- [ ] Customer login → redirect ke `/order`
- [ ] Admin login (email match) → redirect ke `/admin/dashboard`
- [ ] Admin login (email tidak match) → redirect ke `/order`
- [ ] "Pesan tanpa login" link → `/order` tanpa auth
- [ ] Auto-fill nama dari Google profile
- [ ] Auto-fill phone dari Firestore (kalau sudah pernah order)
- [ ] Order flow berfungsi dengan auto-fill
- [ ] Admin dashboard berfungsi setelah login
- [ ] Admin guard redirect ke `/` kalau tidak login
- [ ] Logout berfungsi
- [ ] BottomNav tidak menampilkan tab Admin
- [ ] `/admin/login` redirect ke `/`
- [ ] localStorage orders tetap berfungsi

---

## 9. Effort Estimation

| Task | Jam |
|------|-----|
| Landing page design + Google login | 1.5 |
| Auth library rewrite | 1.0 |
| Admin guard update | 0.5 |
| Remove old auth (login page, API route) | 0.5 |
| Customer auto-fill + Firestore | 1.0 |
| BottomNav update | 0.25 |
| Testing & polish | 1.0 |
| **Total** | **~5.75 jam** |

---

## 10. Rollback Plan

Jika ada masalah, rollback dengan:
1. Restore `app/admin/login/page.tsx` dari git
2. Restore `app/api/admin/login/route.ts` dari git
3. Restore `lib/auth.ts` dari git
4. Restore `app/page.tsx` dari git (redirect ke `/order`)
5. Tambah kembali env vars `ADMIN_USERNAME` dan `ADMIN_PASSWORD_HASH`

---

## 11. Deployment Notes

1. Update environment variables di Vercel:
   - Hapus `ADMIN_USERNAME`
   - Hapus `ADMIN_PASSWORD_HASH`
   - Pastikan `ADMIN_EMAIL` benar
2. Enable Google Auth provider di Firebase Console:
   - Firebase Console → Authentication → Sign-in method → Google → Enable
3. Deploy ke Vercel
4. Test login flow di production
5. Test admin access
