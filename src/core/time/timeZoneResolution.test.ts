import { describe, expect, it } from 'vitest';
import { isValidIanaTimeZone, resolveLocalDateTime } from './timeZoneResolution';

describe('resolveLocalDateTime', () => {
  it('resolves an ordinary local time to exactly one instant', () => {
    expect(resolveLocalDateTime('1988-05-08T09:30:00', 'Asia/Kolkata')).toEqual({
      status: 'UNIQUE',
      candidates: [{ instant: '1988-05-08T04:00:00.000Z', offsetMinutes: 330, offsetLabel: 'UTC+05:30' }]
    });
  });

  it('returns AMBIGUOUS for the repeated autumn DST hour', () => {
    const result = resolveLocalDateTime('2024-11-03T01:30:00', 'America/New_York');
    expect(result.status).toBe('AMBIGUOUS');
    if (result.status !== 'AMBIGUOUS') return;
    expect(result.candidates.map((candidate) => candidate.instant)).toEqual([
      '2024-11-03T05:30:00.000Z',
      '2024-11-03T06:30:00.000Z'
    ]);
    expect(result.candidates.map((candidate) => candidate.offsetLabel)).toEqual(['UTC-04:00', 'UTC-05:00']);
  });

  it('returns NONEXISTENT for the skipped spring DST hour', () => {
    expect(resolveLocalDateTime('2024-03-10T02:30:00', 'America/New_York')).toEqual({
      status: 'NONEXISTENT',
      candidates: []
    });
  });

  it('rejects impossible calendar dates instead of normalizing them', () => {
    expect(resolveLocalDateTime('2024-02-30T12:00', 'UTC').status).toBe('INVALID');
    expect(resolveLocalDateTime('2023-02-29T12:00', 'UTC').status).toBe('INVALID');
    expect(resolveLocalDateTime('2024-02-29T12:00', 'UTC').status).toBe('UNIQUE');
  });

  it('rejects invalid wall-clock fields and timezone identifiers', () => {
    expect(resolveLocalDateTime('2024-01-01T24:00', 'UTC').status).toBe('INVALID');
    expect(resolveLocalDateTime('2024-01-01T12:00', 'Mars/Olympus').status).toBe('INVALID');
    expect(isValidIanaTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidIanaTimeZone('')).toBe(false);
  });
});
