import { describe, expect, it } from 'vitest';
import { createDomainEvidence } from '../../interpretation/DomainEvidence';
import { assessWealthRiskAndConfidence } from './wealthRiskConfidence';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';

function ev(id: string, family: string, polarity: 'SUPPORTING' | 'CHALLENGING' | 'CONFLICTING', dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION' = 'ACCUMULATION'): DomainEvidence {
  return createDomainEvidence({
    id,
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: id,
    polarity,
    strength: 'STRONG',
    priority: 90,
    ruleId: `RULE_${id}`,
    relatedEvidenceIds: [],
    evidenceFamily: family as never,
    dimension
  });
}

const completeAccumulation = [
  ev('acc-house', 'SECOND_HOUSE', 'SUPPORTING'),
  ev('acc-lord', 'SECOND_LORD', 'SUPPORTING')
];

describe('CW-05C Wealth risk and confidence qualification', () => {
  it('classifies complete, unchallenged dimension as LOW risk', () => {
    const result = assessWealthRiskAndConfidence({ evidence: completeAccumulation });
    expect(result.dimensions.ACCUMULATION.classification).toBe('LOW');
    expect(result.dimensions.ACCUMULATION.reasons.length).toBeGreaterThan(0);
  });

  it('classifies one challenge among otherwise supportive evidence as MODERATE risk', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [
      completeAccumulation[0],
      ev('acc-lord-challenge', 'SECOND_LORD', 'CHALLENGING')
    ] });
    expect(result.dimensions.ACCUMULATION.classification).toBe('MODERATE');
  });

  it('classifies a genuinely mixed evidence set as ELEVATED risk', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [
      ...completeAccumulation,
      ev('acc-house-challenge', 'SECOND_HOUSE', 'CHALLENGING')
    ] });
    expect(result.dimensions.ACCUMULATION.classification).toBe('ELEVATED');
  });

  it('uses INSUFFICIENT_DATA when a required family is missing', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [ev('only-house', 'SECOND_HOUSE', 'SUPPORTING')] });
    expect(result.dimensions.ACCUMULATION.classification).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions.ACCUMULATION.reasons.some(reason => reason.code === 'REQUIRED_EVIDENCE_FAMILY_MISSING')).toBe(true);
  });

  it('does not infer high risk from missing data or D2 unavailability', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [], d2Availability: 'UNAVAILABLE' });
    expect(result.dimensions.ACCUMULATION.classification).toBe('INSUFFICIENT_DATA');
    expect(result.confidence.d2Availability).toBe('UNAVAILABLE');
  });

  it('keeps speculation evidence isolated from accumulation risk', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [
      ...completeAccumulation,
      ev('spec-challenge', 'FIFTH_LORD', 'CHALLENGING', 'SPECULATION')
    ] });
    expect(result.dimensions.ACCUMULATION.classification).toBe('LOW');
    expect(result.dimensions.SPECULATION.classification).toBe('INSUFFICIENT_DATA');
  });

  it('reflects conflicting evidence in reasons and confidence diagnostics', () => {
    const result = assessWealthRiskAndConfidence({ evidence: [
      ...completeAccumulation,
      ev('acc-conflict', 'SECOND_LORD', 'CONFLICTING')
    ] });
    expect(result.dimensions.ACCUMULATION.classification).toBe('ELEVATED');
    expect(result.confidence.conflictEvidenceIds).toContain('acc-conflict');
  });

  it('is deterministic for identical inputs and does not project probability fields', () => {
    const input = { evidence: completeAccumulation };
    const first = assessWealthRiskAndConfidence(input);
    const second = assessWealthRiskAndConfidence(input);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).not.toMatch(/probability|percent|percentage|likelihoodScore/i);
  });

  it('surfaces producer errors as confidence blockers, not risk evidence', () => {
    const result = assessWealthRiskAndConfidence({
      evidence: completeAccumulation,
      producerDiagnostics: [{ code: 'WEALTH_RULE_FAILED', severity: 'ERROR', message: 'rule failed' }]
    });
    expect(result.confidence.blockingDiagnosticCodes).toContain('WEALTH_RULE_FAILED');
    expect(result.dimensions.ACCUMULATION.classification).toBe('LOW');
  });
});
