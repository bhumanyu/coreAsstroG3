import { describe, expect, it } from 'vitest';
import { evaluateCounterArgument } from './counterArgumentEvaluator';
import type { CounterReasoningClaim } from './counterReasoningTypes';

describe('counterArgumentEvaluator (CW-07)', () => {
  const neutralClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Why is career strong?',
    questionType: 'WHY',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'NEUTRAL',
    assertedPolarity: 'NEUTRAL',
    assertedOutcome: 'SUPPORT'
  };

  const challengeClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is my current Dasha causing delays?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'DELAY'
  };

  it('evaluates to CONFIRMED when supporting evidence exists and zero challenges for neutral/support claim', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_1', 'EV_2'],
      challengingEvidenceIds: [],
      claim: neutralClaim
    });

    expect(res.disposition).toBe('CONFIRMED');
    expect(res.rebuttal).toContain('confirm FINAL_SYNTHESIS');
  });

  it('evaluates to PARTIALLY_CONFIRMED when both supporting and challenging evidence exist for neutral/support claim', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_1'],
      challengingEvidenceIds: ['EV_2'],
      claim: neutralClaim
    });

    expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
    expect(res.rebuttal).toContain('present active friction or qualification');
  });

  it('evaluates to REJECTED when only challenging evidence exists for neutral/support proposition', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: [],
      challengingEvidenceIds: ['EV_2'],
      claim: neutralClaim
    });

    expect(res.disposition).toBe('REJECTED');
    expect(res.rebuttal).toContain('No supportive astrological evidence was found');
  });

  it('evaluates to INSUFFICIENT_EVIDENCE when neither supporting nor challenging evidence exists', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      claim: neutralClaim
    });

    expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.rebuttal).toContain('No direct astrological evidence was identified');
  });

  it('evaluates CHALLENGE assertion with only ACTIVATES/SUPPORTS to INSUFFICIENT_EVIDENCE', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_DASHA_1'],
      challengingEvidenceIds: [],
      claim: challengeClaim
    });

    expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.rebuttal).toContain('No astrological challenge or delay factors were identified');
  });

  it('evaluates CHALLENGE assertion with CHALLENGES edges to CONFIRMED', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: [],
      challengingEvidenceIds: ['EV_DASHA_CHALLENGE_1'],
      claim: challengeClaim
    });

    expect(res.disposition).toBe('CONFIRMED');
    expect(res.rebuttal).toContain('confirm challenges or delays');
  });

  it('evaluates CHALLENGE assertion with mixed edges to PARTIALLY_CONFIRMED', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_DASHA_1'],
      challengingEvidenceIds: ['EV_DASHA_CHALLENGE_1'],
      claim: challengeClaim
    });

    expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
    expect(res.rebuttal).toContain('friction or delay');
  });
});

