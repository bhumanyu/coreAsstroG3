import { describe, expect, it } from 'vitest';
import { formatDirection } from '../dashaFormat';

describe('Dasha direction formatter', () => {
  it('normalizes casing and whitespace and fails closed for unavailable values', () => {
    expect(formatDirection('  sUpPoRt  ')).toBe('Supporting');
    expect(formatDirection('UNAVAILABLE')).toBe('Unavailable');
    expect(formatDirection(undefined)).toBe('Unavailable');
    expect(formatDirection('')).toBe('Unavailable');
    expect(formatDirection('UNKNOWN_DIRECTION')).toBe('Unavailable');
  });
});
