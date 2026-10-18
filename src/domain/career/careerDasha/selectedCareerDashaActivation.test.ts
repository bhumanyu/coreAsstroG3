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
  // Use canonical evidence ID format from buildCanonicalEvidence: CAREER_DASHA:LEVEL:PLANET:ROLE:EFFECT
  // These IDs match the sourceIds in canonicalDashaAnalysis.evidence for SATURN (MD) and JUPITER (AD)
  const evidence1: CareerExpressionEvidence = Object.freeze({
    id: 'CAREER_DASHA:MD:SATURN:PRIMARY_DRIVER:SUPPORT',
    mode: 'LEADERSHIP' as any,
    role: 'PLANETARY' as any,
    statement: 'Leadership expression evidence 1 (linked to MD)',
    weight: 2.0,
    planets: [Planet.SATURN],
    houses: [10]
  });

  const evidence2: CareerExpressionEvidence = Object.freeze({
    id: 'CAREER_DASHA:AD:JUPITER:MODIFIER:SUPPORT',
    mode: 'LEADERSHIP' as any,
    role: 'PLANETARY' as any,
    statement: 'Leadership expression evidence 2 (linked to AD)',
    weight: 1.5,
    planets: [Planet.JUPITER],
    houses: [7]
  });

  const evidence3: CareerExpressionEvidence = Object.freeze({
    id: 'expr-evidence-3',
    mode: 'TECHNICAL_SPECIALIZATION' as any,
    role: 'PLANETARY' as any,
    statement: 'Technical expression evidence 3 (unmatched)',
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
  describe('Expression row only when evidence-linked', () => {
    it('emits expression row only when evidence IDs intersect with selected activation', () => {
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

      // Collect all source IDs from canonical evidence (MD and AD levels)
      const canonicalSourceIds = new Set<string>();
      for (const evidence of result.canonicalDashaAnalysis.evidence) {
        if (evidence.level === 'MD' || evidence.level === 'AD') {
          for (const sourceId of evidence.sourceIds) {
            canonicalSourceIds.add(sourceId);
          }
        }
      }

      // Should have expression activations for expressions with evidence IDs matching canonical source IDs
      expect(result.expressionActivations).toBeDefined();
      expect(Array.isArray(result.expressionActivations)).toBe(true);

      // Check that linkedEvidenceIds match canonical source IDs
      for (const activation of result.expressionActivations) {
        for (const linkedId of activation.linkedEvidenceIds) {
          expect(canonicalSourceIds.has(linkedId)).toBe(true);
        }
      }
    });

    it('expression without linked evidence is absent from rows (not a negative result)', () => {
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

      // Check that unmatched evidence is reported
      expect(result.unmatchedExpressionEvidenceIds).toBeDefined();
      expect(Array.isArray(result.unmatchedExpressionEvidenceIds)).toBe(true);

      // The unmatched evidence should include the technical expression evidence
      // which has ID 'expr-evidence-3' that does not match canonical source IDs
      expect(result.unmatchedExpressionEvidenceIds).toContain('expr-evidence-3');
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

      // Unmatched IDs should be a frozen array
      expect(Object.isFrozen(result.unmatchedExpressionEvidenceIds)).toBe(true);

      // Should be sorted
      const sorted = [...result.unmatchedExpressionEvidenceIds].sort();
      expect(result.unmatchedExpressionEvidenceIds).toEqual(sorted);
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

      // Should have empty expression activations
      expect(result.expressionActivations).toEqual([]);
      expect(result.unmatchedExpressionEvidenceIds).toEqual([]);
    });
  });

  describe('expressionRefKey determinism', () => {
    it('produces deterministic expressionRefKey from mode:direction: + sorted evidence IDs', () => {
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

      // expressionRefKeys should be identical across runs
      expect(result1.expressionActivations.length).toBe(result2.expressionActivations.length);

      for (let i = 0; i < result1.expressionActivations.length; i++) {
        expect(result1.expressionActivations[i].expressionRefKey)
          .toBe(result2.expressionActivations[i].expressionRefKey);
      }
    });

    it('expressionRefKey format is mode:direction:sortedEvidenceIds', () => {
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

      // Check expressionRefKey format for each activation
      for (const activation of result.expressionActivations) {
        // Should start with mode:direction:
        expect(activation.expressionRefKey).toMatch(/^[A-Z_]+:[A-Z_]+:/);
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

      expect(result.selectedPeriodId).toBe('SATURN-JUPITER-2020-2022');
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

      expect(result.interval.start).toBe('2020-01-01');
      expect(result.interval.end).toBe('2022-01-01');
    });
  });

  describe('Temporal relation', () => {
    it('uses temporalRelation from PBA-03 context', () => {
      const horoscope = makeHoroscope();
      const natal = makeMinimalNatalAnalysis();
      const expression = makeExpressionAnalysisWithLinkedEvidence();

      // Test with a past period
      const pastPeriod = makeSelectedPeriod({
        temporalRelation: 'PAST',
        analysisAsOf: '2025-06-15',
        interval: Object.freeze({
          start: '2000-01-01',
          end: '2002-01-01'
        })
      });

      const pastResult = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod: pastPeriod
      });

      expect(pastResult.temporalRelation).toBe('PAST');

      // Test with a future period
      const futurePeriod = makeSelectedPeriod({
        temporalRelation: 'FUTURE',
        analysisAsOf: '2025-06-15',
        interval: Object.freeze({
          start: '2030-01-01',
          end: '2032-01-01'
        })
      });

      const futureResult = buildSelectedCareerDashaActivation({
        horoscope,
        natal,
        expression,
        selectedPeriod: futurePeriod
      });

      expect(futureResult.temporalRelation).toBe('FUTURE');
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

      expect(result.canonicalDashaAnalysis).toBeDefined();
      expect(result.canonicalDashaAnalysis.md).toBeDefined();
      expect(result.canonicalDashaAnalysis.ad).toBeDefined();
      expect(result.canonicalDashaAnalysis.pd).toBeDefined();
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

      expect(result.canonicalDashaAnalysis.pd.effect).toBe('INSUFFICIENT_DATA');
      expect(result.canonicalDashaAnalysis.pd.planet).toBeUndefined();
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

      expect(result1.statement).toBe(result2.statement);
      expect(result1.statement).toContain('SATURN-JUPITER-2020-2022');
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

      // Expression count should not change
      expect(expression.expressions.length).toBe(expressionCountBefore);

      // Expression activations should reference existing expressions
      for (const activation of result.expressionActivations) {
        expect(expression.expressions).toContain(activation.expression);
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

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.expressionActivations)).toBe(true);
      expect(Object.isFrozen(result.unmatchedExpressionEvidenceIds)).toBe(true);
      expect(Object.isFrozen(result.interval)).toBe(true);
    });
  });
});
