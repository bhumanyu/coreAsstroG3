import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import { resolveCareerTransitEffect } from './careerTransitRules';
import { synthesizeCareerTiming } from './careerTransitSynthesis';
import type { CareerTransitSynthesis } from './careerWealthTimingTypes';
import type { CareerDashaSynthesis, CareerDashaEffect } from '../../career/careerDasha/careerDashaSynthesisTypes';

export function createMockCareerDashaSynthesis(options?: {
  combinedEffect?: CareerDashaEffect;
  mdPlanet?: Planet;
  adPlanet?: Planet;
  pdPlanet?: Planet;
}): CareerDashaSynthesis {
  const combinedEffect = options?.combinedEffect ?? 'SUPPORTS';
  const mdPlanet = options?.mdPlanet ?? Planet.JUPITER;
  const adPlanet = options?.adPlanet ?? Planet.SATURN;
  const pdPlanet = options?.pdPlanet ?? Planet.MERCURY;

  return {
    natalPromiseProtected: true,
    reasoningVersion: 'CW-02',
    timing: {
      md: { period: 'MD', planet: mdPlanet },
      ad: { period: 'AD', planet: adPlanet },
      pd: { period: 'PD', planet: pdPlanet }
    },
    md: {
      period: 'MD',
      planet: mdPlanet,
      effect: combinedEffect,
      confidence: 'HIGH',
      supportScore: 2.5,
      challengeScore: 0,
      netScore: 2.5,
      factors: [],
      supportingFactorIds: [],
      challengingFactorIds: [],
      neutralFactorIds: [],
      activatedCareerHouses: [10],
      d10Effect: 'SUPPORTS',
      summary: 'MD summary'
    },
    ad: {
      period: 'AD',
      planet: adPlanet,
      effect: combinedEffect,
      confidence: 'HIGH',
      supportScore: 1.5,
      challengeScore: 0,
      netScore: 1.5,
      factors: [],
      supportingFactorIds: [],
      challengingFactorIds: [],
      neutralFactorIds: [],
      activatedCareerHouses: [10],
      d10Effect: 'SUPPORTS',
      summary: 'AD summary'
    },
    pd: {
      period: 'PD',
      planet: pdPlanet,
      effect: combinedEffect,
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
      summary: 'PD summary'
    },
    combined: {
      hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
      md: {} as any,
      ad: {} as any,
      pd: {} as any,
      combinedEffect,
      combinedConfidence: 'HIGH',
      combinedScore: 3.0,
      summary: `Combined effect ${combinedEffect}`
    },
    factors: [],
    summary: `Summary ${combinedEffect}`
  };
}

describe('CW-03 Career Timing Synthesis Core Principles', () => {
  const mockSupportsTransit: CareerTransitSynthesis = {
    transitEffect: 'SUPPORTS',
    confidence: 0.85,
    factors: [],
    summary: 'Supportive transit'
  };

  const mockChallengesTransit: CareerTransitSynthesis = {
    transitEffect: 'CHALLENGES',
    confidence: 0.85,
    factors: [],
    summary: 'Challenging transit'
  };

  it('Spec Case 1: STRONG natal promise + Dasha SUPPORTS + Transit SUPPORTS -> ACTIVATES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('ACTIVATES');
  });

  it('Spec Case 2: STRONG natal promise + Dasha SUPPORTS + Transit CHALLENGES -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockChallengesTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 3: MIXED natal promise + Dasha SUPPORTS + Transit SUPPORTS -> MODIFIES (Ceiling Rule)', () => {
    const effect = resolveCareerTransitEffect('MIXED', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 4: WEAK natal promise + Dasha SUPPORTS + Transit SUPPORTS -> DOES_NOT_ACTIVATE (Ceiling Rule)', () => {
    const effect = resolveCareerTransitEffect('WEAK', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('DOES_NOT_ACTIVATE');
  });

  it('Spec Case 5: Dasha CHALLENGES + Transit SUPPORTS -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'CHALLENGES', mockSupportsTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 6: Dasha SUPPORTS + Transit CHALLENGES -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockChallengesTransit);
    expect(effect).toBe('MODIFIES');
  });

  describe('Concern 12: Direct-Primary Activation Matrix', () => {
    it('WEAK / SUPPORT / SUPPORT / true -> DOES_NOT_ACTIVATE', () => {
      const effect = resolveCareerTransitEffect('WEAK', 'SUPPORTS', {
        transitEffect: 'SUPPORTS',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('DOES_NOT_ACTIVATE');
    });

    it('MIXED / SUPPORT / SUPPORT / true -> MODIFIES', () => {
      const effect = resolveCareerTransitEffect('MIXED', 'SUPPORTS', {
        transitEffect: 'SUPPORTS',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('MODIFIES');
    });

    it('STRONG / NEUTRAL / SUPPORT / false -> MODIFIES', () => {
      const effect = resolveCareerTransitEffect('STRONG', 'NEUTRAL', {
        transitEffect: 'SUPPORTS',
        hasDirectPrimaryActivation: false
      });
      expect(effect).toBe('MODIFIES');
    });

    it('STRONG / NEUTRAL / SUPPORT / true -> ACTIVATES', () => {
      const effect = resolveCareerTransitEffect('STRONG', 'NEUTRAL', {
        transitEffect: 'SUPPORTS',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('ACTIVATES');
    });

    it('STRONG / SUPPORT / CHALLENGE / true -> MODIFIES', () => {
      const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', {
        transitEffect: 'CHALLENGES',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('MODIFIES');
    });

    it('STRONG / CHALLENGE / SUPPORT / true -> MODIFIES', () => {
      const effect = resolveCareerTransitEffect('STRONG', 'CHALLENGES', {
        transitEffect: 'SUPPORTS',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('MODIFIES');
    });

    it('STRONG / CHALLENGE / CHALLENGE / true -> CHALLENGES', () => {
      const effect = resolveCareerTransitEffect('STRONG', 'CHALLENGES', {
        transitEffect: 'CHALLENGES',
        hasDirectPrimaryActivation: true
      });
      expect(effect).toBe('CHALLENGES');
    });
  });

  it('synthesizeCareerTiming produces a deterministic CareerTimingSynthesis object with typed mock Dasha', () => {
    const mockDasha = createMockCareerDashaSynthesis({ combinedEffect: 'SUPPORTS' });
    const timing = synthesizeCareerTiming('STRONG', mockDasha, mockSupportsTransit);
    expect(timing.natalPromise).toBe('STRONG');
    expect(timing.overallEffect).toBe('ACTIVATES');
    expect(timing.summary).toContain('ACTIVATES');
  });
});
