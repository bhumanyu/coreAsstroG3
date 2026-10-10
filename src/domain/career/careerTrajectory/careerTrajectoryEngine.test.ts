import { describe, it, expect } from 'vitest';

import {
  buildCareerTrajectory
} from './careerTrajectoryEngine';

import type {
  CareerTrajectoryInput
} from './careerTrajectoryTypes';

import type {
  CareerFinalSynthesisResult
} from '../careerFinalSynthesis/careerFinalSynthesisTypes';

import {
  createDomainEvidence
} from '../../interpretation/DomainEvidence';

/**
 * C11 fixture factory.
 *
 * Based on createEmptyFinalSynthesis from canonicalCareerEvidenceMapper.test.ts.
 * Populates ALL required CareerFinalSynthesisResult fields with override params.
 */
function createC11Fixture(
  overrides: Partial<CareerFinalSynthesisResult> = {}
): CareerFinalSynthesisResult {
  const base: CareerFinalSynthesisResult = {
    reasoningVersion: 'C11',
    domain: 'CAREER',
    finalStatus: 'INSUFFICIENT_DATA',
    finalDirection: 'UNAVAILABLE',
    finalStrength: 'UNDETERMINED',
    confidence: 'LOW',
    natalDirection: 'UNAVAILABLE',
    natalStrength: 'UNDETERMINED',
    expressionStatus: 'UNAVAILABLE',
    d10Direction: 'UNAVAILABLE',
    d10Effect: 'UNKNOWN',
    dashaEffect: 'UNKNOWN',
    dashaDirection: 'UNAVAILABLE',
    timingStatus: 'UNKNOWN',
    transitDirection: 'UNAVAILABLE',
    currentPressure: 'UNKNOWN',
    expressions: [],
    strongestExpressions: [],
    challengedExpressions: [],
    conflicts: [],
    evidenceIds: [],
    sourceIds: [],
    ruleIds: [],
    evidenceTrace: {
      evidenceIds: [],
      sourceIds: [],
      ruleIds: []
    },
    statement: 'No final synthesis data'
  };

  return { ...base, ...overrides };
}

/**
 * Creates a valid CareerTrajectoryInput with minimal evidence set.
 */
function createTrajectoryInput(
  finalSynthesis: CareerFinalSynthesisResult,
  evidenceItems: Array<{ id: string; identityKey?: string }> = []
): CareerTrajectoryInput {
  const evidenceSet = new Set(
    evidenceItems.map((item) =>
      createDomainEvidence({
        id: item.id,
        sourceType: 'HOUSE',
        identityKey: item.identityKey
      })
    )
  );

  return {
    finalSynthesis,
    evidence: evidenceSet
  };
}

