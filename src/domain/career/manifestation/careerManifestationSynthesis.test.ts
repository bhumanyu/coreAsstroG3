import { describe, it, expect } from 'vitest';
import {
  resolveManifestation,
  synthesizeCareerManifestations
} from './careerManifestationSynthesis';
import { createDomainEvidence, type DomainEvidence } from '../../interpretation';
import type { CareerDashaSynthesis } from '../careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import { Planet } from '../../../types';

describe('careerManifestationSynthesis (CW-04A)', () => {
  const createMockNatalEvidence = (rules: string[], polarity: 'SUPPORTING' | 'CHALLENGING' = 'SUPPORTING'): DomainEvidence[] => {
    return rules.map((ruleId, idx) =>
      createDomainEvidence({
        id: `EV_${ruleId}_${idx}`,
        sourceType: 'HOUSE',
        ruleId,
        domain: 'CAREER',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: `Rule ${ruleId} statement`,
        strength: 'STRONG',
        polarity
      })
    );
  };

  it('returns INSUFFICIENT_DATA when evidence is completely absent', () => {
    const result = resolveManifestation('LEADERSHIP', []);
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.confidence).toBe('LOW');
    expect(result.factors).toEqual([]);
  });

  it('correctly derives STRONGLY_SUPPORTED when natal, D10, dasha, and transit all support', () => {
    const natalEvidence = createMockNatalEvidence(['CAREER_10H_STRONG_001', 'CAREER_SUN_RELEVANCE_001', 'CAREER_10L_DIGNITY_001']);
    const mockDasha: CareerDashaSynthesis = {
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: Planet.SUN },
        ad: { period: 'AD', planet: Planet.MARS },
        pd: { period: 'PD', planet: Planet.JUPITER }
      },
      md: {
        period: 'MD',
        planet: Planet.SUN,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 4.0,
        challengeScore: 0,
        netScore: 4.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [10],
        d10Effect: 'SUPPORTS',
        summary: 'Sun MD strongly supports career.'
      },
      ad: {
        period: 'AD',
        planet: Planet.MARS,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 2.0,
        challengeScore: 0,
        netScore: 2.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [10],
        d10Effect: 'SUPPORTS',
        summary: 'Mars AD supports career.'
      },
      pd: {
        period: 'PD',
        planet: Planet.JUPITER,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 1.0,
        challengeScore: 0,
        netScore: 1.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [10],
        d10Effect: 'SUPPORTS',
        summary: 'Jupiter PD supports career.'
      },
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'SUPPORTS',
        combinedConfidence: 'HIGH',
        combinedScore: 7.0,
        summary: 'Combined dasha strongly supports career.'
      },
      factors: [
        {
          id: 'DASH_SUN_1',
          planet: Planet.SUN,
          period: 'MD',
          category: 'KARAKA',
          direction: 'SUPPORT',
          weight: 2.0,
          statement: 'Sun MD activates authority and leadership.'
        }
      ],
      summary: 'Dasha strongly supports leadership.'
    };

    const mockTransit: CareerTimingSynthesis = {
      natalPromise: 'STRONG',
      dashaEffect: 'SUPPORTS',
      transitEffect: 'SUPPORTS',
      overallEffect: 'ACTIVATES',
      confidence: 0.9,
      factors: [
        {
          id: 'TR_JUP_10',
          planet: Planet.JUPITER,
          category: 'CAREER_HOUSE_TRANSIT',
          direction: 'SUPPORT',
          weight: 1.5,
          statement: 'Jupiter transiting 10th house supports leadership expansion.'
        }
      ],
      summary: 'Timing supports career advancement.'
    };

    const d10Factors = [
      {
        id: 'D10_LEADERSHIP_Sun_SUPPORT',
        mode: 'LEADERSHIP' as const,
        direction: 'SUPPORT' as const,
        weight: 1.5,
        planet: Planet.SUN,
        statement: 'D10 Sun in 10th house supports leadership.'
      }
    ];

    const result = resolveManifestation('LEADERSHIP', natalEvidence, mockDasha, mockTransit, d10Factors);

    expect(result.mode).toBe('LEADERSHIP');
    expect(result.status).toBe('STRONGLY_SUPPORTED');
    expect(result.natalSupport).toBe('SUPPORT');
    expect(result.d10Support).toBe('SUPPORT');
    expect(result.dashaSupport).toBe('SUPPORT');
    expect(result.transitSupport).toBe('SUPPORT');
    expect(result.confidence).toBe('HIGH');
    expect(result.factors.length).toBeGreaterThanOrEqual(4);
  });

  it('correctly derives CHALLENGED when natal evidence is challenging and timing opposes', () => {
    const challengingEvidence = createMockNatalEvidence(['CAREER_11H_GAINS_001', 'CAREER_10H_11H_LINK_001'], 'CHALLENGING');
    const mockDasha: CareerDashaSynthesis = {
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: Planet.SATURN },
        ad: { period: 'AD', planet: Planet.KETU },
        pd: { period: 'PD', planet: Planet.RAHU }
      },
      md: {
        period: 'MD',
        planet: Planet.SATURN,
        effect: 'CHALLENGES',
        confidence: 'HIGH',
        supportScore: 0,
        challengeScore: 3.0,
        netScore: -3.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [8],
        d10Effect: 'CHALLENGES',
        summary: 'Saturn MD challenges career.'
      },
      ad: {
        period: 'AD',
        planet: Planet.KETU,
        effect: 'CHALLENGES',
        confidence: 'HIGH',
        supportScore: 0,
        challengeScore: 1.5,
        netScore: -1.5,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [12],
        d10Effect: 'CHALLENGES',
        summary: 'Ketu AD challenges career.'
      },
      pd: {
        period: 'PD',
        planet: Planet.RAHU,
        effect: 'CHALLENGES',
        confidence: 'HIGH',
        supportScore: 0,
        challengeScore: 1.0,
        netScore: -1.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [8],
        d10Effect: 'CHALLENGES',
        summary: 'Rahu PD challenges career.'
      },
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'CHALLENGES',
        combinedConfidence: 'HIGH',
        combinedScore: -5.5,
        summary: 'Combined dasha challenges career.'
      },
      factors: [
        {
          id: 'DASH_SAT_1',
          planet: Planet.SATURN,
          period: 'MD',
          category: 'KARAKA',
          direction: 'CHALLENGE',
          weight: 1.5,
          houses: [8],
          statement: 'Saturn MD challenges independence.'
        }
      ],
      summary: 'Dasha restricts autonomous enterprise.'
    };

    const result = resolveManifestation('BUSINESS_ENTREPRENEURSHIP', challengingEvidence, mockDasha);

    expect(result.mode).toBe('BUSINESS_ENTREPRENEURSHIP');
    expect(result.status).toBe('CHALLENGED');
    expect(result.natalSupport).toBe('CHALLENGE');
    expect(result.dashaSupport).toBe('CHALLENGE');
  });

  it('strictly enforces natal ceiling: natal CHALLENGE + dasha/transit/d10 SUPPORT resolves to CHALLENGED', () => {
    // Natal promise is challenging for BUSINESS_ENTREPRENEURSHIP
    const challengingNatalEvidence = createMockNatalEvidence(['CAREER_11H_GAINS_001', 'CAREER_10H_11H_LINK_001'], 'CHALLENGING');

    const supportingDasha: CareerDashaSynthesis = {
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: Planet.MERCURY },
        ad: { period: 'AD', planet: Planet.SUN },
        pd: { period: 'PD', planet: Planet.MARS }
      },
      md: {
        period: 'MD',
        planet: Planet.MERCURY,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 4.0,
        challengeScore: 0,
        netScore: 4.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [3, 7],
        d10Effect: 'SUPPORTS',
        summary: 'Mercury MD supports enterprise.'
      },
      ad: {
        period: 'AD',
        planet: Planet.SUN,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 2.0,
        challengeScore: 0,
        netScore: 2.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [10],
        d10Effect: 'SUPPORTS',
        summary: 'Sun AD supports enterprise.'
      },
      pd: {
        period: 'PD',
        planet: Planet.MARS,
        effect: 'SUPPORTS',
        confidence: 'HIGH',
        supportScore: 1.0,
        challengeScore: 0,
        netScore: 1.0,
        factors: [],
        supportingFactorIds: [],
        challengingFactorIds: [],
        neutralFactorIds: [],
        activatedCareerHouses: [3],
        d10Effect: 'SUPPORTS',
        summary: 'Mars PD supports enterprise.'
      },
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'SUPPORTS',
        combinedConfidence: 'HIGH',
        combinedScore: 7.0,
        summary: 'Combined dasha strongly supports enterprise.'
      },
      factors: [
        {
          id: 'DASH_MERC_1',
          planet: Planet.MERCURY,
          period: 'MD',
          category: 'KARAKA',
          direction: 'SUPPORT',
          weight: 2.0,
          statement: 'Mercury MD activates commercial enterprise.'
        }
      ],
      summary: 'Dasha supports business enterprise.'
    };

    const supportingTransit: CareerTimingSynthesis = {
      natalPromise: 'WEAK',
      dashaEffect: 'SUPPORTS',
      transitEffect: 'SUPPORTS',
      overallEffect: 'ACTIVATES',
      confidence: 0.9,
      factors: [
        {
          id: 'TR_MERC_3',
          planet: Planet.MERCURY,
          category: 'CAREER_HOUSE_TRANSIT',
          direction: 'SUPPORT',
          weight: 1.5,
          statement: 'Mercury transit supports enterprise.'
        }
      ],
      summary: 'Timing supports enterprise.'
    };

    const supportingD10Factors = [
      {
        id: 'D10_ENTREPRENEURSHIP_Mercury_SUPPORT',
        mode: 'BUSINESS_ENTREPRENEURSHIP' as const,
        direction: 'SUPPORT' as const,
        weight: 1.5,
        planet: Planet.MERCURY,
        statement: 'D10 Mercury supports commercial ventures.'
      }
    ];

    const result = resolveManifestation(
      'BUSINESS_ENTREPRENEURSHIP',
      challengingNatalEvidence,
      supportingDasha,
      supportingTransit,
      supportingD10Factors
    );

    // Invariant: Natal ceiling MUST prevent status from becoming STRONGLY_SUPPORTED or SUPPORTED or MIXED
    expect(result.mode).toBe('BUSINESS_ENTREPRENEURSHIP');
    expect(result.natalSupport).toBe('CHALLENGE');
    expect(result.dashaSupport).toBe('SUPPORT');
    expect(result.transitSupport).toBe('SUPPORT');
    expect(result.d10Support).toBe('SUPPORT');
    expect(result.status).toBe('CHALLENGED');
    expect(result.confidence).toBe('HIGH');
  });

  it('synthesizes all 7 canonical career manifestation modes via synthesizeCareerManifestations', () => {
    const natalEvidence = createMockNatalEvidence(['CAREER_10H_STRONG_001', 'CAREER_11H_GAINS_001']);
    const allModes = synthesizeCareerManifestations(natalEvidence);

    expect(allModes.length).toBe(7);
    const modeNames = allModes.map((m) => m.mode);
    expect(modeNames).toContain('LEADERSHIP');
    expect(modeNames).toContain('MANAGEMENT');
    expect(modeNames).toContain('TECHNICAL_SPECIALIZATION');
    expect(modeNames).toContain('SERVICE_EMPLOYMENT');
    expect(modeNames).toContain('AUTHORITY');
    expect(modeNames).toContain('INDEPENDENT_WORK');
    expect(modeNames).toContain('BUSINESS_ENTREPRENEURSHIP');
  });

  it('ensures synthesis never mutates or overrides natal evidence', () => {
    const natalEvidence = Object.freeze(createMockNatalEvidence(['CAREER_10H_STRONG_001']));
    const originalLength = natalEvidence.length;

    const result = resolveManifestation('LEADERSHIP', natalEvidence);
    expect(natalEvidence.length).toBe(originalLength);
    expect(result.reasoningVersion).toBe('CW-04');
  });
});
