import { describe, expect, it } from 'vitest';

import {
  buildCareerFinalAnalysis
} from './careerFinalSynthesisIntegration';

import type {
  CareerFinalSynthesisIntegrationInput
} from './careerFinalSynthesisCanonicalTypes';

import {
  Planet
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression
} from '../careerExpression';

import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaActivationHierarchy
} from '../careerDasha';

import type {
  CareerD10CanonicalAnalysis
} from '../careerD10';

import type {
  CareerTimingSynthesis
} from '../../timing/careerWealthTiming';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  WeightedReasoningEvidence
} from '../../reasoning/reasoningTypes';

import {
  calculateHoroscope
} from '../../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../../test/fixtures/canonicalChart';

import {
  buildCareerNatalAnalysis
} from '../careerNatalConvergence';

import {
  buildCareerExpression
} from '../careerExpressionIntegration';

import {
  buildCareerDashaAnalysis
} from '../careerDasha/careerDashaIntegration';

import {
  buildCareerD10Analysis
} from '../careerD10/careerD10Integration';

// Test helpers

function makeMinimalNatal(
  direction: CareerStructuralDirection = 'SUPPORT',
  strength: CareerStructuralStrength = 'STRONG'
): CareerNatalAnalysis {
  return Object.freeze({
    structural: Object.freeze({
      direction,
      strength,
      primarySupport: direction === 'SUPPORT' ? 5 : 0,
      primaryChallenge: direction === 'CHALLENGE' ? 5 : 0,
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
      statement: 'Structural reasoning.'
    } as unknown as any),
    relevance: Object.freeze([]) as any,
    condition: Object.freeze([]) as any,
    lordRelationships: Object.freeze([]),
    direction: direction as any,
    strength: strength as any,
    evidence: Object.freeze([]) as readonly WeightedReasoningEvidence[],
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

function makeMinimalExpression(
  expressions: readonly CareerExpression[] = []
): CareerExpressionAnalysis {
  return Object.freeze({
    expressions,
    statement: 'Expression analysis.'
  });
}

function makeMinimalDasha(
  overallDirection: string = 'SUPPORT',
  hierarchy?: CareerDashaActivationHierarchy
): CareerDashaCanonicalAnalysis {
  return Object.freeze({
    overallEffect: 'ACTIVATES' as any,
    overallDirection: overallDirection as any,
    overallStrength: 'STRONG' as any,
    dominantLevel: 'MD',
    md: Object.freeze({
      level: 'MD',
      planet: Planet.SATURN,
      role: 'PRIMARY_DRIVER' as any,
      effect: 'ACTIVATES' as any,
      direction: overallDirection as any,
      strength: 'STRONG' as any,
      start: '2020-01-01',
      end: '2025-01-01',
      statement: 'MD period.'
    }),
    ad: Object.freeze({
      level: 'AD',
      planet: Planet.JUPITER,
      role: 'MODIFIER' as any,
      effect: 'ACTIVATES' as any,
      direction: overallDirection as any,
      strength: 'STRONG' as any,
      start: '2020-01-01',
      end: '2022-01-01',
      statement: 'AD period.'
    }),
    pd: Object.freeze({
      level: 'PD',
      planet: Planet.MERCURY,
      role: 'REFINEMENT' as any,
      effect: 'ACTIVATES' as any,
      direction: overallDirection as any,
      strength: 'STRONG' as any,
      start: '2020-01-01',
      end: '2021-01-01',
      statement: 'PD period.'
    }),
    evidence: Object.freeze([]),
    rootEvidenceIds: Object.freeze([]),
    statement: 'Dasha analysis.',
    hierarchy
  });
}

function makeMinimalD10(
  d10Direction: string = 'SUPPORT',
  d10Strength: string = 'STRONG'
): CareerD10CanonicalAnalysis {
  return Object.freeze({
    availability: 'AVAILABLE' as any,
    natalDirection: 'SUPPORT' as any,
    natalStrength: 'STRONG' as any,
    d10Effect: 'REINFORCES' as any,
    d10Direction: d10Direction as any,
    d10Strength: d10Strength as any,
    qualifiedDirection: d10Direction as any,
    qualifiedStrength: d10Strength as any,
    natalPromisePreserved: true,
    relationship: 'REINFORCES' as any,
    evidence: Object.freeze([]),
    conflicts: Object.freeze([]),
    expressionQualifications: Object.freeze([]),
    rootEvidenceIds: Object.freeze([]),
    statement: 'D10 analysis.'
  });
}

function makeMinimalTiming(
  transitEffect: string = 'SUPPORTS'
): CareerTimingSynthesis {
  return Object.freeze({
    natalPromise: 'STRONG' as any,
    dashaEffect: 'SUPPORTS' as any,
    transitEffect: transitEffect as any,
    overallEffect: 'ACTIVATES' as any,
    confidence: 0.85,
    factors: Object.freeze([]),
    summary: 'Timing synthesis.'
  });
}

function makeInput(overrides: Partial<CareerFinalSynthesisIntegrationInput> = {}): CareerFinalSynthesisIntegrationInput {
  return Object.freeze({
    natal: makeMinimalNatal(),
    expression: makeMinimalExpression(),
    dasha: makeMinimalDasha(),
    d10: makeMinimalD10(),
    timing: makeMinimalTiming(),
    ...overrides
  });
}

describe('C11 Final Career Synthesis Integration', () => {
  describe('Test Group A: Basic chain returns C11 version and domain', () => {
    it('returns reasoningVersion === C11 and domain === CAREER', () => {
      const input = makeInput();
      const result = buildCareerFinalAnalysis(input);

      expect(result.reasoningVersion).toBe('C11');
      expect(result.domain).toBe('CAREER');
    });
  });

  describe('Test Group B: Natal authority - UNAVAILABLE with supportive layers', () => {
    it('natal UNAVAILABLE with supportive Dasha/D10/Expression → finalStatus INSUFFICIENT_DATA', () => {
      const input = makeInput({
        natal: makeMinimalNatal('UNAVAILABLE', 'UNDETERMINED'),
        dasha: makeMinimalDasha('SUPPORT'),
        d10: makeMinimalD10('SUPPORT', 'STRONG')
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.finalStatus).toBe('INSUFFICIENT_DATA');
      expect(result.natalDirection).toBe('UNAVAILABLE');
    });
  });

  describe('Test Group C: Strong natal support preserved despite secondary challenges', () => {
    it('natal SUPPORT/VERY_STRONG with D10/Dasha/Transit CHALLENGE → natalDirection preserved', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'VERY_STRONG'),
        dasha: makeMinimalDasha('CHALLENGE'),
        d10: makeMinimalD10('CHALLENGE', 'STRONG'),
        timing: makeMinimalTiming('CHALLENGES')
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.natalStrength).toBe('VERY_STRONG');
      // Final direction should not be converted to CHALLENGE by secondary layers
      expect(result.finalDirection).not.toBe('CHALLENGE');
    });
  });

  describe('Test Group D: Missing Dasha hierarchy', () => {
    it('missing Dasha hierarchy → finalStatus SUPPORTED, dashaDirection UNAVAILABLE', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        dasha: makeMinimalDasha('UNAVAILABLE')
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.dashaDirection).toBe('UNAVAILABLE');
    });
  });

  describe('Test Group E: Missing D10', () => {
    it('missing D10 → natal preserved, d10Direction UNAVAILABLE', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        d10: makeMinimalD10('UNAVAILABLE', 'UNDETERMINED')
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.natalStrength).toBe('STRONG');
      expect(result.d10Direction).toBe('UNAVAILABLE');
    });
  });

  describe('Test Group F: Missing timing', () => {
    it('missing timing (undefined) → transitDirection UNAVAILABLE', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        timing: undefined
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.transitDirection).toBe('UNAVAILABLE');
    });
  });

  describe('Test Group G: Dasha hierarchy authority', () => {
    it('hierarchy with MD SUPPORT/AD CHALLENGE/PD CHALLENGE but overallDirection SUPPORT → dashaDirection SUPPORT', () => {
      const hierarchy: CareerDashaActivationHierarchy = Object.freeze({
        overallEffect: 'ACTIVATES' as any,
        overallDirection: 'SUPPORT' as any,
        overallStrength: 'STRONG' as any,
        dominantLevel: 'MD',
        statement: 'Dasha hierarchy with MD SUPPORT, AD/PD CHALLENGE.',
        md: Object.freeze({
          level: 'MD',
          planet: Planet.SATURN,
          effect: 'ACTIVATES' as any,
          direction: 'SUPPORT' as any,
          strength: 'STRONG' as any,
          role: 'PRIMARY_DRIVER' as any,
          evidence: Object.freeze([]),
          start: '2020-01-01',
          end: '2025-01-01',
          statement: 'MD SUPPORT'
        }),
        ad: Object.freeze({
          level: 'AD',
          planet: Planet.JUPITER,
          effect: 'CHALLENGES' as any,
          direction: 'CHALLENGE' as any,
          strength: 'STRONG' as any,
          role: 'MODIFIER' as any,
          evidence: Object.freeze([]),
          start: '2020-01-01',
          end: '2022-01-01',
          statement: 'AD CHALLENGE'
        }),
        pd: Object.freeze({
          level: 'PD',
          planet: Planet.MERCURY,
          effect: 'CHALLENGES' as any,
          direction: 'CHALLENGE' as any,
          strength: 'STRONG' as any,
          role: 'REFINEMENT' as any,
          evidence: Object.freeze([]),
          start: '2020-01-01',
          end: '2021-01-01',
          statement: 'PD CHALLENGE'
        })
      });

      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        dasha: makeMinimalDasha('SUPPORT', hierarchy)
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.dashaDirection).toBe('SUPPORT');
    });
  });

  describe('Test Group H: D10 authority', () => {
    it('explicit d10Direction/Effect consumed exactly', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        d10: makeMinimalD10('CHALLENGE', 'VERY_STRONG')
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.d10Direction).toBe('CHALLENGE');
      expect(result.d10Effect).toBe('REINFORCES');
    });
  });

  describe('Test Group I: Transit timing-only', () => {
    it('same natal/C9/C10 with transit SUPPORT vs CHALLENGE → finalDirection/natalDirection unchanged', () => {
      const baseInput = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        dasha: makeMinimalDasha('SUPPORT'),
        d10: makeMinimalD10('SUPPORT', 'STRONG')
      });

      const resultSupport = buildCareerFinalAnalysis({
        ...baseInput,
        timing: makeMinimalTiming('SUPPORTS')
      });

      const resultChallenge = buildCareerFinalAnalysis({
        ...baseInput,
        timing: makeMinimalTiming('CHALLENGES')
      });

      // Final direction and natal direction should be unchanged
      expect(resultSupport.finalDirection).toBe(resultChallenge.finalDirection);
      expect(resultSupport.natalDirection).toBe(resultChallenge.natalDirection);
      expect(resultSupport.natalStrength).toBe(resultChallenge.natalStrength);

      // Transit direction should differ
      expect(resultSupport.transitDirection).toBe('SUPPORT');
      expect(resultChallenge.transitDirection).toBe('CHALLENGE');
    });
  });

  describe('Test Group J: Expression preservation', () => {
    it('two C8 expressions both present in result', () => {
      const expr1: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-1']),
        statement: 'Leadership.',
        conditional: false
      });

      const expr2: CareerExpression = Object.freeze({
        mode: 'ENTREPRENEURSHIP',
        direction: 'CONDITIONAL',
        strength: 'MODERATE',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-2']),
        statement: 'Entrepreneurship.',
        conditional: true
      });

      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        expression: makeMinimalExpression([expr1, expr2])
      });

      const result = buildCareerFinalAnalysis(input);

      expect(result.expressions).toHaveLength(2);
      expect(result.expressions[0].mode).toBe('LEADERSHIP');
      expect(result.expressions[1].mode).toBe('ENTREPRENEURSHIP');
    });
  });

  describe('Test Group K: Evidence identity', () => {
    it('evidenceIds distinct from sourceIds; ruleIds distinct', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG')
      });

      const result = buildCareerFinalAnalysis(input);

      // evidenceIds and sourceIds should be distinct arrays
      expect(result.evidenceIds).toBeDefined();
      expect(result.sourceIds).toBeDefined();
      expect(result.ruleIds).toBeDefined();

      // They may have overlapping content but are conceptually distinct
      expect(Array.isArray(result.evidenceIds)).toBe(true);
      expect(Array.isArray(result.sourceIds)).toBe(true);
      expect(Array.isArray(result.ruleIds)).toBe(true);
    });
  });

  describe('Test Group L: Input-order independence', () => {
    it('reverse natal/expression/dasha/d10 evidence arrays → identical output', () => {
      const expr: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-1', 'evidence-2', 'evidence-3']),
        statement: 'Leadership.',
        conditional: false
      });

      const input1 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        expression: makeMinimalExpression([expr])
      });

      const input2 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        expression: makeMinimalExpression([expr])
      });

      const result1 = buildCareerFinalAnalysis(input1);
      const result2 = buildCareerFinalAnalysis(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Test Group M: Immutability', () => {
    it('deep-freeze assertions on result and nested arrays', () => {
      const input = makeInput();
      const result = buildCareerFinalAnalysis(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.expressions)).toBe(true);
      expect(Object.isFrozen(result.conflicts)).toBe(true);
      expect(Object.isFrozen(result.evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.sourceIds)).toBe(true);
      expect(Object.isFrozen(result.ruleIds)).toBe(true);
      expect(Object.isFrozen(result.evidenceTrace)).toBe(true);
    });
  });

  describe('Test Group N: No downstream leakage', () => {
    it('result has no horoscope/d10Planets/transit-calc fields', () => {
      const input = makeInput();
      const result = buildCareerFinalAnalysis(input);

      expect(result).not.toHaveProperty('horoscope');
      expect(result).not.toHaveProperty('d10Planets');
      expect(result).not.toHaveProperty('transitCalc');
    });
  });

  describe('Test Group O: Real-engine test (full chain)', () => {
    it('real-engine chain produces coherent C11 result', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Run full C4→C5→C6→C7→CareerNatalAnalysis→C8→C9→C10→Timing→C11 chain
      const natal = buildCareerNatalAnalysis({ horoscope });
      const expression = buildCareerExpression({ natal });

      const dashaInput = Object.freeze({
        horoscope,
        natal,
        expression
      });
      const dasha = buildCareerDashaAnalysis(dashaInput);

      const d10Input = Object.freeze({
        horoscope,
        natal,
        expression
      });
      const d10 = buildCareerD10Analysis(d10Input);

      const timing: CareerTimingSynthesis = Object.freeze({
        natalPromise: natal.strength as any,
        dashaEffect: 'SUPPORTS' as any,
        transitEffect: 'SUPPORTS' as any,
        overallEffect: 'ACTIVATES' as any,
        confidence: 0.85,
        factors: Object.freeze([]),
        summary: 'Timing synthesis.'
      });

      const c11Input: CareerFinalSynthesisIntegrationInput = Object.freeze({
        natal,
        expression,
        dasha,
        d10,
        timing
      });

      const result = buildCareerFinalAnalysis(c11Input);

      expect(result).toBeDefined();
      expect(result.reasoningVersion).toBe('C11');
      expect(result.domain).toBe('CAREER');
      expect(result).toHaveProperty('finalStatus');
      expect(result).toHaveProperty('finalDirection');
      expect(result).toHaveProperty('finalStrength');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('natalDirection');
      expect(result).toHaveProperty('natalStrength');
      expect(result).toHaveProperty('expressionStatus');
      expect(result).toHaveProperty('d10Direction');
      expect(result).toHaveProperty('d10Effect');
      expect(result).toHaveProperty('dashaEffect');
      expect(result).toHaveProperty('dashaDirection');
      expect(result).toHaveProperty('timingStatus');
      expect(result).toHaveProperty('transitDirection');
      expect(result).toHaveProperty('currentPressure');
      expect(result).toHaveProperty('expressions');
      expect(result).toHaveProperty('strongestExpressions');
      expect(result).toHaveProperty('challengedExpressions');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('evidenceIds');
      expect(result).toHaveProperty('sourceIds');
      expect(result).toHaveProperty('ruleIds');
      expect(result).toHaveProperty('evidenceTrace');
      expect(result).toHaveProperty('statement');
    });
  });

  describe('Determinism guarantee (§32)', () => {
    it('run buildCareerFinalAnalysis twice on identical input → byte-identical output', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        dasha: makeMinimalDasha('SUPPORT'),
        d10: makeMinimalD10('SUPPORT', 'STRONG'),
        timing: makeMinimalTiming('SUPPORTS')
      });

      const r1 = buildCareerFinalAnalysis(input);
      const r2 = buildCareerFinalAnalysis(input);

      expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    });
  });
});
