import { describe, expect, it } from 'vitest';
import { formatConfidence, formatDirection } from '../wealthFormat';

describe('Wealth direction formatter', () => {
  it('normalizes casing and whitespace and fails closed for unavailable values', () => {
    expect(formatDirection('  sUpPoRt  ')).toBe('Supporting');
    expect(formatDirection('UNAVAILABLE')).toBe('Unavailable');
    expect(formatDirection(undefined)).toBe('Unavailable');
    expect(formatDirection('')).toBe('Unavailable');
    expect(formatDirection('UNKNOWN_DIRECTION')).toBe('Unavailable');
  });
});

describe('Wealth confidence formatter', () => {
  it('formats UNAVAILABLE without exposing the enum key', () => {
    expect(formatConfidence('UNAVAILABLE')).toBe('Unavailable');
  });
});
