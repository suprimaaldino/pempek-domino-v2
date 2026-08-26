# Testing Documentation

Dokumentasi lengkap untuk unit test, functional test, dan security test aplikasi Pempek Domino.

## 📁 Struktur Test

```
__tests__/
├── unit/                    # Unit tests untuk fungsi dan utilities
│   ├── utils.test.ts       # Test untuk lib/utils.ts
│   └── store.test.ts       # Test untuk Zustand stores
├── functional/             # Functional tests untuk komponen
│   └── ProductCard.test.tsx
├── security/               # Security tests
│   ├── sanitize.test.ts    # Input sanitization tests
│   ├── auth.test.ts        # Authentication & middleware tests
│   └── firestore.rules.test.ts
├── integration/            # Integration tests
│   └── order.flow.test.ts  # End-to-end order flow
└── README.md               # Dokumentasi ini
```

## 🚀 Menjalankan Test

### Jalankan Semua Test
```bash
npm test
```

### Jalankan Test dalam Mode Watch
```bash
npm run test:watch
```

### Jalankan Test dengan Coverage
```bash
npm run test:coverage
```

### Jalankan Test Spesifik
```bash
# Unit tests only
npm run test:unit

# Functional tests only
npm run test:functional

# Security tests only
npm run test:security

# Integration tests only
npm run test:integration
```

### Jalankan Test untuk CI/CD
```bash
npm run test:ci
```

## 📝 Jenis Test

### 1. Unit Tests (`__tests__/unit/`)

Test untuk fungsi-fungsi individual dan utilities.

**utils.test.ts:**
- `cn()` - Tailwind class merger
- `formatRupiah()` - Format mata uang
- `formatWhatsApp()` - Format nomor WA
- `normalizePhone()` - Normalisasi nomor telepon
- `generateWhatsAppLink()` - Generator link WA
- `formatStoreHours()` - Format jam buka
- `formatDateId()`, `formatDateShort()`, `formatTime()` - Format tanggal/waktu
- Label constants dan category resolution

**store.test.ts:**
- Order store (addItem, updateQuantity, clearCart, etc.)
- Auth store (setUser, setLoading, logout)
- Store persistence
- Store selectors

### 2. Functional Tests (`__tests__/functional/`)

Test untuk komponen React dan interaksi user.

**ProductCard.test.tsx:**
- Render product information
- Handle image loading
- Add to cart functionality
- Update quantity
- Remove from cart
- UI state changes

### 3. Security Tests (`__tests__/security/`)

Test untuk keamanan aplikasi.

**sanitize.test.ts:**
- XSS prevention
- HTML tag removal
- Input validation
- SQL injection prevention
- NoSQL injection prevention
- Command injection prevention
- Path traversal prevention

**auth.test.ts:**
- Middleware security headers
- Rate limiting
- Brute force protection
- Cookie security
- Input validation
- Error handling security

**firestore.rules.test.ts:**
- Database access rules
- Data validation
- Security best practices

### 4. Integration Tests (`__tests__/integration/`)

Test untuk alur kerja lengkap.

**order.flow.test.ts:**
- Product selection flow
- Customer information validation
- Delivery method selection
- Payment processing
- Complete order validation
- Admin dashboard operations

## 🛡️ Security Test Coverage

### XSS Prevention
```typescript
// Test cases mencakup:
- <script>alert("xss")</script>
- <img src=x onerror=alert("xss")>
- javascript:alert("xss")
- Encoded HTML entities
```

### Input Validation
```typescript
// Test cases mencakup:
- SQL injection: '; DROP TABLE users; --
- NoSQL injection: {"$gt": ""}
- Command injection: $(whoami)
- Path traversal: ../../../etc/passwd
```

### Authentication Security
```typescript
// Test cases mencakup:
- Rate limiting (max 5 attempts)
- Brute force protection
- HTTP-only cookies
- Secure headers
```

## 📊 Coverage Threshold

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

## 🔧 Konfigurasi

### Jest Configuration (`jest.config.js`)
- Test environment: `jsdom`
- Module mapper untuk path alias `@/*`
- Setup files: `jest.setup.js`
- Coverage collection dari `lib/`, `hooks/`, `store/`

### Test Setup (`jest.setup.js`)
- Mock `matchMedia`
- Mock `IntersectionObserver`
- Mock `localStorage`
- Suppress console errors during tests

## 🎯 Best Practices

### Menulis Unit Test
```typescript
describe('functionName()', () => {
  test('should do something specific', () => {
    const input = 'test';
    const result = functionName(input);
    expect(result).toBe('expected');
  });

  test('should handle edge case', () => {
    const result = functionName('');
    expect(result).toBe('');
  });
});
```

### Menulis Functional Test
```typescript
describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName props={value} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<ComponentName />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Menulis Security Test
```typescript
describe('Security Feature', () => {
  test('prevents XSS attack', () => {
    const malicious = '<script>alert("xss")</script>';
    const result = sanitizeFunction(malicious);
    expect(result).not.toContain('<script>');
  });
});
```

## 🐛 Debugging Test

### Jalankan Test Spesifik
```bash
npm test -- --testNamePattern="formatRupiah"
```

### Jalankan dengan Verbose Output
```bash
npm test -- --verbose
```

### Jalankan dengan Debug
```bash
npm test -- --runInBand --detectOpenHandles
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Jest DOM](https://github.com/testing-library/jest-dom)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🔄 Continuous Integration

Test dijalankan otomatis pada:
1. Setiap pull request
2. Setiap push ke branch main
3. Sebelum deployment ke production

```yaml
# Contoh GitHub Actions workflow
- name: Run Tests
  run: npm run test:ci
```
