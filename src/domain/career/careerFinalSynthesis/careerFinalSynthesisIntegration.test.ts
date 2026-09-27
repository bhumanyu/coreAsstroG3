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
  strength: CareerStructuralStrength = 'STRONG',
  evidenceItems: readonly WeightedReasoningEvidence[] = Object.freeze([])
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
    }),
    relevance: Object.freeze([]),
    condition: Object.freeze([]),
    lordRelationships: Object.freeze([]),
    direction,
    strength,
    evidence: evidenceItems,
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
  overallDirection: 'SUPPORT' | 'CHALLENGE' | 'UNAVAILABLE' = 'SUPPORT',
  hierarchy?: CareerDashaActivationHierarchy,
  evidenceItems: readonly any[] = Object.freeze([])
): CareerDashaCanonicalAnalysis {
  return Object.freeze({
    overallEffect: 'ACTIVATES',
    overallDirection,
    overallStrength: 'STRONG',
    dominantLevel: 'MD',
    md: Object.freeze({
      level: 'MD',
      planet: Planet.SATURN,
      role: 'PRIMARY_DRIVER',
      effect: 'ACTIVATES',
      direction: overallDirection,
      strength: 'STRONG',
      start: '2020-01-01',
      end: '2025-01-01',
      statement: 'MD period.'
    }),
    ad: Object.freeze({
      level: 'AD',
      planet: Planet.JUPITER,
      role: 'MODIFIER',
      effect: 'ACTIVATES',
      direction: overallDirection,
      strength: 'STRONG',
      start: '2020-01-01',
      end: '2022-01-01',
      statement: 'AD period.'
    }),
    pd: Object.freeze({
      level: 'PD',
      planet: Planet.MERCURY,
      role: 'REFINEMENT',
      effect: 'ACTIVATES',
      direction: overallDirection,
      strength: 'STRONG',
      start: '2020-01-01',
      end: '2021-01-01',
      statement: 'PD period.'
    }),
    evidence: evidenceItems,
    rootEvidenceIds: Object.freeze([]),
    statement: 'Dasha analysis.',
    hierarchy
  });
}

function makeMinimalD10(
  d10Direction: 'SUPPORT' | 'CHALLENGE' | 'UNAVAILABLE' = 'SUPPORT',
  d10Strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_STRONG' | 'VERY_WEAK' | 'UNDETERMINED' = 'STRONG',
  evidenceItems: readonly any[] = Object.freeze([])
): CareerD10CanonicalAnalysis {
  return Object.freeze({
    availability: 'AVAILABLE',
    natalDirection: 'SUPPORT',
    natalStrength: 'STRONG',
    d10Effect: 'REINFORCES',
    d10Direction,
    d10Strength,
    qualifiedDirection: d10Direction,
    qualifiedStrength: d10Strength,
    natalPromisePreserved: true,
    relationship: 'REINFORCES',
    evidence: evidenceItems,
    conflicts: Object.freeze([]),
    expressionQualifications: Object.freeze([]),
    rootEvidenceIds: Object.freeze([]),
    statement: 'D10 analysis.'
  });
}

