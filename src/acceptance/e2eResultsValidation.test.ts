import { describe, expect, it } from 'vitest';
import { REQUIRED_E08_JOURNEY_IDS, validateE2eResultsReport } from './e2eResultsValidation';

function report(ids = REQUIRED_E08_JOURNEY_IDS, stats = { expected: 18, skipped: 0, unexpected: 0, flaky: 0 }) {
  return {
    stats,
    suites: [{
      title: 'critical-user-journeys.spec.ts',
      specs: ids.map(id => ({ title: `${id} acceptance journey`, tests: [{ results: [{ status: 'expected' }] }] }))
    }]
  };
}

describe('E08 browser journey evidence validation', () => {
  it('requires all 18 critical journey IDs and clean execution statistics', () => {
    expect(validateE2eResultsReport(report())).toEqual([]);
  });

  it('fails when any required journey is missing even if the remaining tests pass', () => {
    const errors = validateE2eResultsReport(report(REQUIRED_E08_JOURNEY_IDS.slice(1), {
      expected: 17, skipped: 0, unexpected: 0, flaky: 0
    }));
    expect(errors.some(error => error.includes('Missing required browser journey IDs: E08-S01'))).toBe(true);
  });

  it('fails on skipped, unexpected or flaky browser results', () => {
    const errors = validateE2eResultsReport(report(REQUIRED_E08_JOURNEY_IDS, {
      expected: 18, skipped: 1, unexpected: 1, flaky: 1
    }));
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('skipped test'),
      expect.stringContaining('unexpected test'),
      expect.stringContaining('flaky test')
    ]));
  });

  it('rejects malformed reports and undersized suites', () => {
    expect(validateE2eResultsReport(null)).toContain('Browser acceptance report must be an object.');
    expect(validateE2eResultsReport({ stats: { expected: 1, skipped: 0, unexpected: 0, flaky: 0 }, suites: [] }))
      .toContain('Only 1 browser tests executed; at least 18 are required.');
  });
});
