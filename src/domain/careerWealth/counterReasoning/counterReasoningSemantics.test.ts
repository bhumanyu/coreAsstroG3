import { describe, expect, it } from 'vitest';
import {
  resolveEdgeSemantic,
  resolveOutcomePolarity,
  COUNTER_REASONING_OUTCOME_RULES
} from './counterReasoningSemantics';
import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';
import type { CounterReasoningOutcome } from './counterReasoningTypes';

describe('counterReasoningSemantics (CW-07)', () => {
  describe('resolveEdgeSemantic', () => {
    it('maps every ReasoningEdgeType correctly', () => {
      const edgeTypeMap: Record<ReasoningEdgeType, string> = {
        SUPPORTS: 'SUPPORT',
        CONFIRMS: 'CONFIRMATION',
        CHALLENGES: 'CHALLENGE',
        CONTRADICTS: 'CHALLENGE',
        ACTIVATES: 'ACTIVATION',
        MODIFIES: 'MODIFICATION',
        MANIFESTS: 'NEUTRAL'
      };

      for (const [edgeType, expectedSemantic] of Object.entries(edgeTypeMap)) {
        expect(resolveEdgeSemantic(edgeType as ReasoningEdgeType)).toBe(expectedSemantic);
      }
    });

    it('returns NEUTRAL for unrecognized or fallback edge types', () => {
      expect(resolveEdgeSemantic('UNKNOWN_EDGE' as any)).toBe('NEUTRAL');
    });
  });

  describe('resolveOutcomePolarity', () => {
    it('maps positive career/wealth outcomes to POSITIVE', () => {
      const positiveOutcomes: CounterReasoningOutcome[] = [
        'SUPPORT',
        'PROMOTION',
        'GROWTH',
        'STABILITY',
        'MANIFESTATION',
        'EMPLOYMENT',
        'LEADERSHIP',
        'BUSINESS',
        'TECHNICAL_SPECIALIZATION'
      ];

      for (const outcome of positiveOutcomes) {
        expect(resolveOutcomePolarity(outcome)).toBe('POSITIVE');
      }
    });

    it('maps negative/frictional outcomes to NEGATIVE', () => {
      const negativeOutcomes: CounterReasoningOutcome[] = [
        'CHALLENGE',
        'DELAY',
        'OBSTACLE',
        'LOSS',
        'VOLATILITY'
      ];

      for (const outcome of negativeOutcomes) {
        expect(resolveOutcomePolarity(outcome)).toBe('NEGATIVE');
      }
    });

    it('maps UNKNOWN and default outcomes to NEUTRAL', () => {
      expect(resolveOutcomePolarity('UNKNOWN')).toBe('NEUTRAL');
      expect(resolveOutcomePolarity('CUSTOM_UNRECOGNIZED' as any)).toBe('NEUTRAL');
    });
  });

  describe('COUNTER_REASONING_OUTCOME_RULES', () => {
    it('contains definitions for all standard CounterReasoningOutcome members', () => {
      expect(COUNTER_REASONING_OUTCOME_RULES.length).toBeGreaterThanOrEqual(15);
      const outcomesInRules = COUNTER_REASONING_OUTCOME_RULES.map((r) => r.outcome);
      expect(outcomesInRules).toContain('SUPPORT');
      expect(outcomesInRules).toContain('DELAY');
      expect(outcomesInRules).toContain('CHALLENGE');
      expect(outcomesInRules).toContain('PROMOTION');
      expect(outcomesInRules).toContain('LOSS');
      expect(outcomesInRules).toContain('UNKNOWN');
    });
  });
});