function makeMinimalTiming(
  transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA' = 'SUPPORTS'
): CareerTimingSynthesis {
  return Object.freeze({
    natalPromise: 'STRONG',
    dashaEffect: 'SUPPORTS',
    transitEffect,
    overallEffect: 'ACTIVATES',
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
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha hierarchy with MD SUPPORT, AD/PD CHALLENGE.',
        md: Object.freeze({
          level: 'MD',
          planet: Planet.SATURN,
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          role: 'PRIMARY_DRIVER',
          evidence: Object.freeze([]),
          start: '2020-01-01',
          end: '2025-01-01',
          statement: 'MD SUPPORT'
        }),
        ad: Object.freeze({
          level: 'AD',
          planet: Planet.JUPITER,
          effect: 'CHALLENGES',
          direction: 'CHALLENGE',
          strength: 'STRONG',
          role: 'MODIFIER',
          evidence: Object.freeze([]),
          start: '2020-01-01',
          end: '2022-01-01',
          statement: 'AD CHALLENGE'
        }),
        pd: Object.freeze({
          level: 'PD',
          planet: Planet.MERCURY,
          effect: 'CHALLENGES',
          direction: 'CHALLENGE',
          strength: 'STRONG',
          role: 'REFINEMENT',
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
      // Expressions are sorted by mode for determinism
      const modes = result.expressions.map(e => e.mode);
      expect(modes).toContain('LEADERSHIP');
      expect(modes).toContain('ENTREPRENEURSHIP');
    });
  });

  describe('Test Group K: Evidence identity', () => {
    it('evidenceIds, sourceIds, and ruleIds are distinct arrays with separate semantic contracts', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG')
      });

      const result = buildCareerFinalAnalysis(input);

      // evidenceIds, sourceIds, and ruleIds should be distinct arrays
      expect(result.evidenceIds).toBeDefined();
      expect(result.sourceIds).toBeDefined();
      expect(result.ruleIds).toBeDefined();

      // They are conceptually separate arrays representing different identity contracts
      expect(Array.isArray(result.evidenceIds)).toBe(true);
      expect(Array.isArray(result.sourceIds)).toBe(true);
      expect(Array.isArray(result.ruleIds)).toBe(true);

      // Verify they are separate array instances (not the same reference)
      expect(result.evidenceIds).not.toBe(result.sourceIds);
      expect(result.evidenceIds).not.toBe(result.ruleIds);
      expect(result.sourceIds).not.toBe(result.ruleIds);

      // Document the semantic relationship:
      // - evidenceIds: semantic identity IDs (one per evidence item)
      // - sourceIds: occurrence-level source IDs (multiple per evidence item, representing provenance)
      // These are distinct contracts - sourceIds trace back to original input evidence items,
      // while evidenceIds represent the deduplicated semantic facts.
      // The arrays may have overlapping content if an evidenceId equals a sourceId,
      // but they serve different purposes in the trace envelope.
    });
  });

  describe('Test Group L: Input-order independence', () => {
    it('reverse natal/expression/dasha/d10 evidence arrays → identical output', () => {
      // Create two distinct expressions
      const expr1: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-1', 'evidence-2']),
        statement: 'Leadership.',
        conditional: false
      });

      const expr2: CareerExpression = Object.freeze({
        mode: 'ENTREPRENEURSHIP',
        direction: 'CONDITIONAL',
        strength: 'MODERATE',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-3', 'evidence-4']),
        statement: 'Entrepreneurship.',
        conditional: true
      });

      // Create two distinct natal evidence items
      const natalEvidence1: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'natal-evidence-1',
        evidenceId: 'natal-evidence-1',
        ruleId: 'rule-1',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 1,
        weight: 5,
        statement: 'Natal evidence 1.',
        relatedEvidenceIds: Object.freeze([]),
        sourceIds: Object.freeze(['source-1'])
      });

      const natalEvidence2: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'natal-evidence-2',
        evidenceId: 'natal-evidence-2',
        ruleId: 'rule-2',
        layer: 'SECONDARY_SUPPORT',
        direction: 'SUPPORT',
        strength: 'MODERATE',
        priority: 2,
        weight: 3,
        statement: 'Natal evidence 2.',
        relatedEvidenceIds: Object.freeze([]),
        sourceIds: Object.freeze(['source-2'])
      });

      // Create two distinct Dasha evidence items
      const dashaEvidence1 = Object.freeze({
        identityKey: 'dasha-evidence-1',
        id: 'dasha-evidence-1',
        level: 'MD' as const,
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER' as const,
        effect: 'ACTIVATES' as const,
        direction: 'SUPPORT' as const,
        strength: 'STRONG' as const,
        statement: 'Dasha evidence 1.',
        sourceIds: Object.freeze(['dasha-source-1']),
        provenance: Object.freeze({
          source: 'C9_DASHA' as const,
          activationLevel: 'MD' as const,
          natalRootIds: Object.freeze([])
        })
      });

      const dashaEvidence2 = Object.freeze({
        identityKey: 'dasha-evidence-2',
        id: 'dasha-evidence-2',
        level: 'AD' as const,
        planet: Planet.JUPITER,
        role: 'MODIFIER' as const,
        effect: 'ACTIVATES' as const,
        direction: 'SUPPORT' as const,
        strength: 'STRONG' as const,
        statement: 'Dasha evidence 2.',
        sourceIds: Object.freeze(['dasha-source-2']),
        provenance: Object.freeze({
          source: 'C9_DASHA' as const,
          activationLevel: 'AD' as const,
          natalRootIds: Object.freeze([])
        })
      });

      // Create two distinct D10 evidence items
      const d10Evidence1 = Object.freeze({
        identityKey: 'd10-evidence-1',
        id: 'd10-evidence-1',
        role: 'PRIMARY' as const,
        direction: 'SUPPORT' as const,
        d10Effect: 'REINFORCES' as const,
        d10Strength: 'STRONG' as const,
        weight: 5,
        statement: 'D10 evidence 1.',
        sourceIds: Object.freeze(['d10-source-1']),
        provenance: Object.freeze({
          source: 'C10_D10' as const,
          ruleIds: Object.freeze(['rule-1']),
          sourceIds: Object.freeze(['d10-source-1']),
          natalRootIds: Object.freeze([])
        })
      });

      const d10Evidence2 = Object.freeze({
        identityKey: 'd10-evidence-2',
        id: 'd10-evidence-2',
        role: 'SUPPORTING' as const,
        direction: 'SUPPORT' as const,
        d10Effect: 'REINFORCES' as const,
        d10Strength: 'MODERATE' as const,
        weight: 3,
        statement: 'D10 evidence 2.',
        sourceIds: Object.freeze(['d10-source-2']),
        provenance: Object.freeze({
          source: 'C10_D10' as const,
          ruleIds: Object.freeze(['rule-2']),
          sourceIds: Object.freeze(['d10-source-2']),
          natalRootIds: Object.freeze([])
        })
      });

      // Input 1: expressions in forward order, evidence arrays in forward order
      const input1 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG', Object.freeze([natalEvidence1, natalEvidence2])),
        expression: makeMinimalExpression([expr1, expr2]),
        dasha: makeMinimalDasha('SUPPORT', undefined, Object.freeze([dashaEvidence1, dashaEvidence2])),
        d10: makeMinimalD10('SUPPORT', 'STRONG', Object.freeze([d10Evidence1, d10Evidence2]))
      });

      // Input 2: expressions in reversed order, evidence arrays in reversed order
      const input2 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG', Object.freeze([natalEvidence2, natalEvidence1])),
        expression: makeMinimalExpression([expr2, expr1]),
        dasha: makeMinimalDasha('SUPPORT', undefined, Object.freeze([dashaEvidence2, dashaEvidence1])),
        d10: makeMinimalD10('SUPPORT', 'STRONG', Object.freeze([d10Evidence2, d10Evidence1]))
      });

      const result1 = buildCareerFinalAnalysis(input1);
      const result2 = buildCareerFinalAnalysis(input2);

      // Assert byte-identical output - the adapter should sort arrays deterministically
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
        natalPromise: natal.strength,
        dashaEffect: 'SUPPORTS',
        transitEffect: 'SUPPORTS',
        overallEffect: 'ACTIVATES',
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

      // Deterministic cross-layer semantic assertions
      expect(result.natalDirection).toBe(natal.structural.direction);
      expect(result.natalStrength).toBe(natal.structural.strength);
      // Expressions are sorted by mode for determinism, so compare as sets
      expect(new Set(result.expressions.map(e => e.mode))).toEqual(new Set(expression.expressions.map(e => e.mode)));
      expect(result.d10Direction).toBe(d10.d10Direction);
      expect(result.d10Effect).toBe(d10.d10Effect);

      // Determinism assertion: run twice and assert byte-identical output
      const result2 = buildCareerFinalAnalysis(c11Input);
      expect(JSON.stringify(result)).toBe(JSON.stringify(result2));

      // Assert result is frozen and has no leakage fields
      expect(Object.isFrozen(result)).toBe(true);
      expect(result).not.toHaveProperty('horoscope');
      expect(result).not.toHaveProperty('d10Planets');
      expect(result).not.toHaveProperty('transitCalc');
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