describe('CareerTrajectoryEngine', () => {
  describe('Long-term pattern classification', () => {
    it('supported → GROWTH_CAPABLE', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('GROWTH_CAPABLE');
    });

    it('challenged → CONSTRAINED', () => {
      const c11 = createC11Fixture({
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        timingStatus: 'CHALLENGED'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('CONSTRAINED');
    });

    it('mixed direction → NON_LINEAR', () => {
      const c11 = createC11Fixture({
        natalDirection: 'MIXED',
        natalStrength: 'MODERATE',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('NON_LINEAR');
    });

    it('mixed strength → NON_LINEAR', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'MIXED',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('NON_LINEAR');
    });

    it('SUPPORT+MIXED → NON_LINEAR (explicit ordering test)', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'MIXED',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      // MIXED strength is evaluated before SUPPORT direction, so NON_LINEAR
      expect(result.longTermPattern).toBe('NON_LINEAR');
    });

    it('conditional → CONDITIONAL_GROWTH', () => {
      const c11 = createC11Fixture({
        natalDirection: 'CONDITIONAL',
        natalStrength: 'MODERATE',
        timingStatus: 'PARTIALLY_ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('CONDITIONAL_GROWTH');
    });

    it('neutral → INSUFFICIENT_DATA', () => {
      const c11 = createC11Fixture({
        natalDirection: 'NEUTRAL',
        natalStrength: 'MODERATE',
        timingStatus: 'UNKNOWN'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('INSUFFICIENT_DATA');
    });

    it('unavailable direction → INSUFFICIENT_DATA', () => {
      const c11 = createC11Fixture({
        natalDirection: 'UNAVAILABLE',
        natalStrength: 'STRONG',
        timingStatus: 'UNKNOWN'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('INSUFFICIENT_DATA');
    });

    it('undetermined strength → INSUFFICIENT_DATA', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'UNDETERMINED',
        timingStatus: 'UNKNOWN'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Dasha challenge does not change longTermPattern (regression test)', () => {
    it('identical natal fields with only timingStatus flipped yields identical longTermPattern', () => {
      const baseNatal = {
        natalDirection: 'SUPPORT' as const,
        natalStrength: 'STRONG' as const
      };

      const c11Active = createC11Fixture({
        ...baseNatal,
        timingStatus: 'ACTIVE',
        dashaDirection: 'SUPPORT',
        dashaEffect: 'ACTIVATES'
      });

      const c11Challenged = createC11Fixture({
        ...baseNatal,
        timingStatus: 'CHALLENGED',
        dashaDirection: 'CHALLENGE',
        dashaEffect: 'CHALLENGES'
      });

      const inputActive = createTrajectoryInput(c11Active);
      const inputChallenged = createTrajectoryInput(c11Challenged);

      const resultActive = buildCareerTrajectory(inputActive);
      const resultChallenged = buildCareerTrajectory(inputChallenged);

      // Long-term pattern must be identical (natal fields only)
      expect(resultActive.longTermPattern).toBe(resultChallenged.longTermPattern);
      expect(resultActive.longTermPattern).toBe('GROWTH_CAPABLE');

      // Current phase must differ (timingStatus differs)
      expect(resultActive.currentPhase).toBe('ACTIVE');
      expect(resultChallenged.currentPhase).toBe('CHALLENGED');
    });
  });

  describe('D10 unavailable does not manufacture challenge', () => {
    it('D10 UNAVAILABLE with strong natal support does not produce CONSTRAINED', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        d10Direction: 'UNAVAILABLE',
        d10Effect: 'UNKNOWN',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('GROWTH_CAPABLE');
    });
  });

  describe('Transit challenge does not change baseline', () => {
    it('transit CHALLENGE with strong natal support does not produce CONSTRAINED', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        transitDirection: 'CHALLENGE',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.longTermPattern).toBe('GROWTH_CAPABLE');
    });
  });

  describe('Expression mapping', () => {
    it('only qualified C11 expressions appear when qualified=true', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        expressions: [
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev1', 'ev2']
          }
        ]
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].mode).toBe('LEADERSHIP');
      expect(result.opportunities[0].qualified).toBe(true);
    });

    it('unqualified expressions preserve state (qualified=false)', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        expressions: [
          {
            mode: 'SERVICE_EMPLOYMENT',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            qualified: false,
            evidenceIds: ['ev3']
          }
        ]
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].mode).toBe('SERVICE_EMPLOYMENT');
      expect(result.opportunities[0].qualified).toBe(false);
    });

    it('opportunities sorted by mode.localeCompare', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        expressions: [
          {
            mode: 'MANAGEMENT',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev1']
          },
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev2']
          }
        ]
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.opportunities[0].mode).toBe('LEADERSHIP');
      expect(result.opportunities[1].mode).toBe('MANAGEMENT');
    });

    it('expression evidenceIds are sorted', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        expressions: [
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev3', 'ev1', 'ev2']
          }
        ]
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.opportunities[0].evidenceIds).toEqual(['ev1', 'ev2', 'ev3']);
    });
  });

  describe('Evidence reference resolution', () => {
    it('missing evidence ref → unresolvedEvidenceIds', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev1', 'ev2', 'ev3']
      });

      const evidenceItems = [
        { id: 'ev1' },
        { id: 'ev2' }
        // ev3 is missing
      ];

      const input = createTrajectoryInput(c11, evidenceItems);
      const result = buildCareerTrajectory(input);

      expect(result.unresolvedEvidenceIds).toEqual(['ev3']);
    });

    it('unreferenced extra evidence is not a signal', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev1']
      });

      const evidenceItems = [
        { id: 'ev1' },
        { id: 'ev2' }, // extra, not referenced
        { id: 'ev3' }  // extra, not referenced
      ];

      const input = createTrajectoryInput(c11, evidenceItems);
      const result = buildCareerTrajectory(input);

      // Only ev1 should be in evidenceIds
      expect(result.evidenceIds).toEqual(['ev1']);
      expect(result.evidenceIds).not.toContain('ev2');
      expect(result.evidenceIds).not.toContain('ev3');
    });

    it('duplicate references deduped and sorted', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev3', 'ev1', 'ev2', 'ev1', 'ev3']
      });

      const evidenceItems = [
        { id: 'ev1' },
        { id: 'ev2' },
        { id: 'ev3' }
      ];

      const input = createTrajectoryInput(c11, evidenceItems);
      const result = buildCareerTrajectory(input);

      expect(result.evidenceIds).toEqual(['ev1', 'ev2', 'ev3']);
    });

    it('identityKey is used for lookup when present', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['semantic-id-1']
      });

      const evidenceItems = [
        { id: 'occurrence-id-1', identityKey: 'semantic-id-1' }
      ];

      const input = createTrajectoryInput(c11, evidenceItems);
      const result = buildCareerTrajectory(input);

      // Should resolve using identityKey
      expect(result.unresolvedEvidenceIds).toEqual([]);
    });
  });

  describe('Input order invariance', () => {
    it('deep-equal outputs for identical inputs with different array order', () => {
      const c11a = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev3', 'ev1', 'ev2'],
        sourceIds: ['src3', 'src1', 'src2'],
        ruleIds: ['rule3', 'rule1', 'rule2'],
        expressions: [
          {
            mode: 'MANAGEMENT',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev3', 'ev1']
          },
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev2']
          }
        ]
      });

      const c11b = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev1', 'ev2', 'ev3'],
        sourceIds: ['src1', 'src2', 'src3'],
        ruleIds: ['rule1', 'rule2', 'rule3'],
        expressions: [
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev2']
          },
          {
            mode: 'MANAGEMENT',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev1', 'ev3']
          }
        ]
      });

      const evidenceItems = [
        { id: 'ev1' },
        { id: 'ev2' },
        { id: 'ev3' }
      ];

      const inputA = createTrajectoryInput(c11a, evidenceItems);
      const inputB = createTrajectoryInput(c11b, evidenceItems);

      const resultA = buildCareerTrajectory(inputA);
      const resultB = buildCareerTrajectory(inputB);

      // Deep equality
      expect(resultA).toEqual(resultB);
    });
  });

  describe('Immutability', () => {
    it('frozen result + nested arrays', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        evidenceIds: ['ev1'],
        sourceIds: ['src1'],
        ruleIds: ['rule1'],
        expressions: [
          {
            mode: 'LEADERSHIP',
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev1']
          }
        ]
      });

      const input = createTrajectoryInput(c11, [{ id: 'ev1' }]);
      const result = buildCareerTrajectory(input);

      // Top-level frozen
      expect(Object.isFrozen(result)).toBe(true);

      // Nested arrays frozen
      expect(Object.isFrozen(result.opportunities)).toBe(true);
      expect(Object.isFrozen(result.evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.unresolvedEvidenceIds)).toBe(true);
      expect(Object.isFrozen(result.sourceIds)).toBe(true);
      expect(Object.isFrozen(result.ruleIds)).toBe(true);

      // Deep nested arrays frozen
      expect(Object.isFrozen(result.opportunities[0].evidenceIds)).toBe(true);
    });
  });

  describe('Validation', () => {
    it('invalid domain throws', () => {
      const c11 = createC11Fixture({
        reasoningVersion: 'C11',
        domain: 'WEALTH' as any, // invalid domain
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);

      expect(() => buildCareerTrajectory(input)).toThrow(
        'Invalid domain: expected \'CAREER\', got \'WEALTH\''
      );
    });

    it('invalid version throws', () => {
      const c11 = createC11Fixture({
        reasoningVersion: 'C10' as any, // invalid version
        domain: 'CAREER',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);

      expect(() => buildCareerTrajectory(input)).toThrow(
        'Invalid reasoningVersion: expected \'C11\', got \'C10\''
      );
    });
  });

  describe('Missing timing data', () => {
    it('missing timing data preserves UNKNOWN', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'UNKNOWN'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('UNKNOWN');
    });
  });

  describe('Dated forecast capability', () => {
    it('no dated events fabricated (datedForecastAvailable === false)', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.datedForecastAvailable).toBe(false);
    });
  });

  describe('Current phase mapping', () => {
    it('ACTIVE timingStatus → ACTIVE currentPhase', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('ACTIVE');
    });

    it('PARTIALLY_ACTIVE timingStatus → PARTIALLY_ACTIVE currentPhase', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'PARTIALLY_ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('PARTIALLY_ACTIVE');
    });

    it('CHALLENGED timingStatus → CHALLENGED currentPhase', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'CHALLENGED'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('CHALLENGED');
    });

    it('NOT_ACTIVE timingStatus → NOT_ACTIVE currentPhase', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'NOT_ACTIVE'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('NOT_ACTIVE');
    });

    it('UNKNOWN timingStatus → UNKNOWN currentPhase', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'UNKNOWN'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentPhase).toBe('UNKNOWN');
    });
  });

  describe('Source and rule ID handling', () => {
    it('sourceIds deduped and sorted', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        sourceIds: ['src3', 'src1', 'src2', 'src1']
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.sourceIds).toEqual(['src1', 'src2', 'src3']);
    });

    it('ruleIds deduped and sorted', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        ruleIds: ['rule3', 'rule1', 'rule2', 'rule1']
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.ruleIds).toEqual(['rule1', 'rule2', 'rule3']);
    });
  });

  describe('Current status mapping', () => {
    it('currentStatus is copied from C11 finalStatus', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        finalStatus: 'SUPPORTED'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.currentStatus).toBe('SUPPORTED');
    });
  });

  describe('Statement generation', () => {
    it('generates human-readable statement', () => {
      const c11 = createC11Fixture({
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        timingStatus: 'ACTIVE',
        finalStatus: 'SUPPORTED'
      });

      const input = createTrajectoryInput(c11);
      const result = buildCareerTrajectory(input);

      expect(result.statement).toBe(
        'Growth-capable trajectory; currently active; status: SUPPORTED'
      );
    });
  });
});
