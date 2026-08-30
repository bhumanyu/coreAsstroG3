import { describe, expect, it } from 'vitest';
import { matchFactorOutcome } from './counterReasoningOutcomeMatcher';
import type { CounterReasoningClaim, CounterReasoningFactor } from './counterReasoningTypes';

describe('counterReasoningOutcomeMatcher', () => {
  const baseClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is my dasha causing delays?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'DELAY',
    assertionMode: 'QUESTION'
  };

  const baseFactor: CounterReasoningFactor = {
    evidenceId: 'ev-1',
    edgeType: 'CHALLENGES',
    explanation: 'Saturn transit delays promotion',
    relation: 'CHALLENGE',
    outcomeSemantics: ['DELAY']
  };

  it('returns UNSPECIFIED when claim.assertedOutcome is undefined or UNKNOWN', () => {
    expect(
      matchFactorOutcome(baseFactor, { ...baseClaim, assertedOutcome: undefined })
    ).toBe('UNSPECIFIED');

    expect(
      matchFactorOutcome(baseFactor, { ...baseClaim, assertedOutcome: 'UNKNOWN' })
    ).toBe('UNSPECIFIED');
  });

  it('returns UNSPECIFIED when factor.outcomeSemantics is undefined or empty', () => {
    expect(
      matchFactorOutcome({ ...baseFactor, outcomeSemantics: undefined }, baseClaim)
    ).toBe('UNSPECIFIED');

    expect(
      matchFactorOutcome({ ...baseFactor, outcomeSemantics: [] }, baseClaim)
    ).toBe('UNSPECIFIED');
  });

  it('returns EXACT when factor outcomeSemantics contains assertedOutcome', () => {
    expect(
      matchFactorOutcome(
        { ...baseFactor, outcomeSemantics: ['DELAY', 'OBSTACLE'] },
        { ...baseClaim, assertedOutcome: 'DELAY' }
      )
    ).toBe('EXACT');

    expect(
      matchFactorOutcome(
        { ...baseFactor, outcomeSemantics: ['GROWTH'] },
        { ...baseClaim, assertedOutcome: 'GROWTH' }
      )
    ).toBe('EXACT');
  });

  it('returns ABSENT when factor outcomeSemantics is non-empty but does not match assertedOutcome', () => {
    expect(
      matchFactorOutcome(
        { ...baseFactor, outcomeSemantics: ['LOSS'] },
        { ...baseClaim, assertedOutcome: 'DELAY' }
      )
    ).toBe('ABSENT');

    expect(
      matchFactorOutcome(
        { ...baseFactor, outcomeSemantics: ['PROMOTION'] },
        { ...baseClaim, assertedOutcome: 'GROWTH' }
      )
    ).toBe('ABSENT');
  });

  it('never infers related outcomes (e.g. DELAY must NOT match LOSS or OBSTACLE)', () => {
    const delayFactor: CounterReasoningFactor = {
      ...baseFactor,
      outcomeSemantics: ['DELAY']
    };

    expect(
      matchFactorOutcome(delayFactor, { ...baseClaim, assertedOutcome: 'OBSTACLE' })
    ).toBe('ABSENT');

    expect(
      matchFactorOutcome(delayFactor, { ...baseClaim, assertedOutcome: 'LOSS' })
    ).toBe('ABSENT');

    expect(
      matchFactorOutcome(delayFactor, { ...baseClaim, assertedOutcome: 'VOLATILITY' })
    ).toBe('ABSENT');
  });
});
