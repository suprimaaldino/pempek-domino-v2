import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * The app talks to Firebase directly from the browser. A real Firestore listen
 * stream cannot be fulfilled by `page.route` (gRPC-Web over a streaming fetch),
 * so these tests exercise every boundary that is HTTP and block the rest.
 *
 * Dummy NEXT_PUBLIC_* values are supplied to the *build* (they are inlined at
 * build time) so the client SDK initialises for real. Next.js does not override
 * process.env entries that are already set, so these dummies take precedence
 * over a developer's real .env.local — a local `npm run e2e` can therefore
 * never read from, or write to, the production Firebase project.
 */
const E2E_FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'e2e-dummy-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'e2e-dummy.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'e2e-dummy-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'e2e-dummy.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:e2edummy',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-E2EDUMMY00',
  // Middleware/verify paths read these; dummy values make an admin session
  // impossible, which is exactly what the security specs assert.
  ADMIN_USERNAME: 'e2e-admin',
  ADMIN_EMAIL: 'e2e-admin@example.invalid',
  ADMIN_PASSWORD_HASH: '$2a$12$e2edummyhashvaluee2edummyhashvaluee2edummyhashvaluee2e',
  NEXT_PUBLIC_ADMIN_EMAIL: 'e2e-admin@example.invalid',
} as const;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    // next-pwa registers the service worker in production builds; a precached
    // first visit would otherwise be served to every later test.
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    // Production build so the CSP/HSTS/middleware assertions are meaningful.
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${BASE_URL}/order`,
    env: { ...E2E_FIREBASE_ENV },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
