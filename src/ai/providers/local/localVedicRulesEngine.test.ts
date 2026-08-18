import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { Planet, Sign } from '../../../types';
import { buildAiContext } from '../../context/aiContextFactory';
import { reasonWithLocalRules, TASK_DOMAIN } from './localVedicRulesEngine';
import {
  CAREER_RULES,
  WEALTH_RULES,
  DASHA_RULES,
  CHART_SYNTHESIS_RULES
} from './rules';
import type { AiTask } from '../../types/aiRequestTypes';
import type { AiContext, AiEvidence } from '../../types/aiContextTypes';

describe('localVedicRulesEngine', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = buildAiContext(horoscope);

  it('should have an exhaustive TASK_DOMAIN mapping for all six tasks', () => {
    const tasks: readonly AiTask[] = [
      'CHART_SYNTHESIS',
      'CAREER_ANALYSIS',
      'WEALTH_ANALYSIS',
      'DASHA_ANALYSIS',
      'LIFE_THEME_ANALYSIS',
      'GENERAL_QUERY'
    ];

    for (const task of tasks) {
      expect(TASK_DOMAIN[task]).toBeDefined();
    }
  });

  it('should reason deterministically across multiple evaluations', () => {
    const run1 = reasonWithLocalRules('CAREER_ANALYSIS', context);
    const run2 = reasonWithLocalRules('CAREER_ANALYSIS', context);

    expect(run1).toEqual(run2);
  });

  it('should include career status, natal promise, and D10 relationship in career conclusion', () => {
    const result = reasonWithLocalRules('CAREER_ANALYSIS', context);

    expect(context.career).toBeDefined();
    if (context.career) {
      expect(result.conclusion).toContain(context.career.status);
      expect(result.conclusion).toContain(context.career.natalPromise);
      expect(result.conclusion).toContain(context.career.d10Relationship);
    }
  });

  it('should only return evidence IDs that exist in context.evidence', () => {
    const tasks: readonly AiTask[] = [
      'CHART_SYNTHESIS',
      'CAREER_ANALYSIS',
      'WEALTH_ANALYSIS',
      'DASHA_ANALYSIS',
      'LIFE_THEME_ANALYSIS',
      'GENERAL_QUERY'
    ];

    const validEvidenceIds = new Set(context.evidence.map((e) => e.id));

    for (const task of tasks) {
      const result = reasonWithLocalRules(task, context);

      for (const id of result.supportingEvidenceIds) {
        expect(validEvidenceIds.has(id)).toBe(true);
      }
      for (const id of result.challengingEvidenceIds) {
        expect(validEvidenceIds.has(id)).toBe(true);
      }
    }
  });

  it('should include total evidence count string in chart synthesis conclusion', () => {
    const result = reasonWithLocalRules('CHART_SYNTHESIS', context);

    expect(result.conclusion).toContain(String(context.evidence.length));
    expect(result.triggeredRuleIds.length).toBeGreaterThan(0);
  });

  it('should execute wealth analysis rules properly', () => {
    const result = reasonWithLocalRules('WEALTH_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-WEALTH'))).toBe(true);
  });

  it('should execute dasha analysis rules properly', () => {
    const result = reasonWithLocalRules('DASHA_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-DASHA'))).toBe(true);
  });

  it('should execute life theme analysis rules properly', () => {
    const result = reasonWithLocalRules('LIFE_THEME_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-THEME'))).toBe(true);
  });

  it('should produce ranked, frozen results with triggeredRuleIds', () => {
    const result = reasonWithLocalRules('GENERAL_QUERY', context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.supportingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.challengingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.triggeredRuleIds)).toBe(true);
    expect(Object.isFrozen(result.warnings)).toBe(true);
  });

  it('should not fabricate SUPPORT in LOCAL-CHART-002 when evidence is predominantly challenging', () => {
    const chartRule002 = CHART_SYNTHESIS_RULES.find((r) => r.id === 'LOCAL-CHART-002');
    expect(chartRule002).toBeDefined();

    // Construct artificial context with only challenging ascendant lord evidence
    const mockContext: AiContext = {
      ...context,
      ascendant: { sign: Sign.ARIES, lord: Planet.MARS },
      planets: Object.freeze([
        {
          planet: Planet.MARS,
          sign: Sign.CANCER,
          house: 4,
          strengthStatus: 'DEBILITATED',
          functionalRoles: Object.freeze(['LAGNA_LORD']),
          ownedHouses: Object.freeze([1, 8])
        }
      ]),
      evidence: Object.freeze([
        {
          id: 'ev-test-asc-lord-debilitated',
          source: 'PLANET',
          dimension: 'NATAL_STRUCTURE',
          statement: 'Mars is debilitated',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: Object.freeze([Planet.MARS])
        } as AiEvidence
      ])
    };

    const evalResult = chartRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('CHALLENGE');
  });

  it('should not fabricate SUPPORT in LOCAL-DASHA-002 when timing evidence has 0 supporting and 0 challenging', () => {
    const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
    expect(dashaRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      evidence: Object.freeze([
        {
          id: 'ev-test-neutral-timing',
          source: 'DASHA',
          dimension: 'TIMING',
          statement: 'Neutral timing cycle',
          effect: 'NEUTRAL',
          strength: 'MODERATE',
          priority: 'TIMING'
        } as AiEvidence
      ])
    };

    const evalResult = dashaRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
  });

  it('should not treat UNKNOWN status yogas as SUPPORT in LOCAL-WEALTH-003', () => {
    const wealthRule003 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-003');
    expect(wealthRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      yogas: Object.freeze([
        {
          type: 'DHANA_YOGA',
          category: 'DHANA',
          status: 'UNKNOWN',
          planets: Object.freeze([Planet.JUPITER]),
          houses: Object.freeze([2, 11])
        }
      ]),
      evidence: Object.freeze([])
    };

    const evalResult = wealthRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
  });

  it('should scope career D10 conflict rule ONLY to vargaRelationship === CONFLICTS', () => {
    const careerRule002 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-002');
    expect(careerRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      career: {
        status: 'CHALLENGED',
        natalPromise: 'MIXED',
        d10Relationship: 'CONFLICTS',
        confidence: 'HIGH',
        supportingFactors: Object.freeze([]),
        challengingFactors: Object.freeze(['conflicting varga'])
      },
      evidence: Object.freeze([
        {
          id: 'ev-d10-confirm',
          source: 'D10',
          dimension: 'CONFIRMATION',
          statement: 'D10 reinforces position',
          effect: 'SUPPORT',
          strength: 'STRONG',
          vargaRelationship: 'CONFIRMS'
        } as AiEvidence,
        {
          id: 'ev-d10-conflict',
          source: 'D10',
          dimension: 'CONFIRMATION',
          statement: 'D10 clashes with lagna',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          vargaRelationship: 'CONFLICTS'
        } as AiEvidence
      ])
    };

    const evalResult = careerRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.challengingEvidenceIds).toContain('ev-d10-conflict');
    expect(evalResult.challengingEvidenceIds).not.toContain('ev-d10-confirm');
  });
});
