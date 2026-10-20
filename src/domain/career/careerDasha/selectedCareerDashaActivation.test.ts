import {
  buildSelectedCareerDashaActivation
} from './selectedCareerDashaActivation';

import type {
  SelectedPeriodActivationContext
} from '../../../core/analysis';

import {
  SELECTED_PERIOD_CONTEXT_VERSION,
  MD_AD_PERIOD_RESOLVER_VERSION,
  createSelectedPeriodId
} from '../../../core/analysis';

import {
  DashaSystem
} from '../../../types';

import type {
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';

import {
  Planet
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression,
  CareerExpressionEvidence
} from '../careerExpression';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  Horoscope
} from '../../../types';

import {
  calculateHoroscope
} from '../../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../../test/fixtures/canonicalChart';

import type {
  CareerExpressionCanonicalResult,
  CareerExpressionCanonicalCandidate
} from '../careerExpression/careerExpressionTypes';

import type {
  CareerMechanismCandidate,
  CareerMechanismType,
  CareerMechanismPathway
} from '../careerMechanism/careerMechanismTypes';

import type {
  ParticipantId
} from '../careerParticipantRoles';

import {
  buildCanonicalCareerFoundation
} from '../orchestration/canonicalCareerFoundationBuilder';

import {
  defaultCareerExpressionResolver
} from '../careerExpression/defaultCareerExpressionResolver';

import {
  adaptMechanismExpressionToLegacy
} from '../careerExpression/mechanismExpressionToLegacyAdapter';

function makeMinimalNatalAnalysis(): CareerNatalAnalysis {
  return Object.freeze({
    structural: Object.freeze({
      direction: 'SUPPORT' as CareerStructuralDirection,
      strength: 'STRONG' as CareerStructuralStrength,
      primarySupport: 5,
      primaryChallenge: 0,
      supportingSupport: 3,
      supportingChallenge: 1,
      challengingSupport: 1,
      challengingChallenge: 3,
      mixedWeight: 0,
      evidence: Object.freeze([]),
      primaryEvidenceIds: Object.freeze([]),
      supportingEvidenceIds: Object.freeze([]),
      challengingEvidenceIds: Object.freeze([]),
      conflicts: Object.freeze([]),
      statement: 'Strong structural support for career.'
    } as any),
    relevance: Object.freeze([]),
    condition: Object.freeze([]),
    lordRelationships: Object.freeze([]),
    direction: 'SUPPORT',
    strength: 'STRONG',
    evidence: Object.freeze([]),
    conflicts: Object.freeze([]),
    reasoningTrace: Object.freeze({
      primaryPromise: Object.freeze([]),
      secondarySupport: Object.freeze([]),
      modifiers: Object.freeze([]),
      yogas: Object.freeze([]),
      varga: Object.freeze([]),
      dasha: Object.freeze([]),
      transit: Object.freeze([])
    })
  });
}

function makeExpressionAnalysisWithLinkedEvidence(): CareerExpressionAnalysis {
  // P1: Use planet-based linkage - evidence planets must match selected MD/AD planets
  // Selected period has SATURN (MD) and JUPITER (AD)
  const evidence1: CareerExpressionEvidence = Object.freeze({
    id: 'expr-evidence-1',
    mode: 'LEADERSHIP' as any,
    role: 'PLANETARY' as any,
    statement: 'Leadership expression evidence 1 (linked to MD via SATURN)',
    weight: 2.0,
    planets: [Planet.SATURN],
    houses: [10]
  });

  const evidence2: CareerExpressionEvidence = Object.freeze({
    id: 'expr-evidence-2',
    mode: 'LEADERSHIP' as any,
    role: 'PLANETARY' as any,
    statement: 'Leadership expression evidence 2 (linked to AD via JUPITER)',
    weight: 1.5,
    planets: [Planet.JUPITER],
    houses: [7]
  });

  const evidence3: CareerExpressionEvidence = Object.freeze({
    id: 'expr-evidence-3',
    mode: 'TECHNICAL_SPECIALIZATION' as any,
    role: 'PLANETARY' as any,
    statement: 'Technical expression evidence 3 (unmatched - MERCURY not in MD/AD)',
    weight: 1.0,
    planets: [Planet.MERCURY],
    houses: [1]
  });

  const expression1: CareerExpression = Object.freeze({
    mode: 'LEADERSHIP' as any,
    direction: 'SUPPORTED' as any,
    strength: 'STRONG' as any,
    evidence: Object.freeze([evidence1, evidence2]),
    supportingEvidenceIds: Object.freeze([]),
    statement: 'Leadership expression',
    conditional: false
  });

  const expression2: CareerExpression = Object.freeze({
    mode: 'TECHNICAL_SPECIALIZATION' as any,
    direction: 'SUPPORTED' as any,
    strength: 'MODERATE' as any,
    evidence: Object.freeze([evidence3]),
    supportingEvidenceIds: Object.freeze([]),
    statement: 'Technical expression',
    conditional: false
  });

  return Object.freeze({
    expressions: Object.freeze([expression1, expression2]),
    primaryExpression: undefined,
    statement: 'Expression analysis with linked and unmatched evidence'
  });
}

function makeHoroscope(): Horoscope {
  return calculateHoroscope(CANONICAL_BIRTH_DETAILS);
}

function makeSelectedPeriod(overrides: Partial<SelectedPeriodActivationContext> = {}): SelectedPeriodActivationContext {
  // Create minimal but valid DashaMahadashaInterpretation and DashaAntardashaInterpretation nodes
  const mahadashaNode: DashaMahadashaInterpretation = Object.freeze({
    planet: Planet.SATURN,
    start: '2020-01-01',
    end: '2025-01-01',
    natal: Object.freeze({
      planet: Planet.SATURN,
      dignity: 'OWN_SIGN' as any,
      strength: 'STRONG' as any,
      activation: 'ACTIVE' as any
    } as any),
    antardashas: Object.freeze([]),
    evidence: Object.freeze([]),
    confidence: 'HIGH' as any
  });

  const antardashaNode: DashaAntardashaInterpretation = Object.freeze({
    planet: Planet.JUPITER,
    start: '2020-01-01',
    end: '2022-01-01',
    natal: Object.freeze({
      planet: Planet.JUPITER,
      dignity: 'OWN_SIGN' as any,
      strength: 'STRONG' as any,
      activation: 'ACTIVE' as any
    } as any),
    pratyantardashas: Object.freeze([]),
    evidence: Object.freeze([]),
    confidence: 'HIGH' as any
  });

  const mahadashaId = 'md-saturn-2020-2025';
  const antardashaId = 'ad-jupiter-2020-2022';

  return Object.freeze({
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: createSelectedPeriodId(mahadashaId, antardashaId),
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2021-06-15',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: Object.freeze({
      start: '2020-01-01',
      end: '2022-01-01'
    }),
    mahadasha: Object.freeze({
      id: mahadashaId,
      planet: Planet.SATURN,
      start: '2020-01-01',
      end: '2025-01-01'
    }),
    antardasha: Object.freeze({
      id: antardashaId,
      mahadashaId,
      planet: Planet.JUPITER,
      start: '2020-01-01',
      end: '2022-01-01'
    }),
    mahadashaNode,
    antardashaNode,
    ...overrides
  });
}

