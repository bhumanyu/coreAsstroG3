import { describe, it, expect } from 'vitest';
import { synthesizeCareerFinal } from './careerFinalSynthesis';
import type {
  CareerFinalSynthesisInput,
  CareerWealthFinalSynthesis
} from './careerWealthFinalSynthesisTypes';
import type { CareerDashaSynthesis } from '../../career/careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerManifestationSynthesis } from '../../career/manifestation/careerManifestationSynthesisTypes';

describe('synthesizeCareerFinal (CW-05)', () => {
  it('enforces natal ceiling: weak natal cannot be elevated to strong despite supportive dasha and timing', () => {
    const mockDasha: CareerDashaSynthesis = {
      dashaEffect: 'SUPPORTS',
      confidence: 0.9,
      factors: [
        {
          id: 'D-1',
          lord: 'JUPITER' as any,
          level: 'MD',
          direction: 'SUPPORT',
          weight: 2.0,
          statement: 'Jupiter supports career',
          evidenceIds: ['E-JUP']
        }
      ],
      summary: 'Dasha strongly supports'
    };

    const mockTiming: CareerTimingSynthesis = {
      transitEffect: 'SUPPORTS',
      timingEffect: 'ACTIVATES',
      confidence: 0.85,
      factors: [
        {
          id: 'T-1',
          planet: 'JUPITER' as any,
          category: 'CAREER_HOUSE_TRANSIT',
          direction: 'SUPPORT',
          weight: 1.5,
          statement: 'Jupiter transits 10th house',
          natalEvidenceIds: ['E-10H']
        }
      ],
      overallSummary: 'Transits support career'
    };

    const mockManifestations: CareerManifestationSynthesis[] = [
      {
        mode: 'LEADERSHIP',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        natalSupport: 'SUPPORT',
        dashaSupport: 'SUPPORT',
        transitSupport: 'SUPPORT',
        d10Support: 'SUPPORT',
        factors: [
          {
            id: 'M-1',
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            weight: 2.5,
            source: 'NATAL',
            statement: 'Leadership supported',
            evidenceIds: ['E-LEAD']
          }
        ],
        summary: 'Strong leadership manifestation'
      }
    ];

    const input: CareerFinalSynthesisInput = {
      natalPromise: 'WEAK',
      dashaSynthesis: mockDasha,
      timingSynthesis: mockTiming,
      manifestationSynthesis: mockManifestations,
      d10Relationship: 'CONFIRMS'
    };

    const result: CareerWealthFinalSynthesis = synthesizeCareerFinal(input);

    expect(result.domain).toBe('CAREER');
    expect(result.reasoningVersion).toBe('CW-05');
    // Guardrail: Weak natal ceiling caps final status at CHALLENGED
    expect(result.status).toBe('CHALLENGED');
    expect(result.primaryPromise).toBe('WEAK');
    expect(result.dashaEffect).toBe('SUPPORTS');
    expect(result.timingEffect).toBe('ACTIVATES');
    expect(result.divisionalEffect).toBe('CONFIRMS');
    expect(result.ruleIds).toContain('CW-05-CAREER-SYNTHESIS');
    expect(result.ruleIds).toContain('D-1');
    expect(result.ruleIds).toContain('T-1');
    expect(result.ruleIds).toContain('M-1');
    expect(result.evidenceIds).toContain('E-JUP');
    expect(result.evidenceIds).toContain('E-10H');
    expect(result.evidenceIds).toContain('E-LEAD');
  });

  it('produces VERY_STRONG / STRONG when natal promise is strong and secondary layers align', () => {
    const mockDasha: CareerDashaSynthesis = {
      dashaEffect: 'SUPPORTS',
      confidence: 0.9,
      factors: [],
      summary: 'Dasha supports'
    };

    const mockManifestations: CareerManifestationSynthesis[] = [
      {
        mode: 'MANAGEMENT',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        natalSupport: 'SUPPORT',
        dashaSupport: 'SUPPORT',
        transitSupport: 'NEUTRAL',
        d10Support: 'SUPPORT',
        factors: [],
        summary: 'Management supported'
      },
      {
        mode: 'LEADERSHIP',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        natalSupport: 'SUPPORT',
        dashaSupport: 'SUPPORT',
        transitSupport: 'NEUTRAL',
        d10Support: 'SUPPORT',
        factors: [],
        summary: 'Leadership supported'
      }
    ];

    const input: CareerFinalSynthesisInput = {
      natalPromise: 'VERY_STRONG',
      dashaSynthesis: mockDasha,
      manifestationSynthesis: mockManifestations,
      d10Relationship: 'CONFIRMS'
    };

    const result = synthesizeCareerFinal(input);

    expect(result.status).toBe('VERY_STRONG');
    expect(result.confidence).toBe('HIGH');
    expect(result.strongestAreas).toContain('MANAGEMENT');
  });

  it('returns INSUFFICIENT_DATA when natal promise is UNDETERMINED and no manifestations exist', () => {
    const input: CareerFinalSynthesisInput = {
      natalPromise: 'UNDETERMINED',
      d10Relationship: 'UNAVAILABLE'
    };

    const result = synthesizeCareerFinal(input);

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.confidence).toBe('LOW');
  });

  it('returns an immutable frozen object', () => {
    const input: CareerFinalSynthesisInput = {
      natalPromise: 'STRONG',
      d10Relationship: 'CONFIRMS'
    };

    const result = synthesizeCareerFinal(input);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.manifestationSummary)).toBe(true);
    expect(Object.isFrozen(result.strongestAreas)).toBe(true);
    expect(Object.isFrozen(result.keySupport)).toBe(true);
    expect(Object.isFrozen(result.ruleIds)).toBe(true);
    expect(Object.isFrozen(result.evidenceIds)).toBe(true);
  });
});
