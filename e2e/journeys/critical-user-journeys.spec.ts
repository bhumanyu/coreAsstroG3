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

test('E08-S02 editing birth details recalculates rather than retaining the previous chart', async ({ page }) => {
  await openApp(page);
  await submitBirthDetails(page, { name: 'Chart A', dateTime: '1990-05-15T10:30', timeZone: 'Asia/Kolkata' });
  await openBirthDialog(page);
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('Chart B');
  await page.getByLabel('Birth date and time').fill('1991-06-16T11:31');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByText('Chart B', { exact: true }).first()).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('Chart A', { exact: true })).toHaveCount(0);
});

test('E08-S03 manual IANA timezone resolution is explicit before chart calculation', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.locator('#birth-time-zone').fill('');
  await expect(page.getByText(/Timezone is unresolved/)).toBeVisible();
  await page.locator('#birth-time-zone').fill('Asia/Kolkata');
  await expect(page.getByText(/Resolved instant:/)).toBeVisible();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S04 invalid birth date is blocked before analysis', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  const dateTime = page.getByLabel('Birth date and time');
  await dateTime.fill('');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  expect(await dateTime.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('E08-S05 ambiguous daylight-saving birth time requires the user to select the recorded offset', async ({ page }) => {
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

test('E08-EXTRA-01 completed chart is shown in Overview with its natal sign positions', async ({ page }) => {
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

test('E08-S08 Dasha page exposes the active temporal state', async ({ page }) => {
  await openApp(page);
  await navigate(page, 'Dasha & Timing');
  await expect(page.getByText('Select Dasha Period')).toBeVisible({ timeout: 60_000 });
});

test('E08-S09 past Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  // J2000 Astronomical Epoch values (previously a preset test profile)
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('J2000 Epoch');
  await page.getByLabel('Birth date and time').fill('2000-01-01T12:00');
  await page.locator('#birth-time-zone').fill('UTC');
  await page.getByPlaceholder('e.g. 23.1793').fill('51.4769');
  await page.getByPlaceholder('e.g. 75.7849').fill('0.0005');
  await page.getByRole('dialog').locator('select').selectOption('LAHIRI');
  // Fill place last: autocomplete results may overlay fields below it.
  await page.getByPlaceholder('e.g. Ujjain, Muzaffarpur, London...').fill('Greenwich, London, UK');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await selectPeriodByRelation(page, 'Past');
  await expect(page.getByText('PAST', { exact: true }).first()).toBeVisible();
});

test('E08-S10 current Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Current');
  await expect(page.getByText('CURRENT', { exact: true }).first()).toBeVisible();
});

test('E08-S11 future Mahadasha–Antardasha selection produces a qualified period report', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Future');
  await expect(page.getByText('FUTURE', { exact: true }).first()).toBeVisible();
});

test('E08-S12 Career-only partial evidence remains visible without requiring Wealth conclusions', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  // New Delhi Birth Chart values (previously a preset test profile)
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('Sample New Delhi');
  await page.getByLabel('Birth date and time').fill('1995-10-24T12:00');
  await page.locator('#birth-time-zone').fill('Asia/Kolkata');
  await page.getByPlaceholder('e.g. 23.1793').fill('28.6139');
  await page.getByPlaceholder('e.g. 75.7849').fill('77.2090');
  await page.getByRole('dialog').locator('select').selectOption('LAHIRI');
  // Fill place last: autocomplete results may overlay fields below it.
  await page.getByPlaceholder('e.g. Ujjain, Muzaffarpur, London...').fill('New Delhi, India');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await navigate(page, 'Career');
  await expect(page.getByRole('heading', { name: 'Career & Professional Trajectory' })).toBeVisible();
  await expect(page.locator('#career-pathways')).toContainText(/PARTIAL|UNAVAILABLE|NOT_IDENTIFIED|CONDITIONAL|INSUFFICIENT_DATA|UNRESOLVED/i);
});

test('E08-S13 Wealth-only partial evidence remains visible without requiring Career conclusions', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  // J2000 Astronomical Epoch values (previously a preset test profile)
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('J2000 Epoch');
  await page.getByLabel('Birth date and time').fill('2000-01-01T12:00');
  await page.locator('#birth-time-zone').fill('UTC');
  await page.getByPlaceholder('e.g. 23.1793').fill('51.4769');
  await page.getByPlaceholder('e.g. 75.7849').fill('0.0005');
  await page.getByRole('dialog').locator('select').selectOption('LAHIRI');
  // Fill place last: autocomplete results may overlay fields below it.
  await page.getByPlaceholder('e.g. Ujjain, Muzaffarpur, London...').fill('Greenwich, London, UK');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await navigate(page, 'Wealth');
  await expect(page.getByRole('heading', { name: 'Wealth & Financial Prosperity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hora (D2) Divisional Alignment' })).toBeVisible();
  await expect(page.getByText(/D2 calculation and interpretation have not passed independent validation/)).toBeVisible();
});

