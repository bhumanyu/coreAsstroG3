import { describe, expect, it } from 'vitest';
import { zonedWallClockToUtcISO, utcISOToZonedWallClock } from './BirthFormModal';

describe('BirthFormModal timezone conversion', () => {
  it('converts a unique local time to its exact UTC instant', () => {
    expect(zonedWallClockToUtcISO('1988-05-08T09:30:00', 'Asia/Kolkata'))
      .toBe('1988-05-08T04:00:00.000Z');
  });

  it('refuses to guess between repeated DST wall-clock times', () => {
    expect(() => zonedWallClockToUtcISO('2024-11-03T01:30:00', 'America/New_York'))
      .toThrow(/occurs twice/i);
  });

  it('rejects nonexistent DST wall-clock times', () => {
    expect(() => zonedWallClockToUtcISO('2024-03-10T02:30:00', 'America/New_York'))
      .toThrow(/does not exist/i);
  });

  it('does not convert an instant when timezone is unresolved', () => {
    expect(utcISOToZonedWallClock('1988-05-08T04:00:00.000Z', '')).toBe('');
  });
});
