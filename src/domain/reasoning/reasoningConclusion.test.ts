import { describe, it, expect } from 'vitest';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { EvidenceStrength } from '../interpretation/DomainInterpretationTypes';
import { classifyReasoningEvidence } from './reasoningHierarchy';
import { resolveNatalPromise, resolveStrength } from './reasoningConclusion';
import { applyNatalStrengthGuardrails } from './natalStrengthGuardrails';

function primary(
  id: string,
  polarity: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL',
  strength: EvidenceStrength = 'VERY_STRONG',
  priority = 95
) {
  return createDomainEvidence({
    id,
    sourceType: 'HOUSE',
    domain: 'CAREER',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: `Primary evidence ${id}`,
    polarity,
    strength,
    priority
  });
}

function secondary(
  id: string,
  polarity: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL',
  strength: EvidenceStrength = 'MODERATE',
  priority = 50
) {
  return createDomainEvidence({
    id,
    sourceType: 'HOUSE',
    domain: 'CAREER',
    role: 'SECONDARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: `Secondary evidence ${id}`,
    polarity,
    strength,
    priority
  });
}

function modifier(
  id: string,
  polarity: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL',
  strength: EvidenceStrength = 'MODERATE',
  priority = 30
) {
  return createDomainEvidence({
    id,
    sourceType: 'PLANET',
    domain: 'CAREER',
    role: 'MODIFIER',
    phase: 'MODIFIER',
    source: 'D1',
    statement: `Modifier evidence ${id}`,
    polarity,
    strength,
    priority
  });
}

function yoga(
  id: string,
  polarity: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL',
  strength: EvidenceStrength = 'STRONG',
  priority = 70
) {
  return createDomainEvidence({
    id,
    sourceType: 'YOGA',
    domain: 'CAREER',
    role: 'CONFIRMATION',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: `Yoga evidence ${id}`,
    polarity,
    strength,
    priority
  });
}

