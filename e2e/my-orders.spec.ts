import { test, expect, orderPayload } from './fixtures';

/**
 * Guest order tracking: lookup by order number, plus the ownership check added
 * to the cancel endpoint.
 */

const ORDER_NUMBER = 'PD-20260928-001-X7K9';
const PHONE = '628123456789';

test.describe('order tracking', () => {
  // ─── Lookup ────────────────────────────────────────────────────────────

  test('shows the order after a successful lookup', async ({ page }) => {
    await page.route(`**/api/order/${ORDER_NUMBER}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      })
    );

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();

    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();
    await expect(page.getByText('Pempek Kapal Selam').first()).toBeVisible();
    await expect(page.getByText('Budi Santoso')).toBeVisible();
    await expect(page.getByText('Tanpa cuka')).toBeVisible();
  });

  test('shows a not-found state for an unknown order number', async ({ page }) => {
    await page.route('**/api/order/**', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pesanan tidak ditemukan.' }),
      })
    );

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();

    await expect(page.getByText('Pesanan tidak ditemukan')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Buat Pesanan Baru' })
    ).toBeVisible();
  });

  test('shows an error state when the lookup request fails', async ({ page }) => {
    await page.route('**/api/order/**', (route) => route.abort());

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();

    await expect(page.getByText('Gagal memuat data')).toBeVisible();
  });

  test('shows a loading state while the lookup is in flight', async ({ page }) => {
    // Hold the response open so the pending state is observable.
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route('**/api/order/**', async (route) => {
      await held;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      });
    });

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();

    // Submit button shows its loading affordance while the request is pending.
    await expect(page.getByRole('button', { name: /Cek Pesanan/ })).toBeDisabled();

    release();
    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();
  });

  // ─── Cancellation requires proof of ownership ──────────────────────────

  test('sends the recorded WhatsApp number when cancelling', async ({ page }) => {
    // The phone was stored on this device when the order was placed.
    await page.addInitScript(
      (args: string[]) => window.localStorage.setItem(args[0], args[1]),
      [
        'pempek-domino-orders',
        JSON.stringify([
          {
            orderNumber: ORDER_NUMBER,
            orderId: 'doc-1',
            customerName: 'Budi Santoso',
            whatsappNumber: PHONE,
          },
        ]),
      ]
    );

    let cancelBody: Record<string, unknown> | null = null;
    await page.route(`**/api/order/${ORDER_NUMBER}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      })
    );
    await page.route(`**/api/order/${ORDER_NUMBER}/cancel`, async (route) => {
      cancelBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();
    await expect(page.getByText('Pempek Kapal Selam').first()).toBeVisible();

    await page.getByRole('button', { name: /Batalkan/ }).first().click();

    // The ownership proof must actually reach the server.
    await expect.poll(() => cancelBody).not.toBeNull();
    expect(cancelBody).toEqual({ whatsappNumber: PHONE });
    await expect(page.getByText('Pesanan berhasil dibatalkan')).toBeVisible();
  });

  test('surfaces the rejection when the WhatsApp number does not match', async ({
    page,
  }) => {
    await page.addInitScript(
      (args: string[]) => window.localStorage.setItem(args[0], args[1]),
      [
        'pempek-domino-orders',
        JSON.stringify([
          {
            orderNumber: ORDER_NUMBER,
            orderId: 'doc-1',
            customerName: 'Budi Santoso',
            whatsappNumber: '628000000000',
          },
        ]),
      ]
    );

    await page.route(`**/api/order/${ORDER_NUMBER}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      })
    );
    await page.route(`**/api/order/${ORDER_NUMBER}/cancel`, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Nomor pesanan atau nomor WhatsApp tidak sesuai.',
        }),
      })
    );

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();
    await expect(page.getByText('Pempek Kapal Selam').first()).toBeVisible();

    await page.getByRole('button', { name: /Batalkan/ }).first().click();

    await expect(
      page.getByText('Nomor pesanan atau nomor WhatsApp tidak sesuai.')
    ).toBeVisible();
  });

  test('asks for the WhatsApp number when this device has no record', async ({
    page,
  }) => {
    let prompted = false;
    let cancelBody: Record<string, unknown> | null = null;

    await page.route(`**/api/order/${ORDER_NUMBER}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      })
    );
    await page.route(`**/api/order/${ORDER_NUMBER}/cancel`, async (route) => {
      cancelBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        prompted = true;
        await dialog.accept('08123456789');
      } else {
        await dialog.accept();
      }
    });

    await page.goto('/my-orders');
    await page.getByLabel('Nomor Pesanan').fill(ORDER_NUMBER);
    await page.getByRole('button', { name: 'Cek Pesanan' }).click();
    await expect(page.getByText('Pempek Kapal Selam').first()).toBeVisible();

    await page.getByRole('button', { name: /Batalkan/ }).first().click();

    await expect.poll(() => cancelBody).not.toBeNull();
    expect(prompted).toBe(true);
    // Whatever the customer typed is sent through for server-side comparison.
    expect(cancelBody).toEqual({ whatsappNumber: '08123456789' });
  });
});
