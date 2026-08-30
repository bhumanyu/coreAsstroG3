import { describe, expect, it } from 'vitest';
import { validateCounterReasoning } from './counterReasoningValidator';
import type { CounterReasoningOutput } from './counterReasoningTypes';

describe('counterReasoningValidator (CW-07)', () => {
  const validOutput: CounterReasoningOutput = {
    claim: {
      domain: 'CAREER',
      question: 'Why is career strong?',
      questionType: 'WHY',
      targetSubjectKey: 'FINAL_SYNTHESIS',
      polarity: 'SUPPORT',
      assertedPolarity: 'SUPPORT',
      assertionMode: 'QUESTION',
      assertionPolarity: 'POSITIVE'
    },
    disposition: 'CONFIRMED',
    conclusionChanged: false,
    assertionMode: 'QUESTION',
    supportingEvidenceIds: ['EV_1', 'EV_2'],
    challengingEvidenceIds: ['EV_3'],
    evaluatedFactors: [],
    rebuttal: 'Valid rebuttal',
    guardrailApplied: false,
    guardrailReasons: []
  };

  it('passes validation for valid output structure', () => {
    expect(() => validateCounterReasoning(validOutput)).not.toThrow();
  });

  it('throws on empty question string', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        claim: { ...validOutput.claim, question: '   ' }
      })
    ).toThrow(/Question cannot be empty/);
  });

  it('throws on missing targetSubjectKey', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        claim: { ...validOutput.claim, targetSubjectKey: '' }
      })
    ).toThrow(/targetSubjectKey is required/);
  });

  it('throws if conclusionChanged is not strictly false', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        conclusionChanged: true as any
      })
    ).toThrow(/conclusionChanged must strictly be false/);
  });

  it('throws on duplicate evidence IDs in supportingEvidenceIds', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        supportingEvidenceIds: ['EV_1', 'EV_1']
      })
    ).toThrow(/Duplicate evidence ID found in supportingEvidenceIds/);
  });

  it('throws on duplicate evidence IDs in challengingEvidenceIds', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        challengingEvidenceIds: ['EV_3', 'EV_3']
      })
    ).toThrow(/Duplicate evidence ID found in challengingEvidenceIds/);
  });

  it('throws on evidence ID present in both supporting and challenging sets', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        supportingEvidenceIds: ['EV_SHARED'],
        challengingEvidenceIds: ['EV_SHARED']
      })
    ).toThrow(/cannot be in both supporting and challenging sets/);
  });

  it('validates evaluatedFactors is an array if present', () => {
    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        evaluatedFactors: []
      })
    ).not.toThrow();

    expect(() =>
      validateCounterReasoning({
        ...validOutput,
        evaluatedFactors: 'not-an-array' as any
      })
    ).toThrow(/evaluatedFactors must be an array/);
  });
});
