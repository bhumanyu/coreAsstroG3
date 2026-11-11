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
  it.each(Object.keys(resources.en) as Array<keyof typeof resources.en>)('has matching non-empty %s keys', (namespace) => {
    const en = resources.en[namespace] as Record<string, unknown>;
    const hi = resources.hi[namespace] as Record<string, unknown>;
    expect(flattenKeys(hi)).toEqual(flattenKeys(en));

    const assertNonEmptyStrings = (value: Record<string, unknown>) => {
      for (const child of Object.values(value)) {
        if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
          assertNonEmptyStrings(child as Record<string, unknown>);
        } else if (typeof child === 'string') {
          expect(child).not.toBe('');
        }
      }
    };
    assertNonEmptyStrings(hi);
  });
});
