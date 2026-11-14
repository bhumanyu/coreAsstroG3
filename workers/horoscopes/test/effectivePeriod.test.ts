import { describe, expect, it } from 'vitest';
import { getEffectivePeriod } from '../src/effectivePeriod';

describe('getEffectivePeriod', () => {
  it('resolves a daily period using the requested timezone date', () => {
    const utcMoment = new Date('2026-01-05T00:30:00Z');
    expect(getEffectivePeriod('daily', 'America/Los_Angeles', utcMoment)).toEqual({
      key: '2026-01-04',
      startDate: '2026-01-04',
      endDate: '2026-01-04'
    });
    expect(getEffectivePeriod('daily', 'Asia/Kolkata', utcMoment).key).toBe('2026-01-05');
  });

  it('uses ISO week buckets and Monday-to-Sunday dates', () => {
    expect(getEffectivePeriod('weekly', 'UTC', new Date('2026-01-01T12:00:00Z'))).toEqual({
      key: '2026-W01',
      startDate: '2025-12-29',
      endDate: '2026-01-04'
    });
  });

  it('uses the timezone-local month and year boundaries', () => {
    const date = new Date('2026-03-01T01:00:00Z');
    expect(getEffectivePeriod('monthly', 'America/Los_Angeles', date)).toEqual({
      key: '2026-02',
      startDate: '2026-02-01',
      endDate: '2026-02-28'
    });
    expect(getEffectivePeriod('yearly', 'UTC', date)).toEqual({
      key: '2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    });
  });
});
