import { test, expect } from './fixtures/test';

test('production application starts in a clean browser profile', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'CoreAstro', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Product Navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Birth Chart' })).toBeVisible();
});

test('product navigation remains interactive in the production browser build', async ({ page }) => {
  await page.goto('/');

  const careerNavigation = page.getByRole('button', { name: 'Career', exact: true });
  await expect(careerNavigation).toBeVisible();
  await careerNavigation.click();

  await expect(page.locator('main')).toContainText(/Career/i);
});
