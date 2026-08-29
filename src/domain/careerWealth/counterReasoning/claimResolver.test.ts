import { describe, expect, it } from 'vitest';
import { resolveClaim } from './claimResolver';

describe('claimResolver (CW-07)', () => {
  it('resolves explicit targetSubjectKey and questionType if provided', () => {
    const claim = resolveClaim({
      domain: 'CAREER',
      question: 'Is D10 conflicting with my work?',
      questionType: 'DIVISIONAL_CHALLENGE',
      targetSubjectKey: 'D10_CONFIRMATION'
    });

    expect(claim.domain).toBe('CAREER');
    expect(claim.questionType).toBe('DIVISIONAL_CHALLENGE');
    expect(claim.targetSubjectKey).toBe('D10_CONFIRMATION');
    expect(claim.polarity).toBe('CHALLENGE');
  });

  it('maps D10 queries to D10_CONFIRMATION for CAREER and D2 queries to D2_CONFIRMATION for WEALTH', () => {
    const careerClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Does the divisional chart support this?'
    });
    expect(careerClaim.targetSubjectKey).toBe('D10_CONFIRMATION');

    const wealthClaim = resolveClaim({
      domain: 'WEALTH',
      question: 'Does D2 Hora chart support this?'
    });
    expect(wealthClaim.targetSubjectKey).toBe('D2_CONFIRMATION');
  });

  it('maps dasha queries to DASHA_ACTIVATION and timing queries to TIMING_TRIGGER', () => {
    const dashaClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Is current dasha period favorable?'
    });
    expect(dashaClaim.targetSubjectKey).toBe('DASHA_ACTIVATION');

    const timingClaim = resolveClaim({
      domain: 'WEALTH',
      question: 'How does the current transit affect timing?'
    });
    expect(timingClaim.targetSubjectKey).toBe('TIMING_TRIGGER');
  });

  it('defaults targetSubjectKey to FINAL_SYNTHESIS for general questions', () => {
    const generalClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Why is my career rated as strong?'
    });
    expect(generalClaim.targetSubjectKey).toBe('FINAL_SYNTHESIS');
    expect(generalClaim.polarity).toBe('SUPPORT');
  });
});
