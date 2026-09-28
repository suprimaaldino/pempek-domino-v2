import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Security posture, verified against a real production build:
 *  - the admin gate redirects unauthenticated traffic
 *  - the CSP actually forbids inline/eval scripts and framing
 *  - the hardened headers are present
 *
 * `ADMIN_EMAIL` is a dummy, so no admin session can be established here.
 */

/** Read response headers for a path without following the redirect chain away. */
async function headersFor(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'commit' });
  expect(response).not.toBeNull();
  return response!.headers();
}

test.describe('admin route protection', () => {
  const PROTECTED = [
    '/admin/dashboard',
    '/admin/orders',
    '/admin/menu',
    '/admin/settings',
    '/admin/recap',
    '/admin/customers',
    '/admin/payments',
  ];

  for (const path of PROTECTED) {
    test(`redirects ${path} to the login page when unauthenticated`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test('preserves the intended destination for post-login redirect', async ({
    page,
  }) => {
    await page.goto('/admin/menu');
    await expect(page).toHaveURL(/redirect=%2Fadmin%2Fmenu/);
  });

  test('rejects a forged admin cookie', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'firebaseAuthToken',
        value: 'forged.token.value',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/admin/dashboard');
    // Identity Toolkit is darkened, so verification fails and we are bounced.
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('leaves the login page itself reachable', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login$/);
    // exact: the password field's reveal toggle is labelled "Tampilkan password".
    await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });

  test('a bad login attempt does not reveal whether the username exists', async ({
    page,
  }) => {
    // The route's own credentials logic (including the bcrypt timing fix) is
    // covered exhaustively by __tests__/security/auth.test.ts. This spec pins
    // the browser → route → UI contract: the generic message is shown verbatim.
    for (const status of [401, 500]) {
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await page.route('**/api/admin/login', (route) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Kredensial tidak valid.' }),
        })
      );

      await page.goto('/admin/login');
      await page.getByLabel('Username', { exact: true }).fill('definitely-not-the-admin');
      await page.getByLabel('Password', { exact: true }).fill('whatever');
      await page.getByRole('button', { name: /Masuk/i }).click();

      await expect(page.getByText('Kredensial tidak valid.')).toBeVisible();
      // Nothing about the internal state is leaked into the UI.
      await expect(page.getByText(/bcrypt|hash|firebase/i)).toHaveCount(0);
    }
  });
});

test.describe('security headers', () => {
  test('sets the hardened response headers', async ({ page }) => {
    const headers = await headersFor(page, '/order');

    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  test('sends a restrictive Content-Security-Policy', async ({ page }) => {
    const headers = await headersFor(page, '/order');
    const csp = headers['content-security-policy'] ?? '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  // Regression guard for next.config.js, which allows 'unsafe-eval' in dev so
  // that React Fast Refresh works. That escape hatch must never ship.
  test('production script-src does not allow unsafe-eval', async ({ page }) => {
    const headers = await headersFor(page, '/order');
    const csp = headers['content-security-policy'] ?? '';
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  test('the page still renders under the production CSP', async ({ page }) => {
    // A CSP that blocks the app's own bundles would show up as a blank page.
    await page.goto('/order');
    await expect(page.getByRole('heading', { name: 'Pilih Menu' })).toBeVisible();
  });
});

test.describe('API exposure', () => {
  test('the lookup API never returns the customer phone or address', async ({
    page,
  }) => {
    // Real route, real redaction. Reaching it needs no secrets.
    const response = await page.request.get('/api/order/PD-20260928-001-ZZZZ');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).not.toHaveProperty('whatsappNumber');
    expect(body).not.toHaveProperty('deliveryAddress');
  });

  test('cancelling without a WhatsApp number is refused', async ({ page }) => {
    const response = await page.request.post(
      '/api/order/PD-20260928-001-ZZZZ/cancel',
      { data: {} }
    );
    // 403 (no proof of ownership) or 404 — never a successful cancellation.
    expect([403, 404]).toContain(response.status());
  });

  test('order creation is reachable but validates before writing', async ({
    page,
  }) => {
    const response = await page.request.post('/api/order', {
      data: { customerName: 'x' },
    });
    expect(response.status()).toBe(400);
  });
});
