import { describe, expect, it } from 'vitest';
import { parseInstant, validateInterval } from './temporalInterval';

describe('validateInterval', () => {
  it('accepts intervals starting at the Unix epoch', () => {
    expect(validateInterval(
      '1970-01-01T00:00:00.000Z',
      '1970-01-02T00:00:00.000Z'
    )).toBe(true);
  });
});

describe('parseInstant strict ISO validation', () => {
  it('rejects impossible calendar dates that Date.parse would normalize', () => {
    expect(parseInstant('2024-02-30T00:00:00.000Z')).toBeNull();
    expect(parseInstant('2023-02-29T00:00:00.000Z')).toBeNull();
    expect(parseInstant('2024-13-01T00:00:00.000Z')).toBeNull();
    expect(parseInstant('2024-02-30')).toBeNull();
  });

  it('rejects impossible clock values and malformed offsets', () => {
    expect(parseInstant('2024-01-01T24:00:00.000Z')).toBeNull();
    expect(parseInstant('2024-01-01T12:60:00.000Z')).toBeNull();
    expect(parseInstant('2024-01-01T12:00:00+25:00')).toBeNull();
    expect(parseInstant('2024-01-01T12:00:00')).toBeNull();
  });

  it('accepts valid leap days, date-only values and explicit offsets', () => {
    expect(parseInstant('2024-02-29T12:00:00.000Z')).not.toBeNull();
    expect(parseInstant('2024-02-29')).toBe(Date.parse('2024-02-29T00:00:00.000Z'));
    expect(parseInstant('1988-05-08T09:30:00+05:30')).toBe(Date.parse('1988-05-08T09:30:00+05:30'));
  });
});
