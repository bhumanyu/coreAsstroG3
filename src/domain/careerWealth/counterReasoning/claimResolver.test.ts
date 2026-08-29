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
    expect(claim.assertedPolarity).toBe('CHALLENGE');
    expect(claim.polarity).toBe('CHALLENGE');
  });

  it('maps D10 queries to D10_CONFIRMATION for CAREER and D2 queries to D2_CONFIRMATION for WEALTH only when explicit', () => {
    const careerExplicitD10 = resolveClaim({
      domain: 'CAREER',
      question: 'Does D10 Dashamsha support this?'
    });
    expect(careerExplicitD10.targetSubjectKey).toBe('D10_CONFIRMATION');

    const wealthExplicitD2 = resolveClaim({
      domain: 'WEALTH',
      question: 'Does D2 Hora chart support this?'
    });
    expect(wealthExplicitD2.targetSubjectKey).toBe('D2_CONFIRMATION');

    // Generic divisional question in CAREER should NOT auto-resolve to D10
    const genericCareerDivisional = resolveClaim({
      domain: 'CAREER',
      question: 'Does the divisional chart support this?'
    });
    expect(genericCareerDivisional.targetSubjectKey).toBe('UNKNOWN');

    // Cross-chart mention in CAREER (e.g. D2 or D9) should resolve to UNKNOWN
    const crossChartCareer = resolveClaim({
      domain: 'CAREER',
      question: 'Does the D2 Hora chart impact my career?'
    });
    expect(crossChartCareer.targetSubjectKey).toBe('UNKNOWN');
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

  it('does not let weak substrings like period or potential override precedence', () => {
    const periodQuery = resolveClaim({
      domain: 'CAREER',
      question: 'What is my career period outlook?'
    });
    expect(periodQuery.targetSubjectKey).toBe('FINAL_SYNTHESIS');

    const potentialQuery = resolveClaim({
      domain: 'CAREER',
      question: 'What is my long-term career potential?'
    });
    expect(potentialQuery.targetSubjectKey).toBe('FINAL_SYNTHESIS');
  });

  it('resolves assertedPolarity NEUTRAL for WHY and CHALLENGE for WHY_NOT', () => {
    const whyClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Why is my career rated as strong?'
    });
    expect(whyClaim.targetSubjectKey).toBe('FINAL_SYNTHESIS');
    expect(whyClaim.assertedPolarity).toBe('NEUTRAL');
    expect(whyClaim.assertedOutcome).toBe('SUPPORT');

    const whyNotClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Why is my career not achieving success?'
    });
    expect(whyNotClaim.assertedPolarity).toBe('CHALLENGE');
    expect(whyNotClaim.assertedOutcome).toBe('CHALLENGE');
  });

  it('derives assertedOutcome=DELAY for questions with delay keywords', () => {
    const delayClaim = resolveClaim({
      domain: 'CAREER',
      question: 'Is my current Dasha causing delays?'
    });
    expect(delayClaim.targetSubjectKey).toBe('DASHA_ACTIVATION');
    expect(delayClaim.questionType).toBe('DASHA_CHALLENGE');
    expect(delayClaim.assertedPolarity).toBe('CHALLENGE');
    expect(delayClaim.assertedOutcome).toBe('DELAY');
  });

  describe('Keyword regression tests for assertedOutcome (Concern #13)', () => {
    it('maps career growth to GROWTH', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: 'Will this period bring career growth?'
      });
      expect(claim.assertedOutcome).toBe('GROWTH');
    });

    it('maps career promotion to PROMOTION', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: 'Is a career promotion supported by the chart?'
      });
      expect(claim.assertedOutcome).toBe('PROMOTION');
    });

    it('maps wealth loss to LOSS', () => {
      const claim = resolveClaim({
        domain: 'WEALTH',
        question: 'Will I suffer wealth loss during this dasha?'
      });
      expect(claim.assertedOutcome).toBe('LOSS');
    });

    it('maps financial volatility to VOLATILITY', () => {
      const claim = resolveClaim({
        domain: 'WEALTH',
        question: 'Does the chart indicate financial volatility?'
      });
      expect(claim.assertedOutcome).toBe('VOLATILITY');
    });

    it('maps career obstacle to OBSTACLE', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: 'What is the main career obstacle?'
      });
      expect(claim.assertedOutcome).toBe('OBSTACLE');
    });
  });

  describe('Deterministic Precedence Contract (CW-07A Issue #1)', () => {
    it('resolves multi-outcome "delay and financial loss" to DELAY (DELAY > LOSS)', () => {
      const claim = resolveClaim({
        domain: 'WEALTH',
        question: 'Will this Dasha cause delay and financial loss?'
      });
      expect(claim.assertedOutcome).toBe('DELAY');
    });

    it('resolves "promotion but also obstacles" to OBSTACLE (OBSTACLE > PROMOTION)', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: 'Can this period create promotion but also obstacles?'
      });
      expect(claim.assertedOutcome).toBe('OBSTACLE');
    });

    it('resolves "career growth despite challenges" to GROWTH (GROWTH > CHALLENGE)', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: 'Will this create career growth despite challenges?'
      });
      expect(claim.assertedOutcome).toBe('GROWTH');
    });
  });
});

