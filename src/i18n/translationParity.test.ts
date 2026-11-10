import { describe, expect, it } from 'vitest';
import { resources } from './resources';

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      return flattenKeys(child as Record<string, unknown>, path);
    }
    return [path];
  }).sort();
}

describe('English/Hindi localization resource parity', () => {
  it.each(['common', 'navigation', 'settings'])('has matching non-empty %s keys', (namespace) => {
    const en = resources.en[namespace as keyof typeof resources.en] as Record<string, unknown>;
    const hi = resources.hi[namespace as keyof typeof resources.hi] as Record<string, unknown>;
    expect(flattenKeys(hi)).toEqual(flattenKeys(en));
    for (const value of Object.values(hi)) {
      expect(value).not.toBe('');
    }
  });
});
