import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import { evaluateCareerReasoningHierarchy } from './careerReasoningHierarchy';
import { createVargaConfirmation } from '../interpretation/VargaConfirmation';

describe('Career Reasoning Hierarchy (Golden Scenarios C1-C7 & CW-01 Validation)', () => {
  const canonicalHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
    asOf: '2024-06-01T00:00:00.000Z'
  });

  it('X1: Legacy path remains default when options is omitted or LEGACY', () => {
    const legacyResult1 = interpretCareerV2(canonicalHoroscope);
    const legacyResult2 = interpretCareerV2(canonicalHoroscope, { strategy: 'LEGACY' });

    expect(legacyResult1.domain).toBe('CAREER');
    expect(legacyResult1.reasoningVersion).toBeUndefined();
    expect(legacyResult2.domain).toBe('CAREER');
    expect(legacyResult2.reasoningVersion).toBeUndefined();
    expect(legacyResult1.conclusion.strength).toBe(legacyResult2.conclusion.strength);
  });

  it('X2: CW01 strategy returns valid reasoning trace and CW-01 version on canonical chart', () => {
    const cw01Result = interpretCareerV2(canonicalHoroscope, { strategy: 'CW01' });

    expect(cw01Result.domain).toBe('CAREER');
    expect(cw01Result.reasoningVersion).toBe('CW-01');
    expect(cw01Result.reasoningTrace).toBeDefined();
    expect(cw01Result.reasoningTrace?.primaryPromise).toBeDefined();
    expect(cw01Result.conclusionData?.currentActivation).toBeDefined();
    expect(cw01Result.conclusionData?.currentPressure).toBeDefined();
  });

  it('C1: Strong 10H + Strong 10L + D10 Confirms + Active Dasha yields STRONG/VERY_STRONG', () => {
    const ev10H = createDomainEvidence({
      id: 'EV_10H_STRONG',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is exceptionally strong with auspicious kendra lordship',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    });

    const ev10L = createDomainEvidence({
      id: 'EV_10L_DIGNITY',
      sourceType: 'LORDSHIP',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th lord Sun is exalted in 10th house',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'CAREER_10L_DIGNITY_001'
    });

    const d10Conf = createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: 'CONFIRMS',
      strength: 'STRONG',
      confidence: 'HIGH',
      statement: 'D10 confirms executive prominence',
      evidenceIds: ['EV_10H_STRONG']
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [ev10H, ev10L],
      d10Confirmation: d10Conf,
      dashaTimings: {
        md: { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
        ad: { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
        pd: { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
      }
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.natalStrength).toBe('VERY_STRONG');
    expect(result.finalStrength).toBe('VERY_STRONG');
    expect(result.currentActivation).toBe('STRONG');
    expect(result.dasha.finalEffect).toBe('ACTIVATES');
  });

  it('C2: D10 Conflicts qualifies conclusion strength but NEVER erases D1 natal promise', () => {
    const ev10H = createDomainEvidence({
      id: 'EV_10H_STRONG',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    });

    const d10Conf = createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: 'CONFLICTS',
      strength: 'STRONG',
      confidence: 'HIGH',
      statement: 'D10 presents structural misalignment',
      evidenceIds: ['EV_10H_STRONG']
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [ev10H],
      d10Confirmation: d10Conf
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.natalStrength).toBe('VERY_STRONG');
    // D10 conflict qualifies final strength from VERY_STRONG to STRONG
    expect(result.finalStrength).toBe('STRONG');
  });

  it('C3: Active Dasha cannot manufacture a strong natal promise out of afflicted 10H/10L', () => {
    const evAfflicted = createDomainEvidence({
      id: 'EV_10H_AFFLICTED',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house and lord afflicted in 8th house',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_AFFLICTION_001'
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [evAfflicted],
      dashaTimings: {
        md: { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
        ad: { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
        pd: { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
      }
    });

    expect(result.natalDirection).toBe('CHALLENGE');
    expect(result.natalStrength).toBe('VERY_WEAK');
    expect(result.finalStrength).toBe('VERY_WEAK');
  });

  it('C4: Challenging transit creates temporary pressure without erasing natal promise', () => {
    const ev10H = createDomainEvidence({
      id: 'EV_10H_STRONG',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    });

    const transitChallenging = createDomainEvidence({
      id: 'EV_TRANSIT_SATURN',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Saturn transit over 10th house creates friction',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 60
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [ev10H, transitChallenging],
      transitEvidence: [transitChallenging]
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.natalStrength).toBe('VERY_STRONG');
    expect(result.finalStrength).toBe('VERY_STRONG');
    expect(result.currentPressure).toBe('MODERATE');
  });

  it('C5: Strong natal + MD CHALLENGES + AD CHALLENGES + transit CHALLENGE reflects timing challenge in finalStrength and HIGH pressure', () => {
    const ev10H = createDomainEvidence({
      id: 'EV_10H_STRONG',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    });

    const transitChallenging = createDomainEvidence({
      id: 'EV_TRANSIT_SATURN',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Saturn transit over 10th house creates friction',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 60
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [ev10H, transitChallenging],
      dashaTimings: {
        md: { level: 'MD', effect: 'CHALLENGES', evidenceIds: ['MD_CHAL'], confidence: 1 },
        ad: { level: 'AD', effect: 'CHALLENGES', evidenceIds: ['AD_CHAL'], confidence: 1 }
      },
      transitEvidence: [transitChallenging]
    });

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.natalStrength).toBe('VERY_STRONG');
    // Strong natal + challenging Dasha downgrades final strength to STRONG
    expect(result.finalStrength).toBe('STRONG');
    // Compounded dasha challenge + transit challenge yields HIGH pressure
    expect(result.currentPressure).toBe('HIGH');
    expect(result.currentActivation).toBe('LOW');
  });

  describe('Dasha Precedence Matrix (MD > AD > PD)', () => {
    const ev10H = createDomainEvidence({
      id: 'EV_10H_STRONG',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is strong',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    });

    it('MD ACTIVATES + AD CHALLENGES yields PARTIALLY_ACTIVATES; AD cannot completely override MD', () => {
      const result = evaluateCareerReasoningHierarchy({
        evidence: [ev10H],
        dashaTimings: {
          md: { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
          ad: { level: 'AD', effect: 'CHALLENGES', evidenceIds: ['AD_1'], confidence: 1 }
        }
      });

      expect(result.dasha.finalEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.dasha.dominantLevel).toBe('MD');
      expect(result.currentActivation).toBe('MODERATE');
    });

    it('MD CHALLENGES + AD ACTIVATES yields PARTIALLY_ACTIVATES / partial mitigation, never ACTIVATES', () => {
      const result = evaluateCareerReasoningHierarchy({
        evidence: [ev10H],
        dashaTimings: {
          md: { level: 'MD', effect: 'CHALLENGES', evidenceIds: ['MD_1'], confidence: 1 },
          ad: { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 }
        }
      });

      expect(result.dasha.finalEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.dasha.dominantLevel).toBe('MD');
      expect(result.currentActivation).toBe('MODERATE');
    });
  });

  describe('Manifestation Gating & Canonical Vocabulary', () => {
    it('Descriptive-fact guard: a single supporting evidence item yields POSSIBLE, requiring independent corroborator for SUPPORTED', () => {
      const singleEv = createDomainEvidence({
        id: 'EV_SUN_LEADERSHIP',
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'SECONDARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Sun governs executive authority',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 70,
        ruleId: 'CAREER_SUN_RELEVANCE_001'
      });

      const singleResult = evaluateCareerReasoningHierarchy({
        evidence: [singleEv]
      });

      const singleLeadership = singleResult.manifestations.find((m) => m.mode === 'LEADERSHIP');
      expect(singleLeadership).toBeDefined();
      expect(singleLeadership?.status).toBe('POSSIBLE');

      // Now add independent corroborator (10H strong)
      const corroboratingEv = createDomainEvidence({
        id: 'EV_10H_LEADERSHIP',
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: '10th house is strong',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 95,
        ruleId: 'CAREER_10H_STRONG_001'
      });

      const corroboratedResult = evaluateCareerReasoningHierarchy({
        evidence: [singleEv, corroboratingEv]
      });

      const corroboratedLeadership = corroboratedResult.manifestations.find((m) => m.mode === 'LEADERSHIP');
      expect(corroboratedLeadership).toBeDefined();
      expect(corroboratedLeadership?.status).toBe('SUPPORTED');
    });

    it('contains only the 7 canonical manifestation modes', () => {
      const result = evaluateCareerReasoningHierarchy({
        evidence: []
      });

      const modes = result.manifestations.map((m) => m.mode);
      expect(modes).toEqual([
        'LEADERSHIP',
        'MANAGEMENT',
        'TECHNICAL_SPECIALIZATION',
        'SERVICE_EMPLOYMENT',
        'AUTHORITY',
        'INDEPENDENT_WORK',
        'BUSINESS_ENTREPRENEURSHIP'
      ]);
      expect(modes).not.toContain('EMPLOYMENT');
      expect(modes).not.toContain('ENTREPRENEURSHIP');
    });
  });

  it('C7: Reasoning trace contains resolvable evidence ids', () => {
    const ev = createDomainEvidence({
      id: 'EV_TEST_TRACE',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house statement',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95
    });

    const result = evaluateCareerReasoningHierarchy({
      evidence: [ev]
    });

    expect(result.reasoningTrace.primaryPromise).toHaveLength(1);
    expect(result.reasoningTrace.primaryPromise[0].evidenceId).toBe('EV_TEST_TRACE');
  });
});