describe('CW-01A Reasoning Conclusion', () => {
  it('resolves qualitative strength from support and challenge dominance', () => {
    expect(resolveStrength(0, 0)).toBe('UNDETERMINED');
    expect(resolveStrength(10, 0)).toBe('VERY_STRONG');
    expect(resolveStrength(10, 3)).toBe('STRONG');
    expect(resolveStrength(10, 6)).toBe('MODERATE');
    expect(resolveStrength(5, 5)).toBe('MIXED');
    expect(resolveStrength(3, 10)).toBe('WEAK');
    expect(resolveStrength(0, 10)).toBe('VERY_WEAK');
  });

  it('Test 1: pure primary support establishes direction and base strength without guardrails', () => {
    const evidence = [primary('EV_P1', 'SUPPORTING', 'VERY_STRONG')];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.direction).toBe('SUPPORT');
    expect(result.strength).toBe('VERY_STRONG');
    expect(result.primaryDirection).toBe('SUPPORT');
    expect(result.primaryStrength).toBe('VERY_STRONG');
    expect(result.guardrails).toEqual(['NONE']);
    expect(result.contradiction.hasContradiction).toBe(false);
  });

  it('Test 2: primary support with secondary contradiction caps VERY_STRONG to STRONG', () => {
    const evidence = [
      primary('EV_P1', 'SUPPORTING', 'VERY_STRONG'),
      secondary('EV_S1', 'CHALLENGING', 'MODERATE')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.direction).toBe('SUPPORT');
    expect(result.primaryStrength).toBe('VERY_STRONG');
    expect(result.strength).toBe('STRONG');
    expect(result.guardrails).toContain('SECONDARY_CONTRADICTION');
    expect(result.guardrails).toContain('PRIMARY_SUPPORT_CAP');
    expect(result.contradiction.hasContradiction).toBe(true);
    expect(result.contradiction.secondaryContradictionRatio).toBe(1);
  });

  it('Test 3: primary support already STRONG with secondary contradiction retains STRONG without PRIMARY_SUPPORT_CAP', () => {
    const guardrailResult = applyNatalStrengthGuardrails({
      primaryDirection: 'SUPPORT',
      primaryStrength: 'STRONG',
      primarySupport: 6.25,
      primaryChallenge: 0,
      secondarySupport: 0,
      secondaryChallenge: 2.5
    });

    expect(guardrailResult.direction).toBe('SUPPORT');
    expect(guardrailResult.strength).toBe('STRONG');
    expect(guardrailResult.applied).toEqual(['SECONDARY_CONTRADICTION']);
  });

  it('Test 4: primary support reinforced by secondary support retains VERY_STRONG and NONE guardrail', () => {
    const evidence = [
      primary('EV_P1', 'SUPPORTING', 'VERY_STRONG'),
      secondary('EV_S1', 'SUPPORTING', 'STRONG')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.direction).toBe('SUPPORT');
    expect(result.primaryStrength).toBe('VERY_STRONG');
    expect(result.strength).toBe('VERY_STRONG');
    expect(result.guardrails).toEqual(['NONE']);
    expect(result.contradiction.hasContradiction).toBe(false);
  });

  it('Test 5: primary mixed evidence triggers PRIMARY_MIXED_CAP and caps strength to MODERATE', () => {
    const evidence = [
      primary('EV_P1', 'SUPPORTING', 'STRONG'),
      primary('EV_P2', 'CHALLENGING', 'STRONG')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.primaryDirection).toBe('MIXED');
    expect(result.direction).toBe('MIXED');
    expect(result.strength).toBe('MODERATE');
    expect(result.guardrails).toContain('PRIMARY_MIXED_CAP');
    expect(result.contradiction.hasContradiction).toBe(true);
  });

  it('Test 6: primary challenge with secondary support applies SECONDARY_CONTRADICTION', () => {
    const evidence = [
      primary('EV_P1', 'CHALLENGING', 'VERY_STRONG'),
      secondary('EV_S1', 'SUPPORTING', 'MODERATE')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.primaryDirection).toBe('CHALLENGE');
    expect(result.direction).toBe('CHALLENGE');
    expect(result.guardrails).toContain('SECONDARY_CONTRADICTION');
    expect(result.contradiction.hasContradiction).toBe(true);
  });

  it('Test 7: secondary evidence only cannot manufacture a promise (yields UNAVAILABLE and UNDETERMINED)', () => {
    const evidence = [
      secondary('EV_S1', 'SUPPORTING', 'VERY_STRONG'),
      secondary('EV_S2', 'SUPPORTING', 'STRONG')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.primaryDirection).toBe('UNAVAILABLE');
    expect(result.primaryStrength).toBe('UNDETERMINED');
    expect(result.direction).toBe('UNAVAILABLE');
    expect(result.strength).toBe('UNDETERMINED');
    expect(result.guardrails).toContain('NO_PRIMARY_PROMISE');
  });

  it('Test 8: empty evidence yields UNAVAILABLE and UNDETERMINED with NO_PRIMARY_PROMISE', () => {
    const weighted = classifyReasoningEvidence([]);
    const result = resolveNatalPromise(weighted);

    expect(result.direction).toBe('UNAVAILABLE');
    expect(result.strength).toBe('UNDETERMINED');
    expect(result.primaryDirection).toBe('UNAVAILABLE');
    expect(result.primaryStrength).toBe('UNDETERMINED');
    expect(result.guardrails).toContain('NO_PRIMARY_PROMISE');
    expect(result.contradiction.hasContradiction).toBe(false);
  });

  it('Test 9: modifiers and yogas fold into modifierSupport/modifierChallenge and update contradiction summary', () => {
    const evidence = [
      primary('EV_P1', 'SUPPORTING', 'VERY_STRONG'),
      modifier('EV_M1', 'SUPPORTING', 'MODERATE'),
      yoga('EV_Y1', 'SUPPORTING', 'STRONG'),
      modifier('EV_M2', 'CHALLENGING', 'WEAK')
    ];
    const weighted = classifyReasoningEvidence(evidence);
    const result = resolveNatalPromise(weighted);

    expect(result.direction).toBe('SUPPORT');
    expect(result.strength).toBe('VERY_STRONG');
    // modifier (1.5 * 1.0 = 1.5) + yoga (2.5 * 1.25 = 3.125) = 4.625
    expect(result.modifierSupport).toBeCloseTo(4.625);
    // modifier weak (1.5 * 0.5 = 0.75)
    expect(result.modifierChallenge).toBeCloseTo(0.75);
    expect(result.contradiction.hasContradiction).toBe(true);
    expect(result.contradiction.modifierContradictionRatio).toBeCloseTo(0.75 / (4.625 + 0.75));
  });

  it('excludes dasha and transit evidence from natal promise evaluation', () => {
    const dashaEv = createDomainEvidence({
      id: 'EV_DASHA',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: 'Active Mahadasha',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const transitEv = createDomainEvidence({
      id: 'EV_TRANSIT',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Active Transit',
      polarity: 'CHALLENGING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const weighted = classifyReasoningEvidence([dashaEv, transitEv]);
    const natalPromise = resolveNatalPromise(weighted);

    expect(natalPromise.direction).toBe('UNAVAILABLE');
    expect(natalPromise.strength).toBe('UNDETERMINED');
    expect(natalPromise.primarySupport).toBe(0);
    expect(natalPromise.primaryChallenge).toBe(0);
    expect(natalPromise.guardrails).toContain('NO_PRIMARY_PROMISE');
  });

  describe('Natal strength guardrail policy tests', () => {
    it('does not allow neutral primary evidence to produce strong natal promise', () => {
      const result = applyNatalStrengthGuardrails({
        primaryDirection: 'NEUTRAL',
        primaryStrength: 'VERY_STRONG',
        primarySupport: 0,
        primaryChallenge: 0,
        secondarySupport: 10,
        secondaryChallenge: 0
      });

      expect(result.direction).toBe('NEUTRAL');
      expect(result.strength).toBe('UNDETERMINED');
    });

    it('secondary contradiction cannot increase primary strength', () => {
      const result = applyNatalStrengthGuardrails({
        primaryDirection: 'SUPPORT',
        primaryStrength: 'STRONG',
        primarySupport: 7.5,
        primaryChallenge: 0,
        secondarySupport: 0,
        secondaryChallenge: 100
      });

      expect(result.direction).toBe('SUPPORT');
      expect(result.strength).toBe('STRONG');
    });

    it('secondary support cannot improve a mixed primary beyond MODERATE', () => {
      const result = applyNatalStrengthGuardrails({
        primaryDirection: 'MIXED',
        primaryStrength: 'MIXED',
        primarySupport: 5,
        primaryChallenge: 5,
        secondarySupport: 100,
        secondaryChallenge: 0
      });

      expect(result.direction).toBe('MIXED');
      expect(result.strength).toBe('MODERATE');
    });
  });
});
