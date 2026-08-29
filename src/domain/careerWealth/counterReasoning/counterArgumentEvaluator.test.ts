import { describe, expect, it } from 'vitest';
import { evaluateCounterArgument } from './counterArgumentEvaluator';
import type { CounterReasoningClaim } from './counterReasoningTypes';

describe('counterArgumentEvaluator (CW-07)', () => {
  const claim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Why is career strong?',
    questionType: 'WHY',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'SUPPORT'
  };

  it('evaluates to CONFIRMED when supporting evidence exists and zero challenges', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_1', 'EV_2'],
      challengingEvidenceIds: [],
      claim
    });

    expect(res.disposition).toBe('CONFIRMED');
    expect(res.rebuttal).toContain('confirm FINAL_SYNTHESIS');
  });

  it('evaluates to PARTIALLY_CONFIRMED when both supporting and challenging evidence exist', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: ['EV_1'],
      challengingEvidenceIds: ['EV_2'],
      claim
    });

    expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
    expect(res.rebuttal).toContain('present active friction or qualification');
  });

  it('evaluates to PARTIALLY_CONFIRMED when only challenging evidence exists', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: [],
      challengingEvidenceIds: ['EV_2'],
      claim
    });

    expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
    expect(res.rebuttal).toContain('challenge FINAL_SYNTHESIS');
  });

  it('evaluates to INSUFFICIENT_EVIDENCE when neither supporting nor challenging evidence exists', () => {
    const res = evaluateCounterArgument({
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      claim
    });

    expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.rebuttal).toContain('No direct astrological evidence was identified');
  });
});
