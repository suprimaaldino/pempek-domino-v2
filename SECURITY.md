# Security Policy

## Overview

Dokumen ini menjelaskan langkah-langkah keamanan yang telah diimplementasikan dalam aplikasi Pempek Domino.

## Security Measures Implemented

### 1. Authentication & Authorization

- **Server-side Login**: Password verification dilakukan di server untuk mencegah exposure hash
- **Rate Limiting**: Maksimal 5 attempt login per 15 menit per IP
- **HTTP-only Cookies**: Auth token disimpan dalam cookie HTTP-only untuk mencegah XSS
- **Middleware Protection**: Next.js middleware melindungi admin routes

### 2. Firestore Security Rules

- Strict validation pada data order (customerName, phone, items, total)
- Hanya authenticated users yang bisa write ke database
- Input validation di level database
- Protection terhadap field sensitif (createdAt, orderNumber tidak bisa diubah)

### 3. Input Sanitization

Semua user input disanitasi menggunakan DOMPurify:
- `customerName`: Hanya huruf, angka, spasi, dan tanda baca umum
- `whatsappNumber`: Hanya digit, format Indonesia (628xxx)
- `deliveryAddress`: Huruf, angka, dan karakter address yang valid
- `notes`: Karakter umum dengan limit 500 karakter

### 4. File Upload Security

- Whitelist MIME types: image/jpeg, image/png, image/webp
- Max file size: 2MB
- Max dimensions: 2000x2000px
- Filename sanitization untuk mencegah path traversal
- Image compression otomatis dengan max output 500KB

### 5. HTTP Security Headers

- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin

### 6. HTTPS Enforcement

- Automatic redirect dari HTTP ke HTTPS di production
- Secure cookie flag di production

## Environment Variables

### Required for Production

```bash
# Firebase (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin Credentials (Server-side only)
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_EMAIL=
```

**WARNING**: Jangan gunakan prefix `NEXT_PUBLIC_` untuk variabel yang bersifat sensitif!

## Reporting Security Issues

Jika menemukan kerentanan keamanan, silakan laporkan ke [email admin] dengan detail:
- Deskripsi masalah
- Langkah reproduksi
- Potential impact
- Saran perbaikan (jika ada)

## Security Checklist

- [x] Server-side authentication
- [x] Rate limiting
- [x] Input sanitization
- [x] Firestore security rules
- [x] HTTP security headers
- [x] HTTPS enforcement
- [x] File upload validation
- [x] XSS protection
- [x] Clickjacking protection
- [ ] Regular dependency updates (manual)
- [ ] Security audit berkala (manual)

## Dependencies

Untuk menjaga keamanan, jalankan perintah berikut secara berkala:

```bash
npm audit
npm update
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
