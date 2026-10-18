import {
  buildSelectedCareerDashaActivation
} from './selectedCareerDashaActivation';

import type {
  SelectedPeriodActivationContext
} from '../../../core/analysis';

import {
  SELECTED_PERIOD_CONTEXT_VERSION,
  MD_AD_PERIOD_RESOLVER_VERSION
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

  return Object.freeze({
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: 'SATURN-JUPITER-2020-2022',
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2021-06-15',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: Object.freeze({
      start: '2020-01-01',
      end: '2022-01-01'
    }),
    mahadasha: Object.freeze({
      id: 'md-saturn-2020-2025',
      planet: Planet.SATURN,
      start: '2020-01-01',
      end: '2025-01-01'
    }),
    antardasha: Object.freeze({
      id: 'ad-jupiter-2020-2022',
      mahadashaId: 'md-saturn-2020-2025',
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

        // Check that dashaActivationEvidenceIds are the C9 canonical evidence IDs
        for (const activation of result.value.expressionActivations) {
          expect(activation.dashaActivationEvidenceIds).toBeDefined();
          expect(Array.isArray(activation.dashaActivationEvidenceIds)).toBe(true);
          // These should be C9 canonical IDs (e.g., 'CAREER_DASHA:MD:SATURN:...')
          activation.dashaActivationEvidenceIds.forEach(id => {
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
        expect(result.value.selectedPeriodId).toBe('SATURN-JUPITER-2020-2022');
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
      const pastPeriod = makeSelectedPeriod({
        temporalRelation: 'PAST',
        analysisAsOf: '2025-06-15',
        interval: Object.freeze({
          start: '2020-01-01',
          end: '2021-01-01'
        }),
        antardasha: Object.freeze({
          id: 'ad-jupiter-2020-2021',
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
      const futurePeriod = makeSelectedPeriod({
        temporalRelation: 'FUTURE',
        analysisAsOf: '2019-06-15',
        interval: Object.freeze({
          start: '2023-01-01',
          end: '2024-01-01'
        }),
        antardasha: Object.freeze({
          id: 'ad-jupiter-2023-2024',
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
        expect(result1.value.statement).toContain('SATURN-JUPITER-2020-2022');
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
});
