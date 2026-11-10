import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Each test receives a fresh browser context. Clear persisted application
    // state before the app's first navigation in that context.
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.clock.install({ time: new Date('2026-11-10T09:00:00+05:30') });
    await use(page);
  }
});

export { expect };
