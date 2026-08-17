import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { forbiddenAiContextKeys } from './aiContextPrivacy';
import { buildAiContext } from './aiContextFactory';

function collectKeys(obj: unknown, prefix = '', visited = new Set<unknown>()): string[] {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) {
    return [];
  }
  visited.add(obj);

  const keys: string[] = [];

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      keys.push(...collectKeys(obj[i], `${prefix}[${i}]`, visited));
    }
  } else {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      keys.push(key);
      keys.push(...collectKeys((obj as Record<string, unknown>)[key], fullPath, visited));
    }
  }

  return keys;
}

function containsReference(target: unknown, forbiddenRef: unknown, visited = new Set<unknown>()): boolean {
  if (!target || typeof target !== 'object' || visited.has(target)) {
    return false;
  }
  if (target === forbiddenRef) {
    return true;
  }
  visited.add(target);

  if (Array.isArray(target)) {
    for (const item of target) {
      if (containsReference(item, forbiddenRef, visited)) {
        return true;
      }
    }
  } else {
    for (const key of Object.keys(target as Record<string, unknown>)) {
      const val = (target as Record<string, unknown>)[key];
      if (containsReference(val, forbiddenRef, visited)) {
        return true;
      }
    }
  }

  return false;
}

describe('AI Context Sanitization & Privacy Boundary', () => {
  it('should contain all required forbidden keys in forbiddenAiContextKeys', () => {
    expect(forbiddenAiContextKeys.has('birthDetails')).toBe(true);
    expect(forbiddenAiContextKeys.has('latitude')).toBe(true);
    expect(forbiddenAiContextKeys.has('longitude')).toBe(true);
    expect(forbiddenAiContextKeys.has('birthTime')).toBe(true);
    expect(forbiddenAiContextKeys.has('dateOfBirth')).toBe(true);
    expect(forbiddenAiContextKeys.has('dob')).toBe(true);
    expect(forbiddenAiContextKeys.has('timeOfBirth')).toBe(true);
    expect(forbiddenAiContextKeys.has('birthPlace')).toBe(true);
    expect(forbiddenAiContextKeys.has('placeOfBirth')).toBe(true);
    expect(forbiddenAiContextKeys.has('rawChart')).toBe(true);
  });

  it('should not contain any forbidden keys anywhere in the projected AiContext structure', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = buildAiContext(horoscope);

    const allKeys = collectKeys(context);
    expect(allKeys.length).toBeGreaterThan(0);

    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of forbiddenAiContextKeys) {
        expect(lowerKey).not.toBe(forbidden.toLowerCase());
      }
    }
  });

  it('should not contain the horoscope object identity or nested references', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = buildAiContext(horoscope);

    expect(Object.values(context)).not.toContain(horoscope);
    expect(containsReference(context, horoscope)).toBe(false);
    expect(containsReference(context, horoscope.birthDetails)).toBe(false);
  });

  it('should deep-freeze the AiContext and all child nodes', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = buildAiContext(horoscope);

    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.ascendant)).toBe(true);
    expect(Object.isFrozen(context.planets)).toBe(true);
    expect(Object.isFrozen(context.houses)).toBe(true);
    expect(Object.isFrozen(context.yogas)).toBe(true);
    expect(Object.isFrozen(context.dasha)).toBe(true);
    expect(Object.isFrozen(context.divisional)).toBe(true);
    expect(Object.isFrozen(context.lifeThemes)).toBe(true);
    expect(Object.isFrozen(context.evidence)).toBe(true);
    expect(Object.isFrozen(context.source)).toBe(true);
    expect(Object.isFrozen(context.methodology)).toBe(true);

    if (context.career) {
      expect(Object.isFrozen(context.career)).toBe(true);
      expect(Object.isFrozen(context.career.supportingFactors)).toBe(true);
    }
    if (context.wealth) {
      expect(Object.isFrozen(context.wealth)).toBe(true);
      expect(Object.isFrozen(context.wealth.supportingFactors)).toBe(true);
    }
  });
});