describe('PBA-04: Selected Career Dasha Activation', () => {
  describe('Real-chart regression test (Part 2)', () => {
    it('reproduces UNAVAILABLE qualification basis for CANONICAL_BIRTH_DETAILS with genuinely empty canonical candidates', async () => {
      // Use the real CANONICAL_BIRTH_DETAILS horoscope (not mocked)
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Build the canonical career foundation to get the actual mechanism candidates
      // This will be empty for this chart (per Part 1 investigation findings)
      const canonicalCareerFoundation = buildCanonicalCareerFoundation({
        horoscope,
        enableDispositorContexts: false // Production default
      });

      // Extract the actual mechanism candidates from the foundation
      const careerMechanismCandidates = Object.freeze(
        canonicalCareerFoundation.resolvedMechanisms.map(m => m.candidate)
      );

      // Build canonical expression from the empty mechanism candidates
      const mechanismExpressionResult = defaultCareerExpressionResolver.resolve({
        careerMechanismCandidates,
        careerMechanismRefinements: undefined,
        career10HFoundation: undefined,
        career10LFoundation: undefined
      });

      const canonicalExpressionAnalysis = adaptMechanismExpressionToLegacy(
        mechanismExpressionResult,
        careerMechanismCandidates
      );

      // Build minimal natal analysis (structural only, as the full natal analysis is not the focus)
      const natal = makeMinimalNatalAnalysis();

      // Create a selected period context
      // Use the existing makeSelectedPeriod helper which creates a valid context
      // The specific MD/AD planets don't matter for testing the UNAVAILABLE path
      const selectedPeriod = makeSelectedPeriod();

      // Call the selected-period builder with the real inputs
      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression: canonicalExpressionAnalysis,
        selectedPeriod,
        canonicalExpression: mechanismExpressionResult,
        mechanismCandidates: careerMechanismCandidates
      });

      // Debug: log the result if it fails
      if (!result.ok) {
        console.log('Result error:', result.error);
      }

      // Assert the result is successful
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Per Part 1 investigation findings, canonical candidates are genuinely empty
        // for this chart due to rule coverage gap (pattern does not match dusthana transformation rules)
        // Therefore, qualificationBasis should be UNAVAILABLE
        expect(result.value.qualificationBasis).toBe('UNAVAILABLE');

        // Verify that mechanism candidates are indeed empty (reproducing the investigation condition)
        expect(careerMechanismCandidates.length).toBe(0);

        // Verify expression activations are empty (no canonical candidates to link)
        expect(result.value.expressionActivations).toEqual([]);

        // This test confirms the UNAVAILABLE path is correctly triggered for genuinely empty
        // canonical candidates, not as a silent fallback from a successful canonical result
      }
    });
  });

  describe('P1: Expression row only when planet-linked', () => {
    it('emits expression row only when expression evidence planets include selected MD or AD planet', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have expression activations for expressions with planet linkage
        expect(result.value.expressionActivations).toBeDefined();
        expect(Array.isArray(result.value.expressionActivations)).toBe(true);

        // Leadership expression has SATURN and JUPITER in evidence, so it should be linked
        expect(result.value.expressionActivations.length).toBeGreaterThan(0);

        // Check that expressionEvidenceIds are the original C8 evidence IDs
        for (const activation of result.value.expressionActivations) {
          expect(activation.expressionEvidenceIds).toBeDefined();
          expect(Array.isArray(activation.expressionEvidenceIds)).toBe(true);
          // These should be the expression evidence IDs (e.g., 'expr-evidence-1', 'expr-evidence-2')
          expect(activation.expressionEvidenceIds.every(id => id.startsWith('expr-evidence-'))).toBe(true);
        }

        // Check that mdDashaEvidenceIds and adDashaEvidenceIds are the C9 canonical evidence IDs
        for (const activation of result.value.expressionActivations) {
          expect(activation.mdDashaEvidenceIds).toBeDefined();
          expect(Array.isArray(activation.mdDashaEvidenceIds)).toBe(true);
          expect(activation.adDashaEvidenceIds).toBeDefined();
          expect(Array.isArray(activation.adDashaEvidenceIds)).toBe(true);
          // These should be C9 canonical IDs (e.g., 'CAREER_DASHA:MD:SATURN:...')
          activation.mdDashaEvidenceIds.forEach(id => {
            expect(id).toMatch(/^CAREER_DASHA:/);
          });
          activation.adDashaEvidenceIds.forEach(id => {
            expect(id).toMatch(/^CAREER_DASHA:/);
          });
        }
      }
    });

    it('expression without planet linkage is absent from rows (not a negative result)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Check that unmatched evidence is reported
        expect(result.value.unmatchedExpressionEvidenceIds).toBeDefined();
        expect(Array.isArray(result.value.unmatchedExpressionEvidenceIds)).toBe(true);

        // The unmatched evidence should include the technical expression evidence
        // which has MERCURY in planets (not in MD/AD which are SATURN/JUPITER)
        expect(result.value.unmatchedExpressionEvidenceIds).toContain('expr-evidence-3');
      }
    });
  });

  describe('Unmatched expression evidence IDs reported', () => {
    it('reports all expression evidence IDs not linked to any selected activation', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Unmatched IDs should be a frozen array
        expect(Object.isFrozen(result.value.unmatchedExpressionEvidenceIds)).toBe(true);

        // Should be sorted
        const sorted = [...result.value.unmatchedExpressionEvidenceIds].sort();
        expect(result.value.unmatchedExpressionEvidenceIds).toEqual(sorted);
      }
    });
  });

  describe('No-expression case', () => {
    it('returns empty expressionActivations when expression.expressions is empty', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([]),
        primaryExpression: undefined,
        statement: 'No expressions'
      });
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have empty expression activations
        expect(result.value.expressionActivations).toEqual([]);
        expect(result.value.unmatchedExpressionEvidenceIds).toEqual([]);
      }
    });
  });

  describe('expressionRefKey determinism', () => {
    it('produces deterministic expressionRefKey from mode:direction: + sorted expression evidence IDs', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result1 = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      const result2 = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        // expressionRefKeys should be identical across runs
        expect(result1.value.expressionActivations.length).toBe(result2.value.expressionActivations.length);

        for (let i = 0; i < result1.value.expressionActivations.length; i++) {
          expect(result1.value.expressionActivations[i].expressionRefKey)
            .toBe(result2.value.expressionActivations[i].expressionRefKey);
        }
      }
    });

    it('expressionRefKey format is mode:direction:sortedExpressionEvidenceIds', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Check expressionRefKey format for each activation
        for (const activation of result.value.expressionActivations) {
          // Should start with mode:direction:
          expect(activation.expressionRefKey).toMatch(/^[A-Z_]+:[A-Z_]+:/);
        }
      }
    });
  });

  describe('selectedPeriodId passthrough', () => {
    it('passes selectedPeriodId through to result', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.selectedPeriodId).toBe(selectedPeriod.selectedPeriodId);
      }
    });
  });

  describe('Interval preservation', () => {
    it('preserves AD interval verbatim from selectedPeriod', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interval.start).toBe('2020-01-01');
        expect(result.value.interval.end).toBe('2022-01-01');
      }
    });
  });

  describe('Temporal relation', () => {
    it('uses temporalRelation from PBA-03 context', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();

      // Test with a past period
      // Need to ensure the interval is contained within MD interval (2020-2025)
      const pastAdId = 'ad-jupiter-2020-2021';
      const pastPeriod = makeSelectedPeriod({
        temporalRelation: 'PAST',
        analysisAsOf: '2025-06-15',
        selectedPeriodId: createSelectedPeriodId('md-saturn-2020-2025', pastAdId),
        interval: Object.freeze({
          start: '2020-01-01',
          end: '2021-01-01'
        }),
        antardasha: Object.freeze({
          id: pastAdId,
          mahadashaId: 'md-saturn-2020-2025',
          planet: Planet.JUPITER,
          start: '2020-01-01',
          end: '2021-01-01'
        }),
        antardashaNode: Object.freeze({
          planet: Planet.JUPITER,
          start: '2020-01-01',
          end: '2021-01-01',
          natal: Object.freeze({
            planet: Planet.JUPITER,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          pratyantardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const pastResult = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod: pastPeriod
      });

      expect(pastResult.ok).toBe(true);
      if (pastResult.ok) {
        expect(pastResult.value.temporalRelation).toBe('PAST');
      }

      // Test with a future period
      // Need to ensure the interval is contained within MD interval (2020-2025)
      const futureAdId = 'ad-jupiter-2023-2024';
      const futurePeriod = makeSelectedPeriod({
        temporalRelation: 'FUTURE',
        analysisAsOf: '2019-06-15',
        selectedPeriodId: createSelectedPeriodId('md-saturn-2020-2025', futureAdId),
        interval: Object.freeze({
          start: '2023-01-01',
          end: '2024-01-01'
        }),
        antardasha: Object.freeze({
          id: futureAdId,
          mahadashaId: 'md-saturn-2020-2025',
          planet: Planet.JUPITER,
          start: '2023-01-01',
          end: '2024-01-01'
        }),
        antardashaNode: Object.freeze({
          planet: Planet.JUPITER,
          start: '2023-01-01',
          end: '2024-01-01',
          natal: Object.freeze({
            planet: Planet.JUPITER,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          pratyantardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const futureResult = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod: futurePeriod
      });

      expect(futureResult.ok).toBe(true);
      if (futureResult.ok) {
        expect(futureResult.value.temporalRelation).toBe('FUTURE');
      }
    });
  });

  describe('Canonical Dasha analysis', () => {
    it('includes canonicalDashaAnalysis in result', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canonicalDashaAnalysis).toBeDefined();
        expect(result.value.canonicalDashaAnalysis.md).toBeDefined();
        expect(result.value.canonicalDashaAnalysis.ad).toBeDefined();
        expect(result.value.canonicalDashaAnalysis.pd).toBeDefined();
      }
    });

    it('canonicalDashaAnalysis has PD as INSUFFICIENT_DATA', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canonicalDashaAnalysis.pd.effect).toBe('INSUFFICIENT_DATA');
        expect(result.value.canonicalDashaAnalysis.pd.planet).toBeUndefined();
      }
    });
  });

  describe('Deterministic statement', () => {
    it('produces deterministic statement summarizing selected activation', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result1 = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      const result2 = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.statement).toBe(result2.value.statement);
        expect(result1.value.statement).toContain(selectedPeriod.selectedPeriodId);
      }
    });
  });

  describe('P2: selectedDashaInterpretation includes node references', () => {
    it('includes selectedDashaInterpretation with mahadashaNode and antardashaNode references', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.selectedDashaInterpretation).toBeDefined();
        expect(result.value.selectedDashaInterpretation.mahadashaNode).toBe(selectedPeriod.mahadashaNode);
        expect(result.value.selectedDashaInterpretation.antardashaNode).toBe(selectedPeriod.antardashaNode);
      }
    });

    it('selectedDashaInterpretation nodes are toBe identical to input context nodes', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.selectedDashaInterpretation.mahadashaNode).toBe(selectedPeriod.mahadashaNode);
        expect(result.value.selectedDashaInterpretation.antardashaNode).toBe(selectedPeriod.antardashaNode);
      }
    });
  });

  describe('P1: Validation errors', () => {
    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when dashaSystem is not VIMSHOTTARI', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        dashaSystem: 'OTHER_SYSTEM' as any // Invalid dasha system
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when level is not MD_AD', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        level: 'MD' as any // Invalid level
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when intervalSemantics is not [start,end)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        intervalSemantics: '[start,end]' as any // Invalid semantics
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when mahadasha context and node mismatch', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        mahadasha: Object.freeze({
          id: 'md-saturn-2020-2025',
          planet: Planet.MARS, // Mismatch with node
          start: '2020-01-01',
          end: '2025-01-01'
        }),
        mahadashaNode: Object.freeze({
          planet: Planet.SATURN, // Node still has SATURN - mismatch
          start: '2020-01-01',
          end: '2025-01-01',
          natal: Object.freeze({
            planet: Planet.SATURN,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          antardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when antardasha context and node mismatch', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        antardasha: Object.freeze({
          id: 'ad-jupiter-2020-2022',
          mahadashaId: 'md-saturn-2020-2025',
          planet: Planet.VENUS, // Mismatch with node
          start: '2020-01-01',
          end: '2022-01-01'
        }),
        antardashaNode: Object.freeze({
          planet: Planet.JUPITER, // Node still has JUPITER - mismatch
          start: '2020-01-01',
          end: '2022-01-01',
          natal: Object.freeze({
            planet: Planet.JUPITER,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          pratyantardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when interval start >= end', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        interval: Object.freeze({
          start: '2022-01-01', // Invalid: start >= end
          end: '2020-01-01'
        }),
        antardasha: Object.freeze({
          id: 'ad-jupiter-2022-2020',
          mahadashaId: 'md-saturn-2020-2025',
          planet: Planet.JUPITER,
          start: '2022-01-01',
          end: '2020-01-01'
        }),
        antardashaNode: Object.freeze({
          planet: Planet.JUPITER,
          start: '2022-01-01',
          end: '2020-01-01',
          natal: Object.freeze({
            planet: Planet.JUPITER,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          pratyantardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT error when AD interval not contained in MD interval', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod({
        interval: Object.freeze({
          start: '2019-01-01', // AD starts before MD (2020-01-01)
          end: '2022-01-01'
        }),
        antardasha: Object.freeze({
          id: 'ad-jupiter-2019-2022',
          mahadashaId: 'md-saturn-2020-2025',
          planet: Planet.JUPITER,
          start: '2019-01-01',
          end: '2022-01-01'
        }),
        antardashaNode: Object.freeze({
          planet: Planet.JUPITER,
          start: '2019-01-01',
          end: '2022-01-01',
          natal: Object.freeze({
            planet: Planet.JUPITER,
            dignity: 'OWN_SIGN' as any,
            strength: 'STRONG' as any,
            activation: 'ACTIVE' as any
          } as any),
          pratyantardashas: Object.freeze([]),
          evidence: Object.freeze([]),
          confidence: 'HIGH' as any
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });
  });

  describe('Guardrails', () => {
    it('no new expressions created', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const expressionCountBefore = expression.expressions.length;
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Expression count should not change
        expect(expression.expressions.length).toBe(expressionCountBefore);

        // Expression activations should reference existing expressions
        for (const activation of result.value.expressionActivations) {
          expect(expression.expressions).toContain(activation.expression);
        }
      }
    });

    it('inputs not mutated', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const horoscopeBefore = JSON.stringify(horoscope);
      const natalBefore = JSON.stringify(natal);
      const expressionBefore = JSON.stringify(expression);
      const selectedPeriodBefore = JSON.stringify(selectedPeriod);

      buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(JSON.stringify(horoscope)).toBe(horoscopeBefore);
      expect(JSON.stringify(natal)).toBe(natalBefore);
      expect(JSON.stringify(expression)).toBe(expressionBefore);
      expect(JSON.stringify(selectedPeriod)).toBe(selectedPeriodBefore);
    });

    it('result is frozen', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.isFrozen(result.value)).toBe(true);
        expect(Object.isFrozen(result.value.expressionActivations)).toBe(true);
        expect(Object.isFrozen(result.value.unmatchedExpressionEvidenceIds)).toBe(true);
        expect(Object.isFrozen(result.value.interval)).toBe(true);
      }
    });
  });

  describe('Per-level linkage', () => {
    it('expression linked to MD only has empty adDashaEvidenceIds and linkedLevels === ["MD"]', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();

      // Expression with only SATURN in evidence (MD planet, not AD)
      const evidenceMdOnly: CareerExpressionEvidence = Object.freeze({
        id: 'expr-evidence-md-only',
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Leadership expression evidence (MD only)',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const expressionMdOnly: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([evidenceMdOnly]),
        supportingEvidenceIds: Object.freeze([]),
        statement: 'Leadership expression MD only',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([expressionMdOnly]),
        primaryExpression: undefined,
        statement: 'Expression with MD-only linkage'
      });

      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expressionActivations.length).toBe(1);
        const activation = result.value.expressionActivations[0];
        expect(activation.linkedLevels).toEqual(['MD']);
        expect(activation.mdDashaEvidenceIds.length).toBeGreaterThan(0);
        expect(activation.adDashaEvidenceIds).toEqual([]);
      }
    });

    it('expression linked to AD only has empty mdDashaEvidenceIds and linkedLevels === ["AD"]', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();

      // Expression with only JUPITER in evidence (AD planet, not MD)
      const evidenceAdOnly: CareerExpressionEvidence = Object.freeze({
        id: 'expr-evidence-ad-only',
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Leadership expression evidence (AD only)',
        weight: 2.0,
        planets: [Planet.JUPITER],
        houses: [7]
      });

      const expressionAdOnly: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([evidenceAdOnly]),
        supportingEvidenceIds: Object.freeze([]),
        statement: 'Leadership expression AD only',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([expressionAdOnly]),
        primaryExpression: undefined,
        statement: 'Expression with AD-only linkage'
      });

      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expressionActivations.length).toBe(1);
        const activation = result.value.expressionActivations[0];
        expect(activation.linkedLevels).toEqual(['AD']);
        expect(activation.mdDashaEvidenceIds).toEqual([]);
        expect(activation.adDashaEvidenceIds.length).toBeGreaterThan(0);
      }
    });

    it('expression linked to both MD and AD has both evidence arrays populated and linkedLevels === ["MD", "AD"]', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expressionActivations.length).toBe(1);
        const activation = result.value.expressionActivations[0];
        expect(activation.linkedLevels).toEqual(['MD', 'AD']);
        expect(activation.mdDashaEvidenceIds.length).toBeGreaterThan(0);
        expect(activation.adDashaEvidenceIds.length).toBeGreaterThan(0);
      }
    });

    it('expression with no MD/AD planet in evidence does NOT link even with mechanismAwareInput (regression for global-union bug)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();

      // Expression with MERCURY (not in MD/AD which are SATURN/JUPITER)
      const evidenceNoMatch: CareerExpressionEvidence = Object.freeze({
        id: 'expr-evidence-no-match',
        mode: 'TECHNICAL_SPECIALIZATION' as any,
        role: 'PLANETARY' as any,
        statement: 'Technical expression evidence (no match)',
        weight: 1.0,
        planets: [Planet.MERCURY],
        houses: [1]
      });

      const expressionNoMatch: CareerExpression = Object.freeze({
        mode: 'TECHNICAL_SPECIALIZATION' as any,
        direction: 'SUPPORTED' as any,
        strength: 'MODERATE' as any,
        evidence: Object.freeze([evidenceNoMatch]),
        supportingEvidenceIds: Object.freeze([]),
        statement: 'Technical expression no match',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([expressionNoMatch]),
        primaryExpression: undefined,
        statement: 'Expression with no linkage'
      });

      const selectedPeriod = makeSelectedPeriod();

      // mechanismAwareInput with SATURN (MD planet) should NOT cause linkage
      // because expression.evidence[].planets does not include SATURN
      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        mechanismAwareInput: Object.freeze({
          mechanismId: 'test-mechanism',
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          sourceEvidenceIds: Object.freeze([]),
          ruleIds: Object.freeze([])
        })
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Expression should NOT be linked (no row)
        expect(result.value.expressionActivations.length).toBe(0);
        // Evidence should be unmatched
        expect(result.value.unmatchedExpressionEvidenceIds).toContain('expr-evidence-no-match');
      }
    });
  });

  describe('Evidence attribution scope', () => {
    it('mdDashaEvidenceIds and adDashaEvidenceIds contain all C9 evidence for the linked level (not planet-specific)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // For expressions linked to MD, mdDashaEvidenceIds should contain ALL C9 MD evidence
        // not just evidence specific to the MD planet
        const mdLinkedActivations = result.value.expressionActivations.filter(
          a => a.linkedLevels.includes('MD')
        );

        for (const activation of mdLinkedActivations) {
          // mdDashaEvidenceIds should be non-empty (contains all C9 MD evidence)
          expect(activation.mdDashaEvidenceIds.length).toBeGreaterThan(0);
          // All IDs should be C9 evidence IDs (start with CAREER_DASHA:)
          activation.mdDashaEvidenceIds.forEach(id => {
            expect(id).toMatch(/^CAREER_DASHA:/);
          });
        }

        // For expressions linked to AD, adDashaEvidenceIds should contain ALL C9 AD evidence
        const adLinkedActivations = result.value.expressionActivations.filter(
          a => a.linkedLevels.includes('AD')
        );

        for (const activation of adLinkedActivations) {
          // adDashaEvidenceIds should be non-empty (contains all C9 AD evidence)
          expect(activation.adDashaEvidenceIds.length).toBeGreaterThan(0);
          // All IDs should be C9 evidence IDs (start with CAREER_DASHA:)
          activation.adDashaEvidenceIds.forEach(id => {
            expect(id).toMatch(/^CAREER_DASHA:/);
          });
        }

        // Contract: These arrays are level-scoped, not planet-scoped
        // This test asserts the documented contract in SelectedExpressionActivation JSDoc
      }
    });
  });

  describe('P1: Qualified-only planet linkage', () => {
    it('omits expression when ONLY MD/AD-planet-bearing evidence is unqualified (CANONICAL_STATUS)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Create caller expression with SATURN (MD planet) in evidence, but the evidence ID is unqualified
      const unqualifiedEvidenceId = 'unqualified-evidence-saturn';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: unqualifiedEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Leadership expression evidence with SATURN (unqualified)',
        weight: 2.0,
        planets: [Planet.SATURN], // MD planet
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([unqualifiedEvidenceId]),
        statement: 'Leadership expression with unqualified MD planet evidence',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Expression with unqualified MD planet evidence'
      });

      // Create CANDIDATE canonical candidate with the same evidence ID (unqualified)
      const candidateCanonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-CANDIDATE',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: unqualifiedEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'CANDIDATE',
        direction: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        qualification: Object.freeze({
          qualificationStatus: 'CANDIDATE',
          ruleIds: Object.freeze([]),
          provenance: Object.freeze({
            candidateId: 'EXPR-CANDIDATE',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze([]),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: undefined
          })
        }),
        trace: Object.freeze(['Candidate without qualification'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([candidateCanonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Expression should NOT emit a row because its only MD-planet-bearing evidence is unqualified
        expect(result.value.expressionActivations.length).toBe(0);
      }
    });

    it('emits expression when at least one MD/AD-planet-bearing evidence is qualified (CANONICAL_STATUS)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Create caller expression with two evidence items: one qualified (SATURN), one unqualified (JUPITER)
      const qualifiedEvidenceId = 'qualified-evidence-saturn';
      const unqualifiedEvidenceId = 'unqualified-evidence-jupiter';

      const qualifiedEvidence: CareerExpressionEvidence = Object.freeze({
        id: qualifiedEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Leadership expression evidence with SATURN (qualified)',
        weight: 2.0,
        planets: [Planet.SATURN], // MD planet
        houses: [10]
      });

      const unqualifiedEvidence: CareerExpressionEvidence = Object.freeze({
        id: unqualifiedEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Leadership expression evidence with JUPITER (unqualified)',
        weight: 1.5,
        planets: [Planet.JUPITER], // AD planet
        houses: [7]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([qualifiedEvidence, unqualifiedEvidence]),
        supportingEvidenceIds: Object.freeze([qualifiedEvidenceId, unqualifiedEvidenceId]),
        statement: 'Leadership expression with mixed provenance',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Expression with mixed provenance'
      });

      // Create QUALIFIED canonical candidate with the qualified evidence ID
      const qualifiedCanonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-QUALIFIED',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: qualifiedEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-QUALIFIED',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      // Create CANDIDATE canonical candidate with the unqualified evidence ID
      const candidateCanonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-CANDIDATE',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-002']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: unqualifiedEvidenceId,
            sourceMechanismId: 'MECH-002',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-002',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-002']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'CANDIDATE',
        direction: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        qualification: Object.freeze({
          qualificationStatus: 'CANDIDATE',
          ruleIds: Object.freeze([]),
          provenance: Object.freeze({
            candidateId: 'EXPR-CANDIDATE',
            mechanismId: 'MECH-002',
            sourceMechanismIds: Object.freeze(['MECH-002']),
            ruleIds: Object.freeze([]),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:JUPITER' as ParticipantId]),
            identityKey: undefined
          })
        }),
        trace: Object.freeze(['Candidate without qualification'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([qualifiedCanonicalCandidate, candidateCanonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001', 'MECH-002']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001', 'MECH-002']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate1: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism 1'
      });

      const mechanismCandidate2: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-002',
        patternId: 'PATTERN-002',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-002']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:JUPITER' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism 2'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate1, mechanismCandidate2])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Expression SHOULD emit a row because at least one MD-planet-bearing evidence is qualified
        expect(result.value.expressionActivations.length).toBe(1);
        // Should be linked to MD (SATURN from qualified evidence)
        expect(result.value.expressionActivations[0].linkedLevels).toContain('MD');
      }
    });
  });

  describe('P2: Explicit identity mapping (containment check)', () => {
    it('matches caller expression when ALL candidate evidence IDs are in supportingEvidenceIds (containment)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with two supporting evidence IDs
      const evidenceId1 = 'evidence-001';
      const evidenceId2 = 'evidence-002';

      const callerEvidence1: CareerExpressionEvidence = Object.freeze({
        id: evidenceId1,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 1',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerEvidence2: CareerExpressionEvidence = Object.freeze({
        id: evidenceId2,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 2',
        weight: 1.5,
        planets: [Planet.JUPITER],
        houses: [7]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence1, callerEvidence2]),
        supportingEvidenceIds: Object.freeze([evidenceId1, evidenceId2]),
        statement: 'Caller expression with two evidence IDs',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // Canonical candidate with BOTH evidence IDs (full containment)
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: evidenceId1,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          }),
          Object.freeze({
            evidenceId: evidenceId2,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'REFINING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should match because ALL candidate evidence IDs are in supportingEvidenceIds
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expression).toBe(callerExpression);
        expect(result.value.expressionActivations[0].expressionSource).toBe('CALLER');
      }
    });

    it('does NOT match caller expression with PARTIAL overlap of candidate evidence IDs (not containment)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with two supporting evidence IDs
      const evidenceId1 = 'evidence-001';
      const evidenceId2 = 'evidence-002';

      const callerEvidence1: CareerExpressionEvidence = Object.freeze({
        id: evidenceId1,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 1',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerEvidence2: CareerExpressionEvidence = Object.freeze({
        id: evidenceId2,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 2',
        weight: 1.5,
        planets: [Planet.JUPITER],
        houses: [7]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence1, callerEvidence2]),
        supportingEvidenceIds: Object.freeze([evidenceId1, evidenceId2]),
        statement: 'Caller expression with two evidence IDs',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // Canonical candidate with THREE evidence IDs (caller only has two - partial overlap, not containment)
      const evidenceId3 = 'evidence-003';
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: evidenceId1,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          }),
          Object.freeze({
            evidenceId: evidenceId2,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'REFINING'
          }),
          Object.freeze({
            evidenceId: evidenceId3, // Caller does NOT have this evidence ID
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'REFINING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should NOT match because NOT ALL candidate evidence IDs are in supportingEvidenceIds
        // Falls back to adapter-derived expression
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expression).not.toBe(callerExpression);
        expect(result.value.expressionActivations[0].expressionSource).toBe('ADAPTER_FALLBACK');
      }
    });

    it('caller expression overlapping two QUALIFIED candidates → ambiguous match, omitted (conservative)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with three supporting evidence IDs
      const sharedEvidenceId = 'shared-evidence-001';
      const candidate1EvidenceId = 'candidate1-evidence-002';
      const candidate2EvidenceId = 'candidate2-evidence-003';

      const callerEvidence1: CareerExpressionEvidence = Object.freeze({
        id: sharedEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Shared evidence',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerEvidence2: CareerExpressionEvidence = Object.freeze({
        id: candidate1EvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Candidate 1 evidence',
        weight: 1.5,
        planets: [Planet.JUPITER],
        houses: [7]
      });

      const callerEvidence3: CareerExpressionEvidence = Object.freeze({
        id: candidate2EvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Candidate 2 evidence',
        weight: 1.0,
        planets: [Planet.MERCURY],
        houses: [1]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence1, callerEvidence2, callerEvidence3]),
        supportingEvidenceIds: Object.freeze([sharedEvidenceId, candidate1EvidenceId, candidate2EvidenceId]),
        statement: 'Caller expression overlapping two candidates',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // First QUALIFIED candidate with sharedEvidenceId + candidate1EvidenceId
      const canonicalCandidate1: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: sharedEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          }),
          Object.freeze({
            evidenceId: candidate1EvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'REFINING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression-1'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      // Second QUALIFIED candidate with sharedEvidenceId + candidate2EvidenceId
      const canonicalCandidate2: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-002',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-002']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: sharedEvidenceId,
            sourceMechanismId: 'MECH-002',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-002',
            role: 'ESTABLISHING'
          }),
          Object.freeze({
            evidenceId: candidate2EvidenceId,
            sourceMechanismId: 'MECH-002',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-002',
            role: 'REFINING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-002']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-002']),
          provenance: Object.freeze({
            candidateId: 'EXPR-002',
            mechanismId: 'MECH-002',
            sourceMechanismIds: Object.freeze(['MECH-002']),
            ruleIds: Object.freeze(['RULE-002']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:JUPITER' as ParticipantId]),
            identityKey: 'leadership-expression-2'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-002'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate1, canonicalCandidate2]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001', 'MECH-002']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001', 'MECH-002']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate1: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism 1'
      });

      const mechanismCandidate2: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-002',
        patternId: 'PATTERN-002',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-002']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:JUPITER' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism 2'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate1, mechanismCandidate2])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Ambiguous match: caller expression matches TWO QUALIFIED candidates
        // Conservative handling: expression is omitted (not treated as reliably identified)
        // Falls back to adapter-derived expressions
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expressionSource).toBe('ADAPTER_FALLBACK');
        // The caller expression should NOT be used (ambiguous match)
        expect(result.value.expressionActivations[0].expression).not.toBe(callerExpression);
      }
    });

    it('caller expression matching exactly one QUALIFIED candidate → UNAMBIGUOUS match', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with two supporting evidence IDs
      const evidenceId1 = 'evidence-001';
      const evidenceId2 = 'evidence-002';

      const callerEvidence1: CareerExpressionEvidence = Object.freeze({
        id: evidenceId1,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 1',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerEvidence2: CareerExpressionEvidence = Object.freeze({
        id: evidenceId2,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Evidence 2',
        weight: 1.5,
        planets: [Planet.JUPITER],
        houses: [7]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence1, callerEvidence2]),
        supportingEvidenceIds: Object.freeze([evidenceId1, evidenceId2]),
        statement: 'Caller expression with two evidence IDs',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // Canonical candidate with BOTH evidence IDs (full containment)
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: evidenceId1,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          }),
          Object.freeze({
            evidenceId: evidenceId2,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'REFINING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should match because ALL candidate evidence IDs are in supportingEvidenceIds
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expression).toBe(callerExpression);
        expect(result.value.expressionActivations[0].expressionSource).toBe('CALLER');
        // Should be marked as UNAMBIGUOUS (exactly one match)
        expect(result.value.expressionActivations[0].matchBasis).toBe('UNAMBIGUOUS');
      }
    });
  });

  describe('P2: Zero-qualified regression test', () => {
    it('canonicalExpression with nonempty mechanismCandidates but zero QUALIFIED candidates → ok: true, empty expressionActivations, qualificationBasis CANONICAL_STATUS, no fallback', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with some evidence
      const callerEvidenceId = 'caller-evidence-001';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // Canonical result with CANDIDATE expressions only (zero QUALIFIED)
      const candidateCanonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-CANDIDATE',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: callerEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'CANDIDATE',
        direction: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        qualification: Object.freeze({
          qualificationStatus: 'CANDIDATE',
          ruleIds: Object.freeze([]),
          provenance: Object.freeze({
            candidateId: 'EXPR-CANDIDATE',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze([]),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: undefined
          })
        }),
        trace: Object.freeze(['Candidate without qualification'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([candidateCanonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be CANONICAL_STATUS (not fallback to PROXY_DIRECTION)
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should have empty expressionActivations (no QUALIFIED candidates)
        expect(result.value.expressionActivations).toEqual([]);
        // Caller expressions must NOT appear via fallback
        // (Already covered by empty expressionActivations)
      }
    });
  });

  describe('Canonical qualification boundary', () => {
    it('uses PROXY_DIRECTION when canonicalExpression is absent', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('PROXY_DIRECTION');
      }
    });

    it('returns INCOMPLETE_CANONICAL_INPUT error when only canonicalExpression is provided', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Create a minimal canonical result
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression
        // mechanismCandidates is intentionally omitted
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INCOMPLETE_CANONICAL_INPUT');
      }
    });

    it('returns INCOMPLETE_CANONICAL_INPUT error when only mechanismCandidates is provided', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Create minimal mechanism candidates
      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        mechanismCandidates: Object.freeze([mechanismCandidate])
        // canonicalExpression is intentionally omitted
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INCOMPLETE_CANONICAL_INPUT');
      }
    });

    it('returns INCOMPLETE_CANONICAL_INPUT error when canonicalExpression is present with explicitly empty mechanismCandidates array', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Create a minimal canonical result
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([]) // Explicitly empty array (genuinely no qualifying mechanisms)
      });

      // Changed behavior: empty mechanismCandidates now emits UNAVAILABLE instead of rejecting
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('UNAVAILABLE');
        expect(result.value.expressionActivations.length).toBe(0);
      }
    });

    it('uses CANONICAL_STATUS when canonicalExpression is provided with mechanismCandidates', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Create a minimal canonical result with QUALIFIED expressions
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      // Create minimal mechanism candidates
      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
      }
    });

    it('CANDIDATE expressions do not emit rows when using canonical qualification', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Create a canonical result with CANDIDATE expressions only
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'CANDIDATE',
        direction: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        qualification: Object.freeze({
          qualificationStatus: 'CANDIDATE',
          ruleIds: Object.freeze([]),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze([]),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: undefined
          })
        }),
        trace: Object.freeze(['Candidate without qualification'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // CANDIDATE expressions should not emit rows
        expect(result.value.expressionActivations.length).toBe(0);
      }
    });

    it('filters caller expressions by matching to QUALIFIED canonical candidates via evidence ID containment', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Create caller's expression with specific evidence IDs
      const callerEvidenceId = 'caller-evidence-001';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      // Create canonical candidate with matching evidence ID (full containment)
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: callerEvidenceId, // Match caller's evidence ID (full containment)
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should emit row for caller's expression (matched via evidence ID containment)
        expect(result.value.expressionActivations.length).toBe(1);
        // The expression should be the caller's expression, not adapter-derived
        expect(result.value.expressionActivations[0].expression).toBe(callerExpression);
      }
    });

    it('uses adapter-derived expressions when no reliable mapping to caller expressions exists', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Create caller's expression with evidence IDs that don't match canonical
      const callerEvidenceId = 'caller-evidence-no-match';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence (no match)',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression (no match)',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis (no match)'
      });

      // Create canonical candidate with different evidence ID (no match)
      const canonicalEvidenceId = 'canonical-evidence-001';
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: canonicalEvidenceId, // Different from caller's evidence ID
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should emit row using adapter-derived expression (fallback)
        expect(result.value.expressionActivations.length).toBe(1);
        // The expression should NOT be the caller's expression (no match)
        expect(result.value.expressionActivations[0].expression).not.toBe(callerExpression);
        // expressionRefKey should document that this is adapter-derived
        expect(result.value.expressionActivations[0].expressionRefKey).toContain('LEADERSHIP');
      }
    });

    it('splits supportingEvidenceIds into qualified vs unqualified portions when expression has mixed provenance', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Create caller's expression with two evidence IDs: one qualified, one unqualified
      // Only the qualified evidence ID is in the QUALIFIED canonical candidate
      const qualifiedEvidenceId = 'qualified-evidence-001';
      const unqualifiedEvidenceId = 'unqualified-evidence-002';

      const callerEvidence1: CareerExpressionEvidence = Object.freeze({
        id: qualifiedEvidenceId, // Match the qualified evidence ID (MD planet)
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence 1 (qualified)',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerEvidence2: CareerExpressionEvidence = Object.freeze({
        id: unqualifiedEvidenceId, // NOT in any QUALIFIED canonical candidate
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence 2 (unqualified)',
        weight: 1.5,
        planets: [Planet.JUPITER], // AD planet
        houses: [7]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence1, callerEvidence2]),
        supportingEvidenceIds: Object.freeze([qualifiedEvidenceId, unqualifiedEvidenceId]),
        statement: 'Caller expression with mixed provenance',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis with mixed provenance'
      });

      // Create QUALIFIED canonical candidate with ONLY the qualified evidence ID
      const qualifiedCanonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-QUALIFIED',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: qualifiedEvidenceId, // Only the qualified evidence ID
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-QUALIFIED',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([qualifiedCanonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Should match caller expression (containment: all candidate evidence IDs are in supportingEvidenceIds)
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expressionSource).toBe('CALLER');
        const activation = result.value.expressionActivations[0];
        // Caller expression has both qualified and unqualified evidence IDs
        expect(activation.qualifiedEvidenceIds).toEqual([qualifiedEvidenceId]);
        expect(activation.unqualifiedEvidenceIds).toEqual([unqualifiedEvidenceId]);
      }
    });

    it('marks expressionSource as CALLER when using caller expressions', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      const callerEvidenceId = 'caller-evidence-001';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis'
      });

      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: callerEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expressionSource).toBe('CALLER');
      }
    });

    it('marks expressionSource as ADAPTER_FALLBACK when using adapter-derived expressions', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      const callerEvidenceId = 'caller-evidence-no-match';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence (no match)',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression (no match)',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis (no match)'
      });

      const canonicalEvidenceId = 'canonical-evidence-001';
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-001',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: canonicalEvidenceId,
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-001',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expressionSource).toBe('ADAPTER_FALLBACK');
      }
    });

    it('QUALIFIED candidate with unrelated evidence + caller expression with different evidence → no match, ADAPTER_FALLBACK if linkable', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const selectedPeriod = makeSelectedPeriod();

      // Caller expression with evidence ID that does not match canonical
      const callerEvidenceId = 'caller-evidence-unrelated';
      const callerEvidence: CareerExpressionEvidence = Object.freeze({
        id: callerEvidenceId,
        mode: 'LEADERSHIP' as any,
        role: 'PLANETARY' as any,
        statement: 'Caller expression evidence (unrelated)',
        weight: 2.0,
        planets: [Planet.SATURN],
        houses: [10]
      });

      const callerExpression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP' as any,
        direction: 'SUPPORTED' as any,
        strength: 'STRONG' as any,
        evidence: Object.freeze([callerEvidence]),
        supportingEvidenceIds: Object.freeze([callerEvidenceId]),
        statement: 'Caller expression (unrelated)',
        conditional: false
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: Object.freeze([callerExpression]),
        primaryExpression: undefined,
        statement: 'Caller expression analysis (unrelated)'
      });

      // QUALIFIED canonical candidate with DIFFERENT evidence ID (not in caller's supportingEvidenceIds)
      const canonicalEvidenceId = 'canonical-evidence-different';
      const canonicalCandidate: CareerExpressionCanonicalCandidate = Object.freeze({
        expressionId: 'EXPR-DIFFERENT-EVIDENCE',
        expressionType: 'LEADERSHIP_EXPRESSION',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        mechanismTypes: Object.freeze(['AUTHORITY'] as CareerMechanismType[]),
        status: 'CANDIDATE',
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: canonicalEvidenceId, // Different from caller's evidence ID
            sourceMechanismId: 'MECH-001',
            sourceEvidenceIds: Object.freeze([]),
            ruleId: 'RULE-001',
            role: 'ESTABLISHING'
          })
        ]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        qualificationStatus: 'QUALIFIED',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        qualification: Object.freeze({
          qualificationStatus: 'QUALIFIED',
          ruleIds: Object.freeze(['RULE-001']),
          provenance: Object.freeze({
            candidateId: 'EXPR-DIFFERENT-EVIDENCE',
            mechanismId: 'MECH-001',
            sourceMechanismIds: Object.freeze(['MECH-001']),
            ruleIds: Object.freeze(['RULE-001']),
            sourceEvidenceIds: Object.freeze([]),
            participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
            identityKey: 'leadership-expression-different-evidence'
          })
        }),
        trace: Object.freeze(['Qualified by RULE-001'])
      });

      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([canonicalCandidate]),
        status: 'COMPLETE',
        sourceMechanismIds: Object.freeze(['MECH-001']),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze(['MECH-001']),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const mechanismCandidate: CareerMechanismCandidate = Object.freeze({
        candidateId: 'MECH-001',
        patternId: 'PATTERN-001',
        mechanismType: 'AUTHORITY' as CareerMechanismType,
        pathway: 'PRIMARY' as CareerMechanismPathway,
        evidence: Object.freeze([]),
        provenance: Object.freeze({
          patternIds: Object.freeze(['PATTERN-001']),
          relationshipIds: Object.freeze([]),
          participantIds: Object.freeze(['PLANET:SATURN' as ParticipantId]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        }),
        explanation: 'Test mechanism'
      });

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([mechanismCandidate])
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qualificationBasis).toBe('CANONICAL_STATUS');
        // Canonical candidate has different evidence ID - no containment match
        // Falls back to adapter-derived expression (since candidate is QUALIFIED and linkable via SATURN)
        expect(result.value.expressionActivations.length).toBe(1);
        expect(result.value.expressionActivations[0].expressionSource).toBe('ADAPTER_FALLBACK');
        // The caller expression should NOT be used (no containment match)
        expect(result.value.expressionActivations[0].expression).not.toBe(callerExpression);
      }
    });
  });

  describe('UNAVAILABLE qualification basis (empty mechanism candidates)', () => {
    it('emits UNAVAILABLE when canonical inputs provided but mechanismCandidates is empty', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Canonical expression result (empty expressions since no mechanisms)
      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([]),
        status: 'INSUFFICIENT_DATA',
        sourceMechanismIds: Object.freeze([]),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze([]),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      // Empty mechanism candidates array (genuinely no qualifying mechanisms for this chart)
      const mechanismCandidates: readonly CareerMechanismCandidate[] = Object.freeze([]);

      const result = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should emit UNAVAILABLE qualification basis (fail-closed semantics)
        expect(result.value.qualificationBasis).toBe('UNAVAILABLE');
        // No expression activations since no mechanisms
        expect(result.value.expressionActivations.length).toBe(0);
      }
    });

    it('distinguishes UNAVAILABLE from PROXY_DIRECTION (legacy caller)', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();
      const selectedPeriod = makeSelectedPeriod();

      // Case 1: UNAVAILABLE - canonical inputs provided but empty
      const canonicalExpression: CareerExpressionCanonicalResult = Object.freeze({
        expressions: Object.freeze([]),
        status: 'INSUFFICIENT_DATA',
        sourceMechanismIds: Object.freeze([]),
        missingInputs: Object.freeze([]),
        unmappedMechanismTypes: Object.freeze([]),
        provenance: Object.freeze({
          mechanismIds: Object.freeze([]),
          patternIds: Object.freeze([]),
          relationshipIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          sourceStages: Object.freeze([])
        })
      });

      const resultUnavailable = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod,
        canonicalExpression,
        mechanismCandidates: Object.freeze([])
      });

      expect(resultUnavailable.ok).toBe(true);
      if (resultUnavailable.ok) {
        expect(resultUnavailable.value.qualificationBasis).toBe('UNAVAILABLE');
      }

      // Case 2: PROXY_DIRECTION - canonical inputs absent (legacy caller)
      const resultProxy = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod
        // No canonicalExpression or mechanismCandidates
      });

      expect(resultProxy.ok).toBe(true);
      if (resultProxy.ok) {
        expect(resultProxy.value.qualificationBasis).toBe('PROXY_DIRECTION');
        // PROXY_DIRECTION should filter by expr.direction !== 'UNAVAILABLE'
        // Our test expression has direction: 'SUPPORTED', so it should appear
        expect(resultProxy.value.expressionActivations.length).toBeGreaterThan(0);
      }
    });
  });
});
