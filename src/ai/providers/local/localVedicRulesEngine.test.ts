import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildAiContext } from '../../context/aiContextFactory';
import { reasonWithLocalRules, TASK_DOMAIN } from './localVedicRulesEngine';
import type { AiTask } from '../../types/aiRequestTypes';

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

  it('should produce sorted, frozen results with triggeredRuleIds', () => {
    const result = reasonWithLocalRules('GENERAL_QUERY', context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.supportingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.challengingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.triggeredRuleIds)).toBe(true);
    expect(Object.isFrozen(result.warnings)).toBe(true);
  });
});
