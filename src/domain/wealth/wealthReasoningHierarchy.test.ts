import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretWealthV2 } from './WealthDomainInterpreterV2';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import { evaluateWealthReasoningHierarchy } from './wealthReasoningHierarchy';

describe('Wealth Reasoning Hierarchy (Golden Scenarios W1-W6 & CW-01 Validation)', () => {
  const canonicalHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
    asOf: '2024-06-01T00:00:00.000Z'
  });

  it('X1: Legacy path remains default when options is omitted or LEGACY', () => {
    const legacyResult1 = interpretWealthV2(canonicalHoroscope);
    const legacyResult2 = interpretWealthV2(canonicalHoroscope, { strategy: 'LEGACY' });

    expect(legacyResult1.domain).toBe('WEALTH');
    expect(legacyResult1.reasoningVersion).toBeUndefined();
    expect(legacyResult2.domain).toBe('WEALTH');
    expect(legacyResult2.reasoningVersion).toBeUndefined();
    expect(legacyResult1.conclusion.strength).toBe(legacyResult2.conclusion.strength);
  });

  it('X2: CW01 strategy returns valid reasoning trace and CW-01 version on canonical chart', () => {
    const cw01Result = interpretWealthV2(canonicalHoroscope, { strategy: 'CW01' });

    expect(cw01Result.domain).toBe('WEALTH');
    expect(cw01Result.reasoningVersion).toBe('CW-01');
    expect(cw01Result.reasoningTrace).toBeDefined();
    expect(cw01Result.reasoningTrace?.primaryPromise).toBeDefined();
    expect(cw01Result.conclusionData?.currentActivation).toBeDefined();
    expect(cw01Result.conclusionData?.currentPressure).toBeDefined();
  });

  it('W1: Strong 2H/2L + Strong 11H/11L + Supportive Jupiter yields STRONG/VERY_STRONG overall wealth', () => {
    const ev2H = createDomainEvidence({
      id: 'EV_2H_STRONG',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house of wealth accumulation is strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'WEALTH_2H_STRONG_001',
      dimension: 'ACCUMULATION'
    });

    const ev11H = createDomainEvidence({
      id: 'EV_11H_STRONG',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '11th house of recurrent gains is strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'WEALTH_11H_STRONG_001',
      dimension: 'GAINS'
    });

    const evJupiter = createDomainEvidence({
      id: 'EV_JUPITER_FORTUNE',
      sourceType: 'PLANET',
      domain: 'WEALTH',
      role: 'SECONDARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Jupiter karaka of fortune in auspicious 9th house',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 80,
      ruleId: 'WEALTH_JUPITER_RELEVANCE_001',
      dimension: 'FORTUNE'
    });

    const result = evaluateWealthReasoningHierarchy({
      evidence: [ev2H, ev11H, evJupiter],
      dashaTimings: {
        md: { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
        ad: { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
        pd: { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
      }
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.natalStrength).toBe('VERY_STRONG');
    expect(result.finalStrength).toBe('VERY_STRONG');
    expect(result.dimensionResults.ACCUMULATION.natalDirection).toBe('SUPPORT');
    expect(result.dimensionResults.GAINS.natalDirection).toBe('SUPPORT');
  });

  it('W2: Weak speculation does NEVER dilute Accumulation or Gains (independent evaluation)', () => {
    const ev2H = createDomainEvidence({
      id: 'EV_2H_STRONG',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'WEALTH_2H_STRONG_001',
      dimension: 'ACCUMULATION'
    });

    const ev5HAfflicted = createDomainEvidence({
      id: 'EV_5H_AFFLICTED',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '5th house of speculation afflicted by Saturn and Rahu',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 85,
      ruleId: 'WEALTH_5H_AFFLICTION_001',
      dimension: 'SPECULATION'
    });

    const result = evaluateWealthReasoningHierarchy({
      evidence: [ev2H, ev5HAfflicted]
    });

    // Accumulation dimension remains strong
    expect(result.dimensionResults.ACCUMULATION.natalDirection).toBe('SUPPORT');
    expect(result.dimensionResults.ACCUMULATION.natalStrength).toBe('VERY_STRONG');

    // Speculation dimension is challenged
    expect(result.dimensionResults.SPECULATION.natalDirection).toBe('CHALLENGE');
  });

  it('W3: D2 confirmation relationship is explicitly UNAVAILABLE', () => {
    const ev = createDomainEvidence({
      id: 'EV_2H',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house wealth statement',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95
    });

    const result = evaluateWealthReasoningHierarchy({
      evidence: [ev]
    });

    expect(result.vargaDirection).toBe('UNAVAILABLE');
  });

  it('W4: Challenging transit creates temporary pressure without erasing natal promise', () => {
    const ev2H = createDomainEvidence({
      id: 'EV_2H_STRONG',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'WEALTH_2H_STRONG_001',
      dimension: 'ACCUMULATION'
    });

    const transitChallenging = createDomainEvidence({
      id: 'EV_TRANSIT_RAHU',
      sourceType: 'TRANSIT',
      domain: 'WEALTH',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Rahu transit in 2nd house creates temporary expenditure stress',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 60
    });

    const result = evaluateWealthReasoningHierarchy({
      evidence: [ev2H, transitChallenging],
      transitEvidence: [transitChallenging]
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.currentPressure).toBe('MODERATE');
  });

  it('W6: Traceability: all 4 dimensions produce independent reasoning results with resolvable evidence IDs', () => {
    const evAccum = createDomainEvidence({
      id: 'EV_ACC_1',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Accumulation promise',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95,
      dimension: 'ACCUMULATION'
    });

    const evGains = createDomainEvidence({
      id: 'EV_GAINS_1',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Gains promise',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95,
      dimension: 'GAINS'
    });

    const result = evaluateWealthReasoningHierarchy({
      evidence: [evAccum, evGains]
    });

    expect(result.dimensionResults.ACCUMULATION.evidenceIds).toContain('EV_ACC_1');
    expect(result.dimensionResults.GAINS.evidenceIds).toContain('EV_GAINS_1');
    expect(result.reasoningTrace.primaryPromise).toHaveLength(2);
  });
});
