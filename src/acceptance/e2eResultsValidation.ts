export const REQUIRED_E08_JOURNEY_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 18 }, (_, index) => `E08-S${String(index + 1).padStart(2, '0')}`)
);

function collectTitles(value: unknown, titles: string[] = [], visited = new Set<object>()): string[] {
  if (!value || typeof value !== 'object' || visited.has(value)) return titles;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach(item => collectTitles(item, titles, visited));
    return titles;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.title === 'string') titles.push(record.title);
  Object.values(record).forEach(item => collectTitles(item, titles, visited));
  return titles;
}

/** Validates both Playwright execution health and the complete required E08 journey inventory. */
export function validateE2eResultsReport(value: unknown): readonly string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['Browser acceptance report must be an object.'];
  }
  const report = value as Record<string, unknown>;
  const stats = report.stats as Record<string, unknown> | undefined;
  const errors: string[] = [];
  if (!stats || !Number.isInteger(stats.expected) || !Number.isInteger(stats.skipped)
    || !Number.isInteger(stats.unexpected) || !Number.isInteger(stats.flaky)) {
    return ['Browser acceptance report does not contain the required Playwright execution statistics.'];
  }

  const executed = Number(stats.expected) + Number(stats.unexpected) + Number(stats.flaky);
  if (executed < REQUIRED_E08_JOURNEY_IDS.length) {
    errors.push(`Only ${executed} browser tests executed; at least ${REQUIRED_E08_JOURNEY_IDS.length} are required.`);
  }
  if (stats.skipped !== 0) errors.push(`Required browser acceptance suite contains ${stats.skipped} skipped test(s).`);
  if (stats.unexpected !== 0) errors.push(`Browser acceptance suite contains ${stats.unexpected} unexpected test result(s).`);
  if (stats.flaky !== 0) errors.push(`Browser acceptance suite contains ${stats.flaky} flaky test result(s).`);

  const titles = collectTitles(report);
  const discoveredIds = new Set<string>();
  for (const title of titles) {
    for (const match of title.matchAll(/\bE08-S\d{2}\b/g)) discoveredIds.add(match[0]);
  }
  const missing = REQUIRED_E08_JOURNEY_IDS.filter(id => !discoveredIds.has(id));
  if (missing.length > 0) errors.push(`Missing required browser journey IDs: ${missing.join(', ')}.`);
  return errors;
}