test('E08-S14 AI narrative unavailability does not replace selected-period deterministic analysis', async ({ page }) => {
  await openApp(page);
  await selectPeriodByRelation(page, 'Current');
  await expect(page.getByText('Selected Period Analysis')).toBeVisible();
  await expect(page.getByText(/AI Narrative Unavailable|AI Explanation|Partial Explanation/).first()).toBeVisible();
  await expect(page.getByText('Selected Period Analysis')).toBeVisible();
});

test('E08-S15 saved chart profiles survive reload and can be restored', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  await page.getByPlaceholder('e.g. CoreAstro Test Vector 1').fill('E08 Persistent Profile');
  await page.getByRole('checkbox', { name: /save as chart profile/i }).check();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await openBirthDialog(page);
  await page.getByRole('button', { name: 'E08 Persistent Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});

test('E08-S16 share-link recipient preview requires explicit load before replacing chart inputs', async ({ page }) => {
  // v1 payload: { version: 1, dateTimeStr: '2024-05-15T12:00:00Z', timeZone: 'UTC',
  //   latitude: 23.1793, longitude: 75.7849, ayanamsa: 'LAHIRI' } (default chart)
  const shareUrl = '/#chart=v1.eyJ2ZXJzaW9uIjoxLCJkYXRlVGltZVN0ciI6IjIwMjQtMDUtMTVUMTI6MDA6MDBaIiwidGltZVpvbmUiOiJVVEMiLCJsYXRpdHVkZSI6MjMuMTc5MywibG9uZ2l0dWRlIjo3NS43ODQ5LCJheWFuYW1zYSI6IkxBSElSSSJ9';
  const recipient = await page.context().newPage();
  await recipient.goto(shareUrl);
  await expect(recipient.getByText(/A shared chart is available to load/)).toBeVisible({ timeout: 120_000 });
  await recipient.getByRole('button', { name: 'Load shared chart inputs' }).click();
  await expect(recipient.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
  await recipient.close();
});

test('E08-S17 canonical chart and report JSON export produces a validated download', async ({ page }) => {
  await openApp(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chart and report JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-chart-export\.json$/);
  await expect(page.getByText('Validated chart JSON download initiated.')).toBeVisible();
});

test('E08-S18 Detailed Analysis includes the canonical Career and Wealth product report', async ({ page }) => {
  await openApp(page);
  await navigate(page, 'Detailed Analysis');
  await expect(page.getByRole('heading', { name: 'Career & Wealth Analysis' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('region', { name: 'Career — C11 conclusion' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toBeVisible();
});

test('E08-EXTRA-02 out-of-range birth coordinates are blocked and can be corrected', async ({ page }) => {
  await openApp(page);
  await openBirthDialog(page);
  const latitude = page.getByPlaceholder('e.g. 23.1793');
  await latitude.fill('100');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('dialog', { name: 'Calculate Horoscope & Positions' })).toBeVisible();
  await expect(page.getByText(/Latitude must be between -90 and 90/)).toBeVisible();
  await latitude.fill('23.1793');
  await page.getByRole('button', { name: 'Calculate Chart' }).click();
  await expect(page.getByRole('heading', { name: 'Unified Life Domain Analysis' })).toBeVisible({ timeout: 120_000 });
});
