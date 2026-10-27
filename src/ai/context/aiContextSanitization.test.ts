import { describe, it, expect, beforeAll } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { forbiddenAiContextKeys } from './aiContextPrivacy';
import { buildAiContext, projectSelectedPeriodSynthesis } from './aiContextFactory';
import type { Horoscope } from '../../types';
import type { SelectedPeriodSynthesisValue } from '../../domain/synthesis/selectedPeriodSynthesis';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';

let horoscope: Horoscope;

beforeAll(() => {
  horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
}, 30000);

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
    const context = buildAiContext(horoscope);

    const allKeys = collectKeys(context);
    expect(allKeys.length).toBeGreaterThan(0);

    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of forbiddenAiContextKeys) {
        expect(lowerKey).not.toBe(forbidden.toLowerCase());
      }
    }
  }, 30000);

  it('should not contain the horoscope object identity or nested references', () => {
    const context = buildAiContext(horoscope);

    expect(Object.values(context)).not.toContain(horoscope);
    expect(containsReference(context, horoscope)).toBe(false);
    expect(containsReference(context, horoscope.birthDetails)).toBe(false);
  }, 30000);

  it('should deep-freeze the AiContext and all child nodes', () => {
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
      if (context.wealth.subthemes) {
        expect(Object.isFrozen(context.wealth.subthemes)).toBe(true);
        for (const st of context.wealth.subthemes) {
          expect(Object.isFrozen(st)).toBe(true);
        }
      }
    }
  }, 30000);

  describe('selectedPeriod projection', () => {
    it('should deep-freeze selectedPeriod context when present', () => {
      const mockSelectedPeriod: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> = {
        synthesisVersion: 'PBA-06-v1',
        period: {
          selectedPeriodId: 'test-period',
          mahadashaId: 'md-1',
          mahadashaPlanet: 'SATURN',
          antardashaId: 'ad-1',
          antardashaPlanet: 'JUPITER',
          interval: { start: '2025-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
          analysisAsOf: '2026-01-01T00:00:00Z',
          temporalRelation: 'CURRENT'
        },
        natalBaseline: {
          career: { baseline: {} as CareerConclusionData, unchanged: true },
          wealth: { baseline: {} as WealthConclusionData, unchanged: true }
        },
        career: {
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: [],
          diagnostics: []
        },
        wealth: {
          dimensions: {
            ACCUMULATION: {
              dimension: 'ACCUMULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            GAINS: {
              dimension: 'GAINS',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            FORTUNE: {
              dimension: 'FORTUNE',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            SPECULATION: {
              dimension: 'SPECULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            }
          },
          diagnostics: []
        },
        evidence: [],
        missingInputs: [],
        provenance: {
          career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
          wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
        }
      };

      const selectedPeriodContext = projectSelectedPeriodSynthesis(mockSelectedPeriod);

      expect(Object.isFrozen(selectedPeriodContext)).toBe(true);
      expect(Object.isFrozen(selectedPeriodContext.career)).toBe(true);
      expect(Object.isFrozen(selectedPeriodContext.wealth)).toBe(true);
      expect(Object.isFrozen(selectedPeriodContext.evidence)).toBe(true);
      expect(Object.isFrozen(selectedPeriodContext.wealth.dimensions)).toBe(true);
    });

    it('should not contain forbidden keys in selectedPeriod projection', () => {
      const mockSelectedPeriod: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> = {
        synthesisVersion: 'PBA-06-v1',
        period: {
          selectedPeriodId: 'test-period',
          mahadashaId: 'md-1',
          mahadashaPlanet: 'SATURN',
          antardashaId: 'ad-1',
          antardashaPlanet: 'JUPITER',
          interval: { start: '2025-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
          analysisAsOf: '2026-01-01T00:00:00Z',
          temporalRelation: 'CURRENT'
        },
        natalBaseline: {
          career: { baseline: {} as CareerConclusionData, unchanged: true },
          wealth: { baseline: {} as WealthConclusionData, unchanged: true }
        },
        career: {
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: [],
          diagnostics: []
        },
        wealth: {
          dimensions: {
            ACCUMULATION: {
              dimension: 'ACCUMULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            GAINS: {
              dimension: 'GAINS',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            FORTUNE: {
              dimension: 'FORTUNE',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            },
            SPECULATION: {
              dimension: 'SPECULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: [],
              linkageTrace: [],
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            }
          },
          diagnostics: []
        },
        evidence: [],
        missingInputs: [],
        provenance: {
          career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
          wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
        }
      };

      const selectedPeriodContext = projectSelectedPeriodSynthesis(mockSelectedPeriod);
      const allKeys = collectKeys(selectedPeriodContext);

      for (const key of allKeys) {
        const lowerKey = key.toLowerCase();
        for (const forbidden of forbiddenAiContextKeys) {
          expect(lowerKey).not.toBe(forbidden.toLowerCase());
        }
      }
    });
  });
});
