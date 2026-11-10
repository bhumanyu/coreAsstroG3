import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Each test receives a fresh browser context. Clear persisted application
    // state before the app's first navigation in that context.
    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem('__coreastro_e2e_context_initialized')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('__coreastro_e2e_context_initialized', 'true');
      }
    });
    await page.clock.install({ time: new Date('2026-11-10T09:00:00+05:30') });
    await use(page);
  }
});

export { expect };
