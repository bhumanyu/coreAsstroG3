import { test, expect } from '../fixtures/test';
import type { Page } from '@playwright/test';

async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
}

async function openBirthDialog(page: Page): Promise<void> {
  await page.locator('button[title="Edit Birth Details & Ayanamsa"]').click();
  await expect(page.getByRole('dialog', { name: 'Calculate Horoscope & Positions' })).toBeVisible();
}

async function submitBirthDetails(
  page: any,
  options: { dateTime?: string; timeZone?: string; name?: string } = {}
): Promise<void> {
  await openBirthDialog(page);
  if (options.name !== undefined) {
    await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill(options.name);
  }
  if (options.dateTime !== undefined) {
    await page.getByLabel('Birth date and time').fill(options.dateTime);
  }
  if (options.timeZone !== undefined) {
    await page.locator('#birth-time-zone').fill(options.timeZone);
  }
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
}

async function navigate(page: any, label: string): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
}

async function selectPeriodByRelation(page: any, relation: 'Past' | 'Current' | 'Future'): Promise<void> {
  await navigate(page, 'Dasha & Timing');
  await expect(page.getByText('Select Dasha Period')).toBeVisible({ timeout: 60_000 });

  const mahadasha = await page.locator('#mahadasha-select option').evaluateAll((options, wanted) => {
    const option = options.find(item => item.textContent?.includes(`(${wanted})`) && (item as HTMLOptionElement).value && !(item as HTMLOptionElement).disabled);
    return option ? (option as HTMLOptionElement).value : '';
  }, relation);
  expect(mahadasha, `No valid ${relation} Mahadasha is available in this chart.`).not.toBe('');

  await page.locator('#mahadasha-select').selectOption(mahadasha);
  const antardasha = await page.locator('#antardasha-select option').evaluateAll((options, wanted) => {
    const option = options.find(item => item.textContent?.includes(`(${wanted})`) && (item as HTMLOptionElement).value);
    return option ? (option as HTMLOptionElement).value : '';
  }, relation);
  expect(antardasha, `No valid ${relation} Antardasha is available under the selected Mahadasha.`).not.toBe('');

  await page.locator('#antardasha-select').selectOption(antardasha);
  await page.getByRole('button', { name: 'Analyze Selected Period' }).click();
  await expect(page.getByText('Selected Period Analysis')).toBeVisible({ timeout: 60_000 });
}

test('E08-S01 first-time user enters exact birth details and reaches the canonical overview', async ({ page }) => {
  await openApp(page);
  await submitBirthDetails(page, {
    name: 'First Time Browser Chart',
    dateTime: '1990-05-15T10:30',
    timeZone: 'Asia/Kolkata'
  });
  await expect(page.locator('[aria-label="Natal Chart Sign Positions"]')).toBeVisible();
});

test('E08-S02 manual IANA timezone resolution is explicit before chart calculation', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.locator('#birth-time-zone').fill('');
  await expect(page.getByText(/Timezone is unresolved/)).toBeVisible();
  await page.locator('#birth-time-zone').fill('Asia/Kolkata');
  await expect(page.getByText(/Resolved instant:/)).toBeVisible();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S03 invalid or missing birth date is blocked without replacing the current chart', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  const dateTime = page.getByLabel('Birth date and time');
  await dateTime.fill('');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  expect(await dateTime.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('E08-S04 ambiguous daylight-saving birth time requires the user to select the recorded offset', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.getByLabel('Birth date and time').fill('2025-11-02T01:30');
  await page.locator('#birth-time-zone').fill('America/New_York');
  await expect(page.getByText(/This local time occurs twice/)).toBeVisible();
  const ambiguity = page.locator('#birth-time-ambiguity');
  await expect(ambiguity).toBeVisible();
  await ambiguity.selectOption({ index: 1 });
  await expect(page.getByText(/Selected instant:/)).toBeVisible();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S05 completed chart is shown in Overview with its natal sign positions', async ({ page }) => {
  await openApp(page);
  await expect(page.getByLabel('Natal Chart Sign Positions')).toBeVisible();
  await expect(page.getByText('Ascendant', { exact: true })).toBeVisible();
  await expect(page.getByText('Moon Sign', { exact: true })).toBeVisible();
});

test('E08-S06 Career page renders the canonical C11 conclusion and evidence', async ({ page }) => {
  await openApp(page);
  await navigate(page, 'Career');
  await expect(page.getByRole('heading', { name: 'Career & Professional Trajectory' })).toBeVisible();
  await expect(page.getByText(/Evidence/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Integrated Vocational Synthesis|Career Conclusion/ })).toBeVisible();
});

