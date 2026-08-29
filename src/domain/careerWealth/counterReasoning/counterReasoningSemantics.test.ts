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
      expect(resolveEdgeSemantic('UNKNOWN_EDGE' as unknown as ReasoningEdgeType)).toBe('NEUTRAL');
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
      expect(resolveOutcomePolarity('CUSTOM_UNRECOGNIZED' as unknown as CounterReasoningOutcome)).toBe('NEUTRAL');
    });
  });

  describe('COUNTER_REASONING_OUTCOME_RULES (Single Source of Truth)', () => {
    const allOutcomes: CounterReasoningOutcome[] = [
      'SUPPORT',
      'CHALLENGE',
      'DELAY',
      'OBSTACLE',
      'PROMOTION',
      'GROWTH',
      'LOSS',
      'STABILITY',
      'VOLATILITY',
      'MANIFESTATION',
      'EMPLOYMENT',
      'LEADERSHIP',
      'BUSINESS',
      'TECHNICAL_SPECIALIZATION',
      'UNKNOWN'
    ];

    it('asserts every CounterReasoningOutcome member has exactly one entry in the table', () => {
      expect(COUNTER_REASONING_OUTCOME_RULES.length).toBe(allOutcomes.length);
      for (const outcome of allOutcomes) {
        const matches = COUNTER_REASONING_OUTCOME_RULES.filter((r) => r.outcome === outcome);
        expect(matches.length).toBe(1);
      }
    });

    it('asserts resolveOutcomePolarity agrees with the table for all members', () => {
      for (const outcome of allOutcomes) {
        const rule = COUNTER_REASONING_OUTCOME_RULES.find((r) => r.outcome === outcome);
        expect(rule).toBeDefined();
        expect(resolveOutcomePolarity(outcome)).toBe(rule!.polarity);
      }
    });
  });
});
