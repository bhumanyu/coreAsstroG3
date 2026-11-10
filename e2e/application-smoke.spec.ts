import { test, expect } from './fixtures/test';

test('production application starts in a clean browser profile', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'CoreAstro', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Product Navigation' })).toBeVisible();
  await expect(page.locator('button[title="Edit Birth Details & Ayanamsa"]')).toBeVisible();
});

test('product navigation remains interactive in the production browser build', async ({ page }) => {
  await page.goto('/');

  const careerNavigation = page.getByRole('button', { name: 'Career', exact: true });
  await expect(careerNavigation).toBeVisible();
  await careerNavigation.click();

  await expect(page.locator('main').last()).toContainText(/Career/i);
});

test('fresh browser context starts clean and reload preserves same-session storage', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('e2e-contamination'))).toBeNull();

  await page.evaluate(() => window.localStorage.setItem('e2e-contamination', 'same-session'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('e2e-contamination'))).toBe('same-session');
});
