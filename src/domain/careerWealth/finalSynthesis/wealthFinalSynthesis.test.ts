import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import { synthesizeWealthFinal } from './wealthFinalSynthesis';
import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis
} from './careerWealthFinalSynthesisTypes';
import type { WealthManifestationSynthesis } from '../../wealth/manifestation/wealthManifestationTypes';
import type { WealthTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import { createDomainEvidence } from '../../interpretation/DomainEvidence';

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
              planet: Planet.JUPITER,
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
              planet: Planet.VENUS,
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
    // Invariant: Chart-derived propensity is challenged while overall wealth remains separately determined
    expect(result.speculativePropensity).toBe('CHALLENGED');
    expect(result.summary).not.toMatch(/risk profile|market exposure|buy|sell|hold|options|leverage|expected return|profit|loss|recommend/i);
    // Risk is qualified from speculation, not diluted by strong accumulation promise.
    expect(result.riskProfile).toBe('HIGH');
    expect(result.riskQualification).toMatchObject({
      dimension: 'SPECULATION',
      classification: 'HIGH',
      evidenceCoverage: 'HIGH',
      missingRequiredEvidenceFamilies: []
    });
    expect(result.riskQualification?.reasonCodes).toContain('SPECULATION_CHALLENGED');

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
    expect(result.speculativePropensity).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.ACCUMULATION.status).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.SPECULATION.status).toBe('INSUFFICIENT_DATA');
    expect(
      Object.values(result.dimensions ?? {}).every(
        (dimension) => dimension.divisionalStatus !== undefined
      )
    ).toBe(true);
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
    const speculationTiming = (effect: 'SUPPORTS' | 'CHALLENGES'): WealthTimingSynthesis => ({
      dimensions: {
        SPECULATION: {
          dimension: 'SPECULATION',
          natalPromise: 'MODERATE',
          overallEffect: effect,
          dashaEffect: effect,
          transitEffect: 'NEUTRAL',
          confidence: 0.8,
          factors: [],
          summary: `Speculation timing ${effect.toLowerCase()}`
        }
      } as unknown as WealthTimingSynthesis['dimensions'],
      overallSummary: 'Speculation timing available'
    });

    it.each([
      ['LOW', 'STRONG', 'CONFIRMS', 'SUPPORTS'],
      ['MODERATE', 'STRONG', 'CONFIRMS', 'CHALLENGES'],
      ['ELEVATED', 'MIXED', 'CONFIRMS', 'CHALLENGES'],
      ['HIGH', 'WEAK', 'CONFIRMS', 'SUPPORTS']
    ] as const)('qualifies %s risk using the isolated speculation evidence', (expected, speculation, d2Relationship, timingEffect) => {
      const result = synthesizeWealthFinal({
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: speculation
        },
        d2Relationship,
        ...(timingEffect ? { timingSynthesis: speculationTiming(timingEffect) } : {})
      });

      expect(result.riskProfile).toBe(expected);
      expect(result.riskQualification?.classification).toBe(expected);
      expect(result.riskQualification?.dimension).toBe('SPECULATION');
      expect(result.riskQualification?.reasons.length).toBeGreaterThan(0);
    });

    it('returns INSUFFICIENT_DATA when the required speculation corroboration family is absent', () => {
      const result = synthesizeWealthFinal({
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        d2Relationship: 'UNAVAILABLE'
      });

      expect(result.riskProfile).toBe('INSUFFICIENT_DATA');
      expect(result.riskQualification?.missingRequiredEvidenceFamilies).toEqual(['CORROBORATION']);
      expect(result.riskQualification?.reasonCodes).toContain('D2_UNAVAILABLE');
    });

    it('keeps D2 unavailable visible without discarding other sufficient risk evidence', () => {
      const result = synthesizeWealthFinal({
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'WEAK'
        },
        timingSynthesis: speculationTiming('SUPPORTS'),
        d2Relationship: 'UNAVAILABLE'
      });

      expect(result.riskProfile).toBe('HIGH');
      expect(result.riskQualification?.d2Availability).toBe('UNAVAILABLE');
      expect(result.riskQualification?.evidenceFamilies.timing).toBe('AVAILABLE');
    });

    it('ignores external D2 declarations while keeping risk qualitative and unprobabilistic', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        timingSynthesis: speculationTiming('SUPPORTS'),
        d2Relationship: 'CONFLICTS'
      };
      const result = synthesizeWealthFinal(input);

      expect(result.riskProfile).toBe('LOW');
      expect(result.riskQualification?.conflictingEvidence).toBe(false);
      expect(result.riskQualification?.reasonCodes).not.toContain('D2_CONFLICT');
      expect(result).not.toHaveProperty('riskProbability');
      expect(result.riskQualification).not.toHaveProperty('probability');
      expect(synthesizeWealthFinal({ ...input, d2Relationship: 'UNAVAILABLE' })).toEqual(result);
    });

    it('keeps confidence evidence-qualified when D2 remains unavailable', () => {
      const base: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        timingSynthesis: speculationTiming('SUPPORTS'),
        d2Relationship: 'CONFIRMS'
      };
      const sparse = synthesizeWealthFinal(base);
      const wellTraced = synthesizeWealthFinal({
        ...base,
        natalEvidenceIds: ['NATAL-ACC-1', 'NATAL-ACC-2'],
        d2Synthesis: [
          createDomainEvidence({
            id: 'D2-RISK-COVERAGE',
            ruleId: 'D2-RISK-COVERAGE-RULE',
            sourceType: 'VARGA',
            domain: 'WEALTH',
            role: 'CONFIRMATION',
            phase: 'VARGA_CONFIRMATION',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'D2 confirms the traced wealth evidence.',
            priority: 1
          })
        ]
      });

      expect(sparse.riskProfile).toBe('LOW');
      expect(wellTraced.riskProfile).toBe('LOW');
      expect(sparse.confidence).toBe('LOW');
      expect(wellTraced.confidence).toBe('LOW');
      expect(wellTraced.confidenceBreakdown?.divisionalQuality).toBe('NOT_APPLICABLE');
      expect(wellTraced.confidenceBreakdown?.reasons).toHaveLength(7);
    });

    it('populates multi-axis statuses on both overall synthesis and per-dimension records', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'WEAK'
        },
        timingSynthesis: speculationTiming('SUPPORTS'),
        d2Relationship: 'CONFIRMS',
        d2Synthesis: [
          createDomainEvidence({
            id: 'D2-EV-1',
            ruleId: 'D2-R-1',
            sourceType: 'VARGA',
            domain: 'WEALTH',
            role: 'CONFIRMATION',
            phase: 'VARGA_CONFIRMATION',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'D2 confirms wealth',
            priority: 1
          })
        ],
        natalEvidenceIds: ['NATAL-W-1', 'NATAL-W-2'],
        natalRuleIds: ['NATAL-W-R1']
      };

      const result = synthesizeWealthFinal(input);

      // Verify overall axes
      expect(result.promiseStatus).toBe('STRONG');
      expect(result.divisionalStatus).toBe('UNAVAILABLE');
      expect(result.finalStatus).toBe('STRONG');
      expect(result.speculativePropensity).toBe('CHALLENGED');
      expect(result.riskProfile).toBe('HIGH');

      // Verify per-dimension axes
      const acc = result.dimensions!.ACCUMULATION;
      expect(acc.promiseStatus).toBe('STRONG');
      expect(acc.divisionalStatus).toBe('UNAVAILABLE');
      expect(acc.finalStatus).toBe('STRONG');

      const spec = result.dimensions!.SPECULATION;
      expect(spec.promiseStatus).toBe('CHALLENGED');
      expect(spec.divisionalStatus).toBe('UNAVAILABLE');
      expect(spec.finalStatus).toBe('CHALLENGED');

      // Verify provenance
      expect(result.natalEvidenceIds).toEqual(['NATAL-W-1', 'NATAL-W-2']);
      expect(result.natalRuleIds).toEqual(['NATAL-W-R1']);
      expect(result.d2Evidence).toHaveLength(1);
      expect(result.d2Evidence![0].id).toBe('D2-EV-1');
      expect(result.evidenceIds).toContain('NATAL-W-1');
      expect(result.evidenceIds).not.toContain('D2-EV-1');
      expect(result.divisionalStatus).toBe('UNAVAILABLE');
      expect(result.d2AvailabilityReason).toContain('D2 calculation and interpretation');
      for (const dimension of Object.values(result.dimensions ?? {})) {
        expect(dimension.divisionalStatus).toBe('UNAVAILABLE');
        expect(dimension.divisionalEffect).toBe('UNAVAILABLE');
      }
      expect(result.ruleIds).toContain('CW-05-WEALTH-SYNTHESIS');
      expect(result.ruleIds).toContain('NATAL-W-R1');
      expect(result.ruleIds).not.toContain('D2-R-1');
    });

    it('enforces speculation exclusion: weak speculation yields a chart-derived propensity without diluting overall wealth status', () => {
      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'WEAK'
        },
        timingSynthesis: speculationTiming('SUPPORTS'),
        d2Relationship: 'CONFIRMS'
      };

      const result = synthesizeWealthFinal(input);

      // Foundational wealth capacity is unaffected by high-variance speculation
      expect(result.status).toBe('STRONG');
      expect(result.finalStatus).toBe('STRONG');
      expect(result.speculativePropensity).toBe('CHALLENGED');
      expect(result.riskProfile).toBe('HIGH');
      expect(result.strongestAreas).toContain('ACCUMULATION');
      expect(result.strongestAreas).toContain('GAINS');
      expect(result.challengedAreas).toContain('SPECULATION');
    });

    it('does not let a D2 conflict declaration alter CW-05 promise, confidence, or availability', () => {
      const base: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG',
          GAINS: 'STRONG',
          FORTUNE: 'STRONG',
          SPECULATION: 'STRONG'
        },
        d2Relationship: 'UNAVAILABLE'
      };
      const unavailable = synthesizeWealthFinal(base);
      const conflictingDeclaration = synthesizeWealthFinal({ ...base, d2Relationship: 'CONFLICTS' });

      expect(conflictingDeclaration.divisionalStatus).toBe('UNAVAILABLE');
      expect(conflictingDeclaration.d2AvailabilityReason).toBeTruthy();
      expect(conflictingDeclaration.status).toBe(unavailable.status);
      expect(conflictingDeclaration.finalStatus).toBe(unavailable.finalStatus);
      expect(conflictingDeclaration.dimensions!.ACCUMULATION.status).toBe(unavailable.dimensions!.ACCUMULATION.status);
      expect(conflictingDeclaration.confidence).toBe(unavailable.confidence);
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

    it('deduplicates provenance IDs using Set and leaves wealth activation fields undefined', () => {
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
                id: 'FACT-DUPLICATE',
                dimension: 'ACCUMULATION',
                direction: 'SUPPORT',
                weight: 1.0,
                source: 'NATAL',
                statement: 'Factor 1',
                evidenceIds: ['EV-DUPLICATE', 'EV-1']
              },
              {
                id: 'FACT-DUPLICATE',
                dimension: 'ACCUMULATION',
                direction: 'SUPPORT',
                weight: 1.0,
                source: 'NATAL',
                statement: 'Factor 1 duplicate ID',
                evidenceIds: ['EV-DUPLICATE', 'EV-2']
              }
            ],
            summary: 'Accumulation'
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
            summary: 'Gains'
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
            summary: 'Fortune'
          },
          SPECULATION: {
            reasoningVersion: 'CW-04',
            dimension: 'SPECULATION',
            status: 'SUPPORTED',
            confidence: 'HIGH',
            natalSupport: 'SUPPORT',
            dashaSupport: 'SUPPORT',
            transitSupport: 'NEUTRAL',
            d2Support: 'SUPPORT',
            factors: [],
            summary: 'Speculation'
          }
        },
        summary: 'Manifestation summary'
      };

      const input: WealthFinalSynthesisInput = {
        natalPromise: {
          ACCUMULATION: 'STRONG'
        },
        manifestationSynthesis: mockManifestations,
        d2Relationship: 'CONFIRMS',
        natalEvidenceIds: ['NATAL-EV-DUP', 'NATAL-EV-DUP'],
        natalRuleIds: ['NATAL-R-DUP', 'NATAL-R-DUP']
      };

      const result = synthesizeWealthFinal(input);

      // Verify Set-based deduplication
      const duplicateEvidenceCount = result.evidenceIds.filter((id) => id === 'EV-DUPLICATE').length;
      expect(duplicateEvidenceCount).toBe(1);

      const duplicateRuleCount = result.ruleIds.filter((id) => id === 'FACT-DUPLICATE').length;
      expect(duplicateRuleCount).toBe(1);

      // Verify wealth activation metadata fields remain undefined
      expect(result.activationConfidence).toBeUndefined();
      expect(result.activationStrength).toBeUndefined();
      expect(result.activationSummary).toBeUndefined();
      expect(result.activationHierarchy).toBeUndefined();
      expect(result.dimensions!.ACCUMULATION.activationConfidence).toBeUndefined();
      expect(result.dimensions!.ACCUMULATION.activationStrength).toBeUndefined();
    });
  });
});
