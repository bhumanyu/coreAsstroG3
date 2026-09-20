import { describe, it, expect } from 'vitest';
import { zonedWallClockToUtcISO } from '../BirthFormModal';

describe('zonedWallClockToUtcISO', () => {
  it('throws on invalid local date: 2024-02-31T12:00', () => {
    expect(() => zonedWallClockToUtcISO('2024-02-31T12:00', 'UTC')).toThrow('Invalid day');
  });

  it('throws on invalid month: 2024-13-01T12:00', () => {
    expect(() => zonedWallClockToUtcISO('2024-13-01T12:00', 'UTC')).toThrow('Invalid month');
  });

  it('throws on invalid hour: 2024-01-01T24:00', () => {
    expect(() => zonedWallClockToUtcISO('2024-01-01T24:00', 'UTC')).toThrow('Invalid hour');
  });

  it('throws on invalid minute: 2024-01-01T12:60', () => {
    expect(() => zonedWallClockToUtcISO('2024-01-01T12:60', 'UTC')).toThrow('Invalid minute');
  });

  it('throws on invalid second: 2024-01-01T12:00:60', () => {
    expect(() => zonedWallClockToUtcISO('2024-01-01T12:00:60', 'UTC')).toThrow('Invalid second');
  });

  it('accepts valid leap year date: 2024-02-29T12:00', () => {
    expect(() => zonedWallClockToUtcISO('2024-02-29T12:00', 'UTC')).not.toThrow();
  });

  it('accepts valid local date: 2024-01-15T12:00', () => {
    const result = zonedWallClockToUtcISO('2024-01-15T12:00', 'UTC');
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
