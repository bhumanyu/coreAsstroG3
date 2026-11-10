import { test, expect } from './fixtures/test';
import type { Page } from '@playwright/test';

async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
}

async function openBirthModal(page: Page): Promise<void> {
  await page.getByTitle('Edit Birth Details & Ayanamsa').click();
  await expect(page.getByRole('dialog', { name: 'Calculate Horoscope & Positions' })).toBeVisible();
}

test('E08-S05 corrupt profile storage is reported without breaking the active chart', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.localStorage.setItem('coreastro.chartProfiles', '{broken-json'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });

  await openBirthModal(page);
  await expect(page.getByRole('alert')).toContainText('Saved chart data is damaged');
  await expect(page.getByRole('heading', { name: 'Saved Chart Profiles' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible();
});

test('E08-S05 browser quota failure does not claim that a chart profile was saved', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string): void {
      if (key === 'coreastro.chartProfiles') {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    };
  });

  await openBirthModal(page);
  await page.getByRole('checkbox', { name: /save as chart profile/i }).check();
  await page.getByRole('button', { name: /calculate chart/i }).click();

  await expect(page.getByRole('alert')).toContainText('Browser storage is full');
  await expect(page.getByText(/The chart was still calculated/)).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S05 denied profile storage is surfaced while the chart remains usable', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string): string | null {
      if (key === 'coreastro.chartProfiles') {
        throw new DOMException('Storage access denied', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
  });

  await openBirthModal(page);
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable');
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible();
});

test('E08-S05 malformed share fragment is rejected without replacing current chart inputs', async ({ page }) => {
  await page.goto('/#chart=%%%not-a-valid-share-token%%%');
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });

  await expect(page.getByRole('alert')).toContainText('This share link is malformed.');
  await expect(page.getByText(/A shared chart is available to load/)).toHaveCount(0);

  await openBirthModal(page);
  await expect(page.getByRole('heading', { name: 'Saved Chart Profiles' })).toBeVisible();
});