test('E08-S07 Wealth page keeps D2 explicitly unavailable and shows canonical dimensions', async ({ page }) => {
  await openApp(page);
  await navigate(page, 'Wealth');
  await expect(page.getByRole('heading', { name: 'Wealth & Financial Prosperity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hora (D2) Divisional Alignment' })).toBeVisible();
  await expect(page.getByText(/D2 calculation and interpretation have not passed independent validation/)).toBeVisible();
  await expect(page.getByText(/Accumulation/i).first()).toBeVisible();
  await expect(page.getByText(/Speculation/i).first()).toBeVisible();
});

test('E08-S08 past Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  // The default 2024 test profile does not expose a past Mahadasha in the current
  // temporal horizon. Use the fixed J2000 profile to exercise a real past period.
  await openBirthDialog(page);
  await page.getByRole('button', { name: 'J2000 Astronomical Epoch' }).click();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await selectPeriodByRelation(page, 'Past');
  await expect(page.getByText('PAST', { exact: true }).first()).toBeVisible();
});

test('E08-S09 current Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Current');
  await expect(page.getByText('CURRENT', { exact: true }).first()).toBeVisible();
});

test('E08-S10 future Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Future');
  await expect(page.getByText('FUTURE', { exact: true }).first()).toBeVisible();
});

test('E08-S11 Career-only partial evidence remains visible without requiring Wealth conclusions', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.getByRole('button', { name: 'New Delhi Birth Chart' }).click();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await navigate(page, 'Career');
  await expect(page.getByRole('heading', { name: 'Career & Professional Trajectory' })).toBeVisible();
  await expect(page.locator('#career-pathways')).toContainText(/PARTIAL|UNAVAILABLE|NOT_IDENTIFIED|CONDITIONAL|INSUFFICIENT_DATA|UNRESOLVED/i);
});

test('E08-S12 Wealth-only partial evidence remains visible without requiring Career conclusions', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.getByRole('button', { name: 'J2000 Astronomical Epoch' }).click();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await navigate(page, 'Wealth');
  await expect(page.getByRole('heading', { name: 'Wealth & Financial Prosperity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hora (D2) Divisional Alignment' })).toBeVisible();
  await expect(page.getByText(/D2 calculation and interpretation have not passed independent validation/)).toBeVisible();
});

test('E08-S13 AI narrative unavailability does not replace selected-period deterministic analysis', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Current');
  await expect(page.getByText('Selected Period Analysis')).toBeVisible();
  await expect(page.getByText(/AI Narrative Unavailable|AI Explanation|Partial Explanation/).first()).toBeVisible();
  await expect(page.getByText('Selected Period Analysis')).toBeVisible();
});

test('E08-S14 saved chart profiles survive reload and can be restored', async ({ page }) => {
  await openApp(page);
  await page.getByLabel('Profile name').fill('E08 Persistent Profile');
  await page.getByRole('button', { name: 'Save current chart' }).click();
  await expect(page.getByText('Saved "E08 Persistent Profile" on this browser/device.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('E08 Persistent Profile')).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).last().click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S15 share-link recipient preview requires explicit load before replacing chart inputs', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Create share link' }).click();
  const shareUrl = await page.getByLabel('Created share link').inputValue();
  expect(shareUrl).toContain('#chart=');
  const recipient = await page.context().newPage();
  await recipient.goto(shareUrl);
  await expect(recipient.getByText(/A shared chart is available to load/)).toBeVisible();
  await recipient.getByRole('button', { name: 'Load shared chart inputs' }).click();
  await expect(recipient.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await recipient.close();
});

test('E08-S16 canonical chart and report JSON export produces a validated download', async ({ page }) => {
  await openApp(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chart and report JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-chart-export\.json$/);
  await expect(page.getByText('Validated chart JSON download initiated.')).toBeVisible();
});

test('E08-S17 Detailed Analysis includes the canonical Career and Wealth product report', async ({ page }) => {
  await openApp(page);
  await navigate(page, 'Detailed Analysis');
  await expect(page.getByRole('heading', { name: 'Career & Wealth Analysis' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('region', { name: 'Career — C11 conclusion' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toBeVisible();
});

test('E08-S18 failed out-of-range calculation can be corrected and recalculated', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('Out of Range Engine Test');
  await page.getByLabel('Birth date and time').fill('0001-01-01T00:00');
  await page.locator('#birth-time-zone').fill('UTC');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  // This is rejected at birth-input validation; it must not reach the astronomy
  // engine or replace the currently displayed chart.
  await expect(page.getByRole('dialog', { name: 'Calculate Horoscope & Positions' })).toBeVisible();
  await expect(page.getByText(/Invalid birth datetime:/)).toBeVisible();
  await page.getByLabel('Birth date and time').fill('2000-01-01T12:00');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});
