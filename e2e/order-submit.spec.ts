import { test, expect, seedCart, orderPayload } from './fixtures';
import type { Page } from '@playwright/test';

const SEED_ITEMS = [
  { productId: 'p1', productName: 'Pempek Kapal Selam', price: 15000, quantity: 2 },
  { productId: 'p2', productName: 'Mix Isi 5', price: 22000, quantity: 1 },
];

const PICKUP_DATE = '2026-09-30T10:00';

/** Fill the minimum needed for a valid order (pickup). */
async function fillValidOrder(page: Page) {
  await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
  await page.getByLabel('Nomor WhatsApp').fill('081234567890');
  await page.getByLabel('Tanggal & Jam Ambil').fill(PICKUP_DATE);
}

test.describe('order submission', () => {
  test('shows the cart summary once items are in the store', async ({ page }) => {
    await seedCart(page, SEED_ITEMS);
    await page.goto('/order');

    const summary = page.getByRole('button', { name: 'Pesan' });
    await expect(summary).toBeVisible();
    // 2 x 15.000 + 1 x 22.000
    await expect(page.getByText('Rp 52.000')).toBeVisible();
    await expect(page.getByText('3 item')).toBeVisible();
  });

  // ─── Happy path ─────────────────────────────────────────────────────────

  test('submits the order, clears the cart and lands on the confirmation', async ({
    page,
  }) => {
    await seedCart(page, SEED_ITEMS);

    // Capture the outbound request so we can assert what the client sent.
    let posted: Record<string, unknown> | null = null;
    await page.route('**/api/order', async (route) => {
      if (route.request().method() === 'POST') {
        posted = route.request().postDataJSON() as Record<string, unknown>;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'doc-1',
          orderNumber: 'PD-20260928-001-X7K9',
          subtotal: 52000,
          deliveryFee: 0,
          total: 52000,
          status: 'pending',
          paymentStatus: 'unpaid',
        }),
      });
    });

    await page.goto('/order');
    await fillValidOrder(page);
    await page.getByRole('button', { name: 'Pesan' }).click();

    // Navigates by public order number so the confirmation page can look it up.
    await expect(page).toHaveURL(/\/confirmation\/PD-20260928-001-X7K9$/);

    // The client must send product ids and quantities — never its own prices.
    expect(posted).not.toBeNull();
    const body = posted as unknown as Record<string, unknown>;
    expect(body.items).toEqual([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    expect(body.customerName).toBe('Budi Santoso');
    expect(body.whatsappNumber).toBe('6281234567890');
    expect(body.deliveryMethod).toBe('pickup');

    // Cart is emptied on success.
    await expect(page.getByRole('button', { name: 'Pesan' })).toHaveCount(0);
  });

  test('remembers the order on this device for later lookup', async ({ page }) => {
    await seedCart(page, SEED_ITEMS);
    await page.route('**/api/order', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'doc-1',
          orderNumber: 'PD-20260928-001-X7K9',
          subtotal: 52000,
          deliveryFee: 0,
          total: 52000,
          status: 'pending',
          paymentStatus: 'unpaid',
        }),
      })
    );

    await page.goto('/order');
    await fillValidOrder(page);
    await page.getByRole('button', { name: 'Pesan' }).click();
    await expect(page).toHaveURL(/\/confirmation\/PD-20260928-001-X7K9$/);

    const saved = await page.evaluate(() =>
      window.localStorage.getItem('pempek-domino-orders')
    );
    expect(saved).toContain('PD-20260928-001-X7K9');
    // The phone is recorded at creation so a later cancel can prove ownership.
    expect(saved).toContain('6281234567890');
  });

  // ─── Validation failures ───────────────────────────────────────────────

  test('rejects a malformed WhatsApp number without calling the API', async ({
    page,
  }) => {
    await seedCart(page, SEED_ITEMS);
    let calls = 0;
    await page.route('**/api/order', (route) => {
      calls++;
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/order');
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor WhatsApp').fill('12345');
    await page.getByLabel('Tanggal & Jam Ambil').fill(PICKUP_DATE);
    await page.getByRole('button', { name: 'Pesan' }).click();

    await expect(page.getByText('Nomor WhatsApp tidak valid')).toBeVisible();
    // Must stay on the page and never reach the server.
    expect(calls).toBe(0);
    await expect(page).toHaveURL(/\/order$/);
  });

  test('requires a pickup time when collecting in person', async ({ page }) => {
    await seedCart(page, SEED_ITEMS);
    let calls = 0;
    await page.route('**/api/order', (route) => {
      calls++;
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/order');
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor WhatsApp').fill('081234567890');
    // No pickup time.
    await page.getByRole('button', { name: 'Pesan' }).click();

    await expect(page.getByText('Pilih waktu pengambilan')).toBeVisible();
    expect(calls).toBe(0);
  });

  test('requires a delivery address when shipping', async ({ page }) => {
    await seedCart(page, SEED_ITEMS);
    let calls = 0;
    await page.route('**/api/order', (route) => {
      calls++;
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/order');
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor WhatsApp').fill('081234567890');
    await page.getByLabel('Tanggal & Jam Ambil').fill(PICKUP_DATE);
    // The radio input is visually hidden (sr-only) inside its label, so click
    // the label rather than the input.
    await page.locator('label[for="delivery-send"]').click();
    await expect(page.getByLabel('Alamat Lengkap')).toBeVisible();
    // Address left empty.
    await page.getByRole('button', { name: 'Pesan' }).click();

    await expect(page.getByText('Masukkan alamat pengiriman')).toBeVisible();
    expect(calls).toBe(0);
  });

  // ─── API failure ───────────────────────────────────────────────────────

  test('surfaces a server error and keeps the cart so the order is not lost', async ({
    page,
  }) => {
    await seedCart(page, SEED_ITEMS);
    await page.route('**/api/order', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gagal membuat pesanan. Coba lagi.' }),
      })
    );

    await page.goto('/order');
    await fillValidOrder(page);
    await page.getByRole('button', { name: 'Pesan' }).click();

    await expect(page.getByText('Gagal membuat pesanan. Coba lagi.')).toBeVisible();
    // Still on the order page, cart intact — nothing was silently dropped.
    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByRole('button', { name: 'Pesan' })).toBeVisible();
  });

  test('surfaces a server-side validation rejection verbatim', async ({ page }) => {
    await seedCart(page, SEED_ITEMS);
    await page.route('**/api/order', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Salah satu menu tidak tersedia. Muat ulang menu dan coba lagi.',
        }),
      })
    );

    await page.goto('/order');
    await fillValidOrder(page);
    await page.getByRole('button', { name: 'Pesan' }).click();

    await expect(
      page.getByText('Salah satu menu tidak tersedia. Muat ulang menu dan coba lagi.')
    ).toBeVisible();
  });

  // ─── Confirmation page ─────────────────────────────────────────────────

  test('confirmation renders the order summary from the lookup API', async ({
    page,
  }) => {
    await page.route('**/api/order/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      })
    );

    await page.goto('/confirmation/PD-20260928-001-X7K9');

    await expect(page.getByText('Pesanan Masuk!')).toBeVisible();
    await expect(page.getByText('PD-20260928-001-X7K9')).toBeVisible();
    // The name appears in the item list; totals repeat across subtotal/total.
    await expect(page.getByText('Pempek Kapal Selam')).toBeVisible();
    await expect(page.getByText('Rp 30.000').first()).toBeVisible();
    // Delivery method and the pickup slot are both surfaced from the payload.
    await expect(page.getByText('Ambil Sendiri').first()).toBeVisible();
    await expect(page.getByText('Waktu Ambil: 2026-09-30T10:00')).toBeVisible();
  });

  test('confirmation shows an error state when the lookup fails', async ({ page }) => {
    await page.route('**/api/order/**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gagal memuat pesanan.' }),
      })
    );

    await page.goto('/confirmation/PD-20260928-001-X7K9');

    // Scoped by text to exclude Next.js's empty route-announcer alert.
    await expect(
      page.getByRole('alert').filter({ hasText: 'Gagal memuat pesanan' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coba Lagi' })).toBeVisible();
  });

  test('confirmation shows a not-found state for an unknown order', async ({ page }) => {
    await page.route('**/api/order/**', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pesanan tidak ditemukan.' }),
      })
    );

    await page.goto('/confirmation/PD-20260928-999-ZZZZ');

    await expect(page.getByText('Pesanan tidak ditemukan.')).toBeVisible();
  });
});
