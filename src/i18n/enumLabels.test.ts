import { describe, expect, it } from 'vitest';
import { ENUM_LABEL_KEYS, enumLabel, type EnumLabelFamily } from './enumLabels';
import { resources } from './resources';

function hasTranslation(language: 'en' | 'hi', key: string): boolean {
  let value: unknown = resources[language].enums;
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object' || !(segment in value)) return false;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string';
}

describe('canonical enum label registry', () => {
  it('has a non-empty English and Hindi translation for every registered enum member', () => {
    for (const family of Object.keys(ENUM_LABEL_KEYS) as EnumLabelFamily[]) {
      const familyMap = ENUM_LABEL_KEYS[family] as Readonly<Record<string, string>>;
      for (const [value, key] of Object.entries(familyMap)) {
        expect(hasTranslation('en', key), `en:${family}:${value}`).toBe(true);
        expect(hasTranslation('hi', key), `hi:${family}:${value}`).toBe(true);
      }
    }
  });

  it('returns localized known labels and raw values for unknown enum members', () => {
    expect(enumLabel((key) => `localized:${key}`, 'productDirection', 'SUPPORT'))
      .toBe('localized:productDirection.SUPPORT');
    expect(enumLabel((key) => `localized:${key}`, 'productDirection', 'FUTURE_DIRECTION'))
      .toBe('FUTURE_DIRECTION');
    expect(enumLabel((key) => `localized:${key}`, 'productDirection', undefined)).toBe('');
  });
});
