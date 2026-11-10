import { describe, expect, it } from 'vitest';
import { formatCurrencyINR, formatDate, formatNumber } from './localeUtils';

describe('locale utilities', () => {
  it('uses Western digits for Hindi number formatting', () => {
    expect(formatNumber(123456.78, 'hi')).toMatch(/[0-9]/);
    expect(formatNumber(123456.78, 'hi')).not.toMatch(/[०-९]/);
  });

  it('formats INR in both supported locales', () => {
    expect(formatCurrencyINR(1234, 'en')).toContain('1,234');
    expect(formatCurrencyINR(1234, 'hi')).toMatch(/[0-9]/);
    expect(formatCurrencyINR(1234, 'hi')).not.toMatch(/[०-९]/);
  });

  it('returns an empty value for invalid dates and non-finite numbers', () => {
    expect(formatDate('not-a-date', 'en')).toBe('');
    expect(formatNumber(Number.NaN, 'hi')).toBe('');
  });
});
