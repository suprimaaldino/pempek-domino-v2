# Pempek Domino PWA

Production-ready Progressive Web App (PWA) untuk sistem manajemen pre-order Pempek Palembang. Dibangun dengan Next.js 14, Firebase, dan Tailwind CSS.

## 🚀 Fitur Utama
- **Order Form Modern**: Flow pemesanan intuitif untuk pelanggan.
- **PWA Ready**: Dapat diinstal di HP, mendukung offline caching untuk menu.
- **Admin Dashboard**: Real-time monitoring pesanan, pendapatan, dan statistik produk.
- **Manajemen Menu**: Update harga, stok, dan foto produk secara langsung.
- **Rekap Harian**: Ekspor laporan penjualan ke CSV.
- **Integrasi WhatsApp**: Kirim rincian pesanan dan update status otomatis ke WhatsApp.

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database/Auth**: Firebase (Firestore, Auth, Storage)
- **State Management**: Zustand
- **Form & Validation**: React Hook Form + Zod
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts
- **PWA**: @ducanh2912/next-pwa

## 📦 Persiapan Instalasi

### 1. Prasyarat
- Node.js 20+ (dibutuhkan `--env-file` untuk script seed)
- Akun Firebase (Free/Spark Plan)

### 2. Setup Firebase
- Buat project baru di [Firebase Console](https://console.firebase.google.com).
- Aktifkan **Firestore**, **Authentication** (Metode Email/Password), dan **Storage**.
- Tambahkan Admin User di menu Auth dengan email & password pilihan Anda.
- Simpan email dan password tersebut di `.env.local` — **jangan pernah** menulis kredensial di repo atau README.
- Deploy security rules sebelum produksi:
  ```bash
  npx firebase deploy --only firestore:rules,storage
  ```
- Buat file `.env.local` dan isi dengan kredensial dari project settings.

### 3. Konfigurasi Environment
Salin `.env.local.example` ke `.env.local` dan isi dengan kredensial Firebase Anda:
```bash
cp .env.local.example .env.local
```
**PENTING**: Generate hash password admin menggunakan `bcryptjs` dan simpan di `ADMIN_PASSWORD_HASH`:
```bash
node -e "const b=require('bcryptjs');console.log(b.hashSync('password_anda',12))"
```

### 4. Menjalankan Aplikasi
```bash
# Install dependencies
npm install

# Seed data awal (Produk) — kredensial dibaca dari .env.local
npx tsx --env-file=.env.local scripts/seed.ts

# Jalankan dev server
npm run dev
```

## 🚀 Deployment (Vercel)
Aplikasi ini dioptimalkan untuk Vercel. Pastikan environment variables sudah didaftarkan di dashboard Vercel sebelum deploy.

---

&copy; 2026 Pempek Domino. Built for professional food business management.
