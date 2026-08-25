import { describe, it, expect } from 'vitest';
import { synthesizeWealthFinal } from './wealthFinalSynthesis';
import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis
} from './careerWealthFinalSynthesisTypes';
import type { WealthManifestationSynthesis } from '../../wealth/manifestation/wealthManifestationTypes';
import type { WealthTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';

describe('synthesizeWealthFinal (CW-05)', () => {
  it('enforces dimension isolation: accumulation supported while speculation challenged', () => {
    const mockManifestations: WealthManifestationSynthesis = {
      reasoningVersion: 'CW-04',
      dimensions: {
        ACCUMULATION: {
          reasoningVersion: 'CW-04',
          dimension: 'ACCUMULATION',
          status: 'STRONGLY_SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'SUPPORT',
          d2Support: 'SUPPORT',
          factors: [
            {
              id: 'WM-ACC-1',
              dimension: 'ACCUMULATION',
              direction: 'SUPPORT',
              weight: 2.0,
              source: 'NATAL',
              statement: 'Accumulation supported',
              evidenceIds: ['E-2H']
            }
          ],
          summary: 'Accumulation strongly supported'
        },
        GAINS: {
          reasoningVersion: 'CW-04',
          dimension: 'GAINS',
          status: 'SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'NEUTRAL',
          d2Support: 'SUPPORT',
          factors: [],
          summary: 'Gains supported'
        },
        FORTUNE: {
          reasoningVersion: 'CW-04',
          dimension: 'FORTUNE',
          status: 'SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'NEUTRAL',
          d2Support: 'SUPPORT',
          factors: [],
          summary: 'Fortune supported'
        },
        SPECULATION: {
          reasoningVersion: 'CW-04',
          dimension: 'SPECULATION',
          status: 'CHALLENGED',
          confidence: 'HIGH',
          natalSupport: 'CHALLENGE',
          dashaSupport: 'SUPPORT',
          transitSupport: 'SUPPORT',
          d2Support: 'SUPPORT',
          factors: [
            {
              id: 'WM-SPEC-1',
              dimension: 'SPECULATION',
              direction: 'CHALLENGE',
              weight: 2.0,
              source: 'NATAL',
              statement: 'Speculation afflicted natally',
              evidenceIds: ['E-5H-AFFLICTED']
            }
          ],
          summary: 'Speculation challenged natally'
        }
      },
      summary: 'Mixed wealth manifestation'
    };

    const mockTiming: WealthTimingSynthesis = {
      dimensions: {
        ACCUMULATION: {
          dimension: 'ACCUMULATION',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [
            {
              id: 'WT-ACC-1',
              planet: 'JUPITER' as any,
              category: 'WEALTH_HOUSE_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.5,
              statement: 'Jupiter transit 2nd house',
              dimension: 'ACCUMULATION',
              natalEvidenceIds: ['E-2H-TR']
            }
          ],
          summary: 'Accumulation timing supported'
        },
        GAINS: {
          dimension: 'GAINS',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [],
          summary: 'Gains timing supported'
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [],
          summary: 'Fortune timing supported'
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          natalPromise: 'WEAK',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [
            {
              id: 'WT-SPEC-1',
              planet: 'VENUS' as any,
              category: 'WEALTH_HOUSE_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.0,
              statement: 'Venus transits 5th house',
              dimension: 'SPECULATION',
              natalEvidenceIds: ['E-5H-TR']
            }
          ],
          summary: 'Speculation timing supported'
        }
      },
      overallSummary: 'Timing active across wealth'
    };

    const input: WealthFinalSynthesisInput = {
      natalPromise: {
        ACCUMULATION: 'STRONG',
        GAINS: 'STRONG',
        FORTUNE: 'STRONG',
        SPECULATION: 'WEAK'
      },
      timingSynthesis: mockTiming,
      manifestationSynthesis: mockManifestations,
      d2Relationship: 'CONFIRMS'
    };

    const result: CareerWealthFinalSynthesis = synthesizeWealthFinal(input);

    expect(result.domain).toBe('WEALTH');
    expect(result.reasoningVersion).toBe('CW-05');
    expect(result.dimensions).toBeDefined();

    // Invariant: ACCUMULATION is STRONG
    expect(result.dimensions!.ACCUMULATION.status).toBe('STRONG');
    // Invariant: SPECULATION is CHALLENGED due to natal ceiling and dimension isolation
    expect(result.dimensions!.SPECULATION.status).toBe('CHALLENGED');
    // Invariant: Risk profile is ELEVATED / HIGH because speculation is challenged despite strong accumulation
    expect(result.riskProfile).toBe('ELEVATED');

    expect(result.strongestAreas).toContain('ACCUMULATION');
    expect(result.challengedAreas).toContain('SPECULATION');

    expect(result.ruleIds).toContain('CW-05-WEALTH-SYNTHESIS');
    expect(result.ruleIds).toContain('WM-ACC-1');
    expect(result.ruleIds).toContain('WM-SPEC-1');
    expect(result.ruleIds).toContain('WT-ACC-1');
    expect(result.ruleIds).toContain('WT-SPEC-1');

    expect(result.evidenceIds).toContain('E-2H');
    expect(result.evidenceIds).toContain('E-5H-AFFLICTED');
    expect(result.evidenceIds).toContain('E-2H-TR');
    expect(result.evidenceIds).toContain('E-5H-TR');
  });

  it('correctly handles INSUFFICIENT_DATA across dimensions without defaulting to challenged', () => {
    const input: WealthFinalSynthesisInput = {
      natalPromise: {},
      d2Relationship: 'UNAVAILABLE'
    };

    const result = synthesizeWealthFinal(input);

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.riskProfile).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.ACCUMULATION.status).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.SPECULATION.status).toBe('INSUFFICIENT_DATA');
  });

  it('produces frozen immutable output', () => {
    const input: WealthFinalSynthesisInput = {
      natalPromise: { ACCUMULATION: 'STRONG' },
      d2Relationship: 'CONFIRMS'
    };

    const result = synthesizeWealthFinal(input);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dimensions)).toBe(true);
    expect(Object.isFrozen(result.manifestationSummary)).toBe(true);
    expect(Object.isFrozen(result.strongestAreas)).toBe(true);
    expect(Object.isFrozen(result.ruleIds)).toBe(true);
    expect(Object.isFrozen(result.evidenceIds)).toBe(true);
  });

  describe('CW-05 Multi-Axis Semantics & Deterministic Matrices', () => {
    it('populates multi-axis statuses on both overall synthesis and per-dimension records', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'WEAK'
        },
        d2Relationship: 'CONFIRMS',
        d2Synthesis: [
          {
            id: 'D2-EV-1',
            ruleId: 'D2-R-1',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'D2 confirms wealth'
          }
        ],
        natalEvidenceIds: ['NATAL-W-1', 'NATAL-W-2'],
        natalRuleIds: ['NATAL-W-R1']
      };

      const result = synthesizeWealthFinal(input);

      // Verify overall axes
      expect(result.promiseStatus).toBe('STRONG');
      expect(result.divisionalStatus).toBe('CONFIRMS');
      expect(result.finalStatus).toBe('STRONG');
      expect(result.riskProfile).toBe('ELEVATED');

      // Verify per-dimension axes
      const acc = result.dimensions!.ACCUMULATION;
      expect(acc.promiseStatus).toBe('STRONG');
      expect(acc.divisionalStatus).toBe('CONFIRMS');
      expect(acc.finalStatus).toBe('STRONG');

      const spec = result.dimensions!.SPECULATION;
      expect(spec.promiseStatus).toBe('CHALLENGED');
      expect(spec.divisionalStatus).toBe('CONFIRMS');
      expect(spec.finalStatus).toBe('CHALLENGED');

      // Verify provenance
      expect(result.natalEvidenceIds).toEqual(['NATAL-W-1', 'NATAL-W-2']);
      expect(result.natalRuleIds).toEqual(['NATAL-W-R1']);
      expect(result.d2Evidence).toHaveLength(1);
      expect(result.d2Evidence[0].id).toBe('D2-EV-1');
      expect(result.evidenceIds).toContain('NATAL-W-1');
      expect(result.evidenceIds).toContain('D2-EV-1');
      expect(result.ruleIds).toContain('CW-05-WEALTH-SYNTHESIS');
      expect(result.ruleIds).toContain('NATAL-W-R1');
      expect(result.ruleIds).toContain('D2-R-1');
    });

    it('enforces speculation exclusion: weak speculation drives riskProfile to HIGH/ELEVATED without diluting overall wealth status', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'WEAK'
        },
        d2Relationship: 'CONFIRMS'
      };

      const result = synthesizeWealthFinal(input);

      // Foundational wealth capacity is unaffected by high-variance speculation
      expect(result.status).toBe('STRONG');
      expect(result.finalStatus).toBe('STRONG');
      expect(result.riskProfile).toBe('ELEVATED');
      expect(result.strongestAreas).toContain('ACCUMULATION');
      expect(result.strongestAreas).toContain('GAINS');
      expect(result.challengedAreas).toContain('SPECULATION');
    });

    it('enforces D2 conflict structural downgrade on overall and per-dimension statuses', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        d2Relationship: 'CONFLICTS'
      };

      const result = synthesizeWealthFinal(input);

      expect(result.divisionalStatus).toBe('CONFLICTS');
      // D2 conflict downgrades candidate from STRONG to MODERATE
      expect(result.status).toBe('MODERATE');
      expect(result.finalStatus).toBe('MODERATE');
      expect(result.dimensions!.ACCUMULATION.status).toBe('MODERATE');
      expect(result.confidence).toBe('LOW');
    });

    it('enforces Dasha challenge downgrade across dimensions', () => {
      const mockTiming: WealthTimingSynthesis = {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            natalPromise: 'STRONG',
            overallEffect: 'CHALLENGES',
            dashaEffect: 'CHALLENGES',
            transitEffect: 'NEUTRAL',
            confidence: 0.8,
            factors: [],
            summary: 'Dasha challenging accumulation'
          },
          GAINS: {
            dimension: 'GAINS',
            natalPromise: 'STRONG',
            overallEffect: 'CHALLENGES',
            dashaEffect: 'CHALLENGES',
            transitEffect: 'NEUTRAL',
            confidence: 0.8,
            factors: [],
            summary: 'Dasha challenging gains'
          },
          FORTUNE: {
            dimension: 'FORTUNE',
            natalPromise: 'STRONG',
            overallEffect: 'CHALLENGES',
            dashaEffect: 'CHALLENGES',
            transitEffect: 'NEUTRAL',
            confidence: 0.8,
            factors: [],
            summary: 'Dasha challenging fortune'
          },
          SPECULATION: {
            dimension: 'SPECULATION',
            natalPromise: 'STRONG',
            overallEffect: 'CHALLENGES',
            dashaEffect: 'CHALLENGES',
            transitEffect: 'NEUTRAL',
            confidence: 0.8,
            factors: [],
            summary: 'Dasha challenging speculation'
          }
        },
        overallSummary: 'Dasha challenges'
      };

      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        timingSynthesis: mockTiming,
        d2Relationship: 'CONFIRMS'
      };

      const result = synthesizeWealthFinal(input);

      expect(result.activationStatus).toBe('CHALLENGE');
      // Dasha challenge downgrades overall status from STRONG to MODERATE
      expect(result.status).toBe('MODERATE');
      expect(result.finalStatus).toBe('MODERATE');
      expect(result.dimensions!.ACCUMULATION.status).toBe('MODERATE');
      expect(result.dimensions!.ACCUMULATION.activationStatus).toBe('CHALLENGE');
    });

    it('enforces natal ceiling for wealth dimensions: weak natal cannot be elevated by supportive dasha/timing', () => {
      const mockTiming: WealthTimingSynthesis = {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            natalPromise: 'WEAK',
            overallEffect: 'ACTIVATES',
            dashaEffect: 'SUPPORTS',
            transitEffect: 'SUPPORTS',
            confidence: 0.9,
            factors: [],
            summary: 'Supportive timing'
          },
          GAINS: {
            dimension: 'GAINS',
            natalPromise: 'WEAK',
            overallEffect: 'ACTIVATES',
            dashaEffect: 'SUPPORTS',
            transitEffect: 'SUPPORTS',
            confidence: 0.9,
            factors: [],
            summary: 'Supportive timing'
          },
          FORTUNE: {
            dimension: 'FORTUNE',
            natalPromise: 'WEAK',
            overallEffect: 'ACTIVATES',
            dashaEffect: 'SUPPORTS',
            transitEffect: 'SUPPORTS',
            confidence: 0.9,
            factors: [],
            summary: 'Supportive timing'
          },
          SPECULATION: {
            dimension: 'SPECULATION',
            natalPromise: 'WEAK',
            overallEffect: 'ACTIVATES',
            dashaEffect: 'SUPPORTS',
            transitEffect: 'SUPPORTS',
            confidence: 0.9,
            factors: [],
            summary: 'Supportive timing'
          }
        },
        overallSummary: 'Supportive timing'
      };

      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'WEAK',
          GAINS: 'WEAK',
          FORTUNE: 'WEAK',
          SPECULATION: 'WEAK'
        },
        timingSynthesis: mockTiming,
        d2Relationship: 'CONFIRMS'
      };

      const result = synthesizeWealthFinal(input);

      // Weak natal ceiling caps overall status and all dimension statuses at CHALLENGED
      expect(result.status).toBe('CHALLENGED');
      expect(result.finalStatus).toBe('CHALLENGED');
      expect(result.dimensions!.ACCUMULATION.status).toBe('CHALLENGED');
      expect(result.dimensions!.GAINS.status).toBe('CHALLENGED');
      expect(result.dimensions!.FORTUNE.status).toBe('CHALLENGED');
      expect(result.dimensions!.SPECULATION.status).toBe('CHALLENGED');
    });
  });
});
