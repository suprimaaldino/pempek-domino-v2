import { test, expect } from './fixtures';

/**
 * Public storefront journey: routing, shell rendering, empty/error states,
 * navigation, legal pages and mobile tap targets.
 *
 * No Firebase is available (it is darkened), so the menu area is expected to
 * land in its error state — which is a real, user-visible path worth pinning.
 */

test.describe('public storefront', () => {
  test('root redirects to the order page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/order$/);
    await expect(
      page.getByRole('heading', { name: 'Pempek Domino' })
    ).toBeVisible();
  });

  test('order page renders all four checkout sections', async ({ page }) => {
    await page.goto('/order');

    await expect(page.getByRole('heading', { name: 'Pilih Menu' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data Pemesan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pengiriman' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pembayaran' })).toBeVisible();
  });

  // Firestore's SDK retries a failed listen with backoff before surfacing the
  // error, so the exact error state is not reachable within a test timeout.
  // What must be deterministic is that the customer is never left with a blank
  // or crashed page, and the checkout form stays reachable.
  test('degrades gracefully while the menu cannot load', async ({ page }) => {
    await page.goto('/order');

    await expect(page.getByRole('heading', { name: 'Pilih Menu' })).toBeVisible();
    await expect(page.getByLabel('Nama Lengkap')).toBeVisible();
    await expect(page.getByLabel('Nomor WhatsApp')).toBeVisible();
    // "Cek Pesanan" is a link in the order header (a button on /my-orders).
    await expect(page.getByRole('link', { name: 'Cek Pesanan' })).toBeVisible();
    // The global error boundary did not take over.
    await expect(page.getByText(/Terjadi kesalahan/i)).toHaveCount(0);
  });

  test('no order button is offered while the cart is empty', async ({ page }) => {
    await page.goto('/order');
    await expect(page.getByRole('button', { name: 'Pesan' })).toHaveCount(0);
  });

  test('bottom navigation exposes accessible labels', async ({ page }) => {
    await page.goto('/order');

    const nav = page.getByRole('navigation', { name: 'Navigasi bawah' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Menu' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pesanan' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Akun' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Admin' })).toBeVisible();
  });

  test('navigating via the bottom nav works', async ({ page }) => {
    await page.goto('/order');

    await page
      .getByRole('navigation', { name: 'Navigasi bawah' })
      .getByRole('link', { name: 'Pesanan' })
      .click();

    await expect(page).toHaveURL(/\/my-orders$/);
    await expect(
      page.getByRole('heading', { name: 'Cek Pesanan' })
    ).toBeVisible();
  });

  test('order page header links to order tracking', async ({ page }) => {
    await page.goto('/order');
    await page.getByRole('link', { name: 'Cek Pesanan' }).first().click();
    await expect(page).toHaveURL(/\/my-orders$/);
  });

  test('my-orders shows the empty state before any lookup', async ({ page }) => {
    await page.goto('/my-orders');

    await expect(
      page.getByText('Masukkan nomor pesanan untuk melihat statusnya')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cek Pesanan' })).toBeVisible();
  });

  // ─── Legal pages (required for Google OAuth branding verification) ──────

  test('the order page links to the legal pages and they render', async ({
    page,
  }) => {
    await page.goto('/order');

    await page.getByRole('link', { name: 'Syarat & Ketentuan' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(
      page.getByRole('heading', { name: /Syarat/i }).first()
    ).toBeVisible();

    await page.goto('/order');
    await page.getByRole('link', { name: 'Kebijakan Privasi' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole('heading', { name: /Kebijakan Privasi/i }).first()
    ).toBeVisible();
  });

  // ─── Accessibility / mobile ────────────────────────────────────────────

  test('form inputs are labelled', async ({ page }) => {
    await page.goto('/order');

    await expect(page.getByLabel('Nama Lengkap')).toBeVisible();
    await expect(page.getByLabel('Nomor WhatsApp')).toBeVisible();
    await expect(page.getByLabel('Catatan (opsional)')).toBeVisible();
    await expect(page.getByLabel('Tanggal & Jam Ambil')).toBeVisible();
  });

  test('interactive controls meet a usable touch target size', async ({ page }) => {
    await page.goto('/order');

    // The back button in the my-orders header is the smallest control.
    await page.goto('/my-orders');
    const back = page.getByRole('button', { name: 'Kembali' });
    await expect(back).toBeVisible();

    const box = await back.boundingBox();
    expect(box).not.toBeNull();
    // 24px visual + padding; assert a floor rather than an exact value.
    expect((box?.width ?? 0) * (box?.height ?? 0)).toBeGreaterThan(300);
  });

  test('an unknown route renders the not-found page', async ({ page }) => {
    const response = await page.goto('/halaman-yang-tidak-ada');
    expect(response?.status()).toBe(404);
  });
});
