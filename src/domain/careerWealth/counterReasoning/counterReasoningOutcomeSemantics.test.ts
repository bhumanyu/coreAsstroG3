import { describe, expect, it } from 'vitest';
import { resolveOutcomePolarity, COUNTER_REASONING_OUTCOME_RULES } from './counterReasoningOutcomeSemantics';
import type { CounterReasoningOutcome } from './counterReasoningTypes';

describe('counterReasoningOutcomeSemantics', () => {
  it('resolves negative outcomes correctly', () => {
    const negativeOutcomes: CounterReasoningOutcome[] = [
      'DELAY',
      'OBSTACLE',
      'LOSS',
      'VOLATILITY',
      'CHALLENGE'
    ];

    for (const outcome of negativeOutcomes) {
      expect(resolveOutcomePolarity(outcome)).toBe('NEGATIVE');
    }
  });

  it('resolves positive outcomes correctly', () => {
    const positiveOutcomes: CounterReasoningOutcome[] = [
      'PROMOTION',
      'GROWTH',
      'STABILITY',
      'MANIFESTATION',
      'EMPLOYMENT',
      'LEADERSHIP',
      'BUSINESS',
      'TECHNICAL_SPECIALIZATION',
      'SUPPORT'
    ];

    for (const outcome of positiveOutcomes) {
      expect(resolveOutcomePolarity(outcome)).toBe('POSITIVE');
    }
  });

  it('resolves UNKNOWN and unmapped outcomes to NEUTRAL', () => {
    expect(resolveOutcomePolarity('UNKNOWN')).toBe('NEUTRAL');
    expect(resolveOutcomePolarity('UNMAPPED_OUTCOME' as CounterReasoningOutcome)).toBe('NEUTRAL');
  });

  it('has consistent rules in COUNTER_REASONING_OUTCOME_RULES table', () => {
    expect(COUNTER_REASONING_OUTCOME_RULES.length).toBeGreaterThan(10);
    for (const rule of COUNTER_REASONING_OUTCOME_RULES) {
      expect(resolveOutcomePolarity(rule.outcome)).toBe(rule.polarity);
    }
  });
});
