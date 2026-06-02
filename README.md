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
- Node.js 18+
- Akun Firebase (Free/Spark Plan)

### 2. Setup Firebase
- Buat project baru di [Firebase Console](https://console.firebase.google.com).
- Aktifkan **Firestore**, **Authentication** (Metode Email/Password), dan **Storage**.
- Tambahkan Admin User di menu Auth:
  - Email: `admin@pempekdomino.internal`
  - Password: `p3mp3Kd0m!n0`
- Buat file `.env.local` dan isi dengan kredensial dari project settings.

### 3. Konfigurasi Environment
Salin `.env.local.example` ke `.env.local` dan isi dengan kredensial Firebase Anda:
```bash
cp .env.local.example .env.local
```
**PENTING**: Generate hash password admin menggunakan `bcryptjs` dan simpan di `ADMIN_PASSWORD_HASH`. Untuk password default `p3mp3Kd0m!n0`, hash-nya adalah:
`$2a$10$7vN3vYtJ6lW6w6v6v6v6vO6m6m6m6m6m6m6m6m6m6m6m6m6m6m` (Atau generate baru).

### 4. Menjalankan Aplikasi
```bash
# Install dependencies
npm install

# Seed data awal (Produk)
npx tsx scripts/seed.ts

# Jalankan dev server
npm run dev
```

## 🚀 Deployment (Vercel)
Aplikasi ini dioptimalkan untuk Vercel. Pastikan environment variables sudah didaftarkan di dashboard Vercel sebelum deploy.

---

&copy; 2026 Pempek Domino. Built for professional food business management.
