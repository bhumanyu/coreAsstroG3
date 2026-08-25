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
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: 'JUPITER' as any },
        ad: { period: 'AD', planet: 'SUN' as any },
        pd: { period: 'PD', planet: 'MARS' as any }
      },
      md: {} as any,
      ad: {} as any,
      pd: {} as any,
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'SUPPORTS',
        combinedConfidence: 'HIGH',
        combinedScore: 2.0,
        summary: 'Dasha strongly supports'
      },
      factors: [
        {
          id: 'D-1',
          planet: 'JUPITER' as any,
          period: 'MD',
          category: 'FUNCTIONAL_ROLE',
          direction: 'SUPPORT',
          weight: 2.0,
          statement: 'Jupiter supports career',
          evidenceIds: ['E-JUP']
        }
      ],
      summary: 'Dasha strongly supports'
    };

    const mockTiming: CareerTimingSynthesis = {
      natalPromise: 'STRONG',
      dashaEffect: 'SUPPORTS',
      transitEffect: 'SUPPORTS',
      overallEffect: 'ACTIVATES',
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
      summary: 'Transits support career'
    };

    const mockManifestations: CareerManifestationSynthesis[] = [
      {
        reasoningVersion: 'CW-04',
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
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: 'JUPITER' as any },
        ad: { period: 'AD', planet: 'SUN' as any },
        pd: { period: 'PD', planet: 'MARS' as any }
      },
      md: {} as any,
      ad: {} as any,
      pd: {} as any,
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'SUPPORTS',
        combinedConfidence: 'HIGH',
        combinedScore: 2.0,
        summary: 'Dasha supports'
      },
      factors: [],
      summary: 'Dasha supports'
    };

    const mockManifestations: CareerManifestationSynthesis[] = [
      {
        reasoningVersion: 'CW-04',
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
        reasoningVersion: 'CW-04',
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

  describe('CW-05 Multi-Axis Semantics & Deterministic Matrices', () => {
    it('populates all orthogonal axes deterministically and maps effects correctly', () => {
      const mockDasha: CareerDashaSynthesis = {
        natalPromiseProtected: true,
        reasoningVersion: 'CW-02',
        timing: {
          md: { period: 'MD', planet: 'JUPITER' as any },
          ad: { period: 'AD', planet: 'SUN' as any },
          pd: { period: 'PD', planet: 'MARS' as any }
        },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combined: {
          hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
          md: {} as any,
          ad: {} as any,
          pd: {} as any,
          combinedEffect: 'SUPPORTS',
          combinedConfidence: 'HIGH',
          combinedScore: 2.0,
          summary: 'Dasha supports'
        },
        factors: [
          {
            id: 'D-FACT-1',
            planet: 'JUPITER' as any,
            period: 'MD',
            category: 'FUNCTIONAL_ROLE',
            direction: 'SUPPORT',
            weight: 2.0,
            statement: 'Jupiter functional benefic',
            evidenceIds: ['E-JUP-1']
          }
        ],
        summary: 'Dasha supports'
      };

      const mockTiming: CareerTimingSynthesis = {
        natalPromise: 'STRONG',
        dashaEffect: 'SUPPORTS',
        transitEffect: 'SUPPORTS',
        overallEffect: 'ACTIVATES',
        confidence: 0.9,
        factors: [
          {
            id: 'T-FACT-1',
            planet: 'SATURN' as any,
            category: 'CAREER_HOUSE_TRANSIT',
            direction: 'SUPPORT',
            weight: 1.5,
            statement: 'Saturn transit 10H',
            natalEvidenceIds: ['E-SAT-1']
          }
        ],
        summary: 'Timing activates'
      };

      const mockManifestations: CareerManifestationSynthesis[] = [
        {
          reasoningVersion: 'CW-04',
          mode: 'LEADERSHIP',
          status: 'STRONGLY_SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'SUPPORT',
          d10Support: 'SUPPORT',
          factors: [
            {
              id: 'M-FACT-1',
              mode: 'LEADERSHIP',
              direction: 'SUPPORT',
              weight: 2.0,
              source: 'NATAL',
              statement: 'Leadership backed',
              evidenceIds: ['E-LEAD-1']
            }
          ],
          summary: 'Strong leadership'
        }
      ];

      const input: CareerFinalSynthesisInput = {
        natalPromise: 'STRONG',
        dashaSynthesis: mockDasha,
        timingSynthesis: mockTiming,
        manifestationSynthesis: mockManifestations,
        d10Synthesis: [
          {
            id: 'D10-EV-1',
            ruleId: 'D10-R-1',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'D10 confirms career dignity'
          }
        ],
        d10Relationship: 'CONFIRMS',
        natalEvidenceIds: ['NATAL-EV-1', 'NATAL-EV-2'],
        natalRuleIds: ['NATAL-RULE-1']
      };

      const result = synthesizeCareerFinal(input);

      // Verify all 6 axes are populated
      expect(result.promiseStatus).toBe('STRONG');
      expect(result.activationStatus).toBe('SUPPORT');
      expect(result.timingStatus).toBe('SUPPORT');
      expect(result.divisionalStatus).toBe('CONFIRMS');
      expect(result.manifestationStatus).toBe('STRONG');
      expect(result.finalStatus).toBe('STRONG');

      // Verify full provenance aggregation
      expect(result.natalEvidenceIds).toEqual(['NATAL-EV-1', 'NATAL-EV-2']);
      expect(result.natalRuleIds).toEqual(['NATAL-RULE-1']);
      expect(result.dashaFactors).toHaveLength(1);
      expect(result.dashaFactors[0].id).toBe('D-FACT-1');
      expect(result.timingFactors).toHaveLength(1);
      expect(result.timingFactors[0].id).toBe('T-FACT-1');
      expect(result.manifestationFactors).toHaveLength(1);
      expect(result.manifestationFactors[0].id).toBe('M-FACT-1');
      expect(result.d10Evidence).toHaveLength(1);
      expect(result.d10Evidence[0].id).toBe('D10-EV-1');

      // Aggregate rule IDs and evidence IDs
      expect(result.evidenceIds).toContain('NATAL-EV-1');
      expect(result.evidenceIds).toContain('E-JUP-1');
      expect(result.evidenceIds).toContain('E-SAT-1');
      expect(result.evidenceIds).toContain('E-LEAD-1');
      expect(result.evidenceIds).toContain('D10-EV-1');

      expect(result.ruleIds).toContain('CW-05-CAREER-SYNTHESIS');
      expect(result.ruleIds).toContain('NATAL-RULE-1');
      expect(result.ruleIds).toContain('D-FACT-1');
      expect(result.ruleIds).toContain('T-FACT-1');
      expect(result.ruleIds).toContain('M-FACT-1');
      expect(result.ruleIds).toContain('D10-R-1');
    });

    it('enforces D10 conflict structural downgrade from VERY_STRONG/STRONG down to MODERATE', () => {
      const input: CareerFinalSynthesisInput = {
        natalPromise: 'STRONG',
        d10Relationship: 'CONFLICTS'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.divisionalStatus).toBe('CONFLICTS');
      // D10 conflict downgrades candidate status from STRONG to MODERATE
      expect(result.status).toBe('MODERATE');
      expect(result.finalStatus).toBe('MODERATE');
      expect(result.confidence).toBe('LOW');
    });

    it('enforces Dasha CHALLENGES structural downgrade', () => {
      const mockDasha: CareerDashaSynthesis = {
        natalPromiseProtected: true,
        reasoningVersion: 'CW-02',
        timing: {
          md: { period: 'MD', planet: 'SATURN' as any },
          ad: { period: 'AD', planet: 'RAHU' as any },
          pd: { period: 'PD', planet: 'KETU' as any }
        },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combined: {
          hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
          md: {} as any,
          ad: {} as any,
          pd: {} as any,
          combinedEffect: 'CHALLENGES',
          combinedConfidence: 'HIGH',
          combinedScore: -2.0,
          summary: 'Dasha challenging'
        },
        factors: [],
        summary: 'Dasha challenging'
      };

      const input: CareerFinalSynthesisInput = {
        natalPromise: 'STRONG',
        dashaSynthesis: mockDasha,
        d10Relationship: 'CONFIRMS'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.activationStatus).toBe('CHALLENGE');
      // Dasha challenge downgrades status from STRONG to MODERATE
      expect(result.status).toBe('MODERATE');
      expect(result.finalStatus).toBe('MODERATE');
    });

    it('ensures transit challenge acts as timing modifier only and does not fabricate or erase promise', () => {
      const mockTiming: CareerTimingSynthesis = {
        natalPromise: 'STRONG',
        dashaEffect: 'NEUTRAL',
        transitEffect: 'CHALLENGES',
        overallEffect: 'CHALLENGES',
        confidence: 0.7,
        factors: [],
        summary: 'Transit challenge'
      };

      const input: CareerFinalSynthesisInput = {
        natalPromise: 'STRONG',
        timingSynthesis: mockTiming,
        d10Relationship: 'CONFIRMS'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.timingStatus).toBe('CHALLENGE');
      expect(result.promiseStatus).toBe('STRONG');
      // Transit challenge lowers confidence but preserves candidate status within natal ceiling
      expect(result.confidence).toBe('MEDIUM');
    });

    it('enforces natal ceiling for all status values', () => {
      const statuses: ('VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'UNDETERMINED')[] = [
        'VERY_STRONG',
        'STRONG',
        'MODERATE',
        'WEAK',
        'UNDETERMINED'
      ];

      for (const promise of statuses) {
        const result = synthesizeCareerFinal({
          natalPromise: promise,
          d10Relationship: 'CONFIRMS'
        });

        expect(result.promiseStatus).toBe(
          promise === 'VERY_STRONG'
            ? 'VERY_STRONG'
            : promise === 'STRONG'
            ? 'STRONG'
            : promise === 'MODERATE'
            ? 'MODERATE'
            : promise === 'WEAK'
            ? 'CHALLENGED'
            : 'INSUFFICIENT_DATA'
        );
      }
    });
  });
});
