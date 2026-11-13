import { describe, expect, it } from 'vitest';
import {
  buildDomainAssessmentNarrative,
  buildUserFacingAssessment,
  explainUserFacingClassification,
  formatEvidenceConfidence,
  formatIndicationStrength,
  formatOutcome,
  formatUserFacingClassification,
  ENGLISH_USER_FACING_COPY
} from './userFacingInterpretation';

describe('user-facing interpretation', () => {
  it.each([
    ['STRONGLY_SUPPORTED', 'Strongly supportive outlook'],
    ['SUPPORTED', 'Supportive outlook'],
    ['MIXED', 'Mixed outlook'],
    ['CHALLENGED', 'Challenging outlook'],
    ['LIMITED', 'Limited indications'],
    ['UNAVAILABLE', 'Unable to assess']
  ])('formats outcome %s', (value, expected) => {
    expect(formatOutcome(value)).toBe(expected);
  });

  it.each([
    ['VERY_STRONG', 'Very strong foundation'],
    ['STRONG', 'Strong foundation'],
    ['MODERATE', 'Moderate foundation'],
    ['WEAK', 'Limited foundation'],
    ['VERY_WEAK', 'Very limited foundation'],
    ['UNAVAILABLE', 'Foundation not assessed']
  ])('keeps strength separate from outcome: %s', (value, expected) => {
    expect(formatIndicationStrength(value)).toBe(expected);
  });

  it.each([
    ['HIGH', 'High evidence confidence'],
    ['MEDIUM', 'Moderate evidence confidence'],
    ['LOW', 'Limited evidence confidence']
  ])('describes confidence as evidence confidence: %s', (value, expected) => {
    expect(formatEvidenceConfidence(value)).toBe(expected);
  });

  it.each([
    'AVAILABLE', 'UNAVAILABLE', 'CONDITIONAL', 'PARTIAL',
    'INSUFFICIENT', 'INSUFFICIENT_DATA', 'BLOCKED', 'NOT_APPLICABLE',
    'NOT_ASSESSED', 'NOT_PROVIDED', 'COMPLETE', 'READY', 'ERROR',
    'IDLE', 'LOADING', 'ACTIVATES', 'PARTIALLY_ACTIVATES',
    'DOES_NOT_ACTIVATE', 'CHALLENGES', 'STRONGLY_SUPPORTS',
    'SUPPORTS', 'CONTRADICTS', 'UNKNOWN', 'TRIGGER', 'MODIFIER',
    'CHALLENGE', 'NO_MATERIAL_TRIGGER', 'PAST', 'CURRENT', 'FUTURE',
    'ACTIVE', 'NOT_ACTIVE', 'CONFIRMS', 'PARTIALLY_CONFIRMS',
    'MODIFIES', 'CONFLICTS', 'SUPPORT', 'NEUTRAL', 'UNDETERMINED',
    'PRIMARY', 'SUPPORTING', 'CHALLENGING', 'REFINEMENT',
    'CONFLICTING', 'NONE', 'MINIMAL', 'MILD', 'CRITICAL'
  ])('does not expose raw enum code for %s', (value) => {
    const label = formatUserFacingClassification(value);
    expect(label).not.toBe(value);
    expect(label).not.toContain('_');
    expect(label.length).toBeGreaterThan(0);
  });

  it('explains neutral timing without presenting it as negative', () => {
    expect(explainUserFacingClassification('NEUTRAL')).toContain('does not show a clear supportive or challenging');
    expect(explainUserFacingClassification('NEUTRAL')).toContain('does not mean that progress is impossible');
  });

  it('explains inactive timing separately from natal foundation', () => {
    const explanation = explainUserFacingClassification('NOT_ACTIVE') ?? '';
    expect(explanation).toContain('timing observation');
    expect(explanation).toContain('underlying birth-chart potential');
  });

  it.each(['UNAVAILABLE', 'INSUFFICIENT_DATA', 'BLOCKED', 'PARTIAL'])(
    'does not treat missing evidence (%s) as negative evidence',
    (value) => {
      expect(explainUserFacingClassification(value)).toMatch(
        /not (be )?treated as|No positive or negative conclusion|withheld/i
      );
    }
  );

  it('builds a non-repetitive narrative with strength and confidence named separately', () => {
    const narrative = buildDomainAssessmentNarrative({
      outcome: 'MIXED',
      strength: 'STRONG',
      confidence: 'MEDIUM',
      activation: 'NEUTRAL'
    });
    expect(narrative).toContain('Mixed outlook');
    expect(narrative).toContain('Strong foundation');
    expect(narrative).toContain('Moderate evidence confidence');
    expect(narrative).toContain('Neutral');
    expect(narrative).not.toContain('MIXED (MIXED');
    expect(narrative).not.toContain('Medium Confidence. Strong');
  });

  it('returns a conservative fallback for future unknown codes rather than exposing them', () => {
    expect(formatUserFacingClassification('FUTURE_NEW_STATE')).toBe('Not assessed');
    expect(formatOutcome('FUTURE_NEW_STATE')).toBe('Not assessed');
    expect(formatIndicationStrength('FUTURE_NEW_STATE')).toBe('Not assessed');
    expect(formatEvidenceConfidence('FUTURE_NEW_STATE')).toBe('Not assessed');
  });

  it('builds all assessment dimensions without treating MIXED or NOT_ACTIVE as predictions', () => {
    const assessment = buildUserFacingAssessment({
      outcome: 'MIXED',
      natalDirection: 'MIXED',
      natalStrength: 'STRONG',
      dashaDirection: 'MIXED',
      timingStatus: 'NOT_ACTIVE',
      confidence: 'HIGH'
    });

    expect(assessment.foundation.label).toBe('Strong foundation with mixed indications');
    expect(assessment.foundation.explanation).toContain('supporting factors that coexist with challenging factors');
    expect(assessment.foundation.explanation).toContain('does not guarantee a favourable result');
    expect(assessment.dashaSupport.label).toBe('Mixed indications');
    expect(assessment.timing.label).toBe('No clear activation identified');
    expect(assessment.timing.explanation).toContain('timing observation');
    expect(assessment.confidence.label).toBe('High confidence');
    expect(assessment.confidence.explanation).toContain('evidence is relatively complete');
    expect(JSON.stringify(assessment)).not.toMatch(/\bMIXED\s*\(|\bNOT_ACTIVE\b/);
  });

  it.each([
    ['VERY_STRONG', 'Very strong foundation'],
    ['STRONG', 'Strong foundation'],
    ['MODERATE', 'Moderate foundation'],
    ['MIXED', 'Mixed foundation'],
    ['CHALLENGED', 'Challenged foundation']
  ])('formats wealth promise status %s as the natal foundation', (promiseStatus, expected) => {
    const assessment = buildUserFacingAssessment({ natalPromiseStatus: promiseStatus });
    expect(assessment.foundation.label).toBe(expected);
  });

  it('combines other known direction and strength values rather than dropping either axis', () => {
    const assessment = buildUserFacingAssessment({
      natalDirection: 'SUPPORT',
      natalStrength: 'STRONG'
    });
    expect(assessment.foundation.label).toBe('Strong foundation with supportive indications');
  });

  it('uses safe detail labels and statuses for unknown values', () => {
    const assessment = buildUserFacingAssessment({
      details: [
        { label: 'ACCUMULATION', status: 'STRONG' },
        { label: 'FUTURE_DIMENSION', status: 'FUTURE_STATUS' }
      ]
    });
    expect(assessment.details).toEqual([
      { label: 'Accumulation', explanation: 'Strong indications' },
      { label: 'Additional assessment', explanation: 'Not assessed' }
    ]);
    expect(JSON.stringify(assessment)).not.toMatch(/ACCUMULATION|FUTURE_DIMENSION|FUTURE_STATUS/);
  });

  it('uses not-assessed fallbacks for unknown values in every assessment dimension', () => {
    const assessment = buildUserFacingAssessment({
      natalDirection: 'FUTURE_DIRECTION',
      dashaDirection: 'FUTURE_DASHA',
      timingStatus: 'FUTURE_TIMING',
      confidence: 'FUTURE_CONFIDENCE',
      natalPromiseStatus: 'FUTURE_PROMISE'
    });

    expect(assessment.foundation.label).toBe('Not assessed');
    expect(assessment.dashaSupport.label).toBe('Not assessed');
    expect(assessment.timing.label).toBe('Not assessed');
    expect(assessment.confidence.label).toBe('Not assessed');
    expect(JSON.stringify(assessment)).not.toMatch(/FUTURE_/);
  });

  it('allows presentation wording to be supplied through the copy-provider seam', () => {
    const copy = {
      ...ENGLISH_USER_FACING_COPY,
      notAssessed: 'Assessment pending',
      notAssessedExplanation: 'The assessment is pending.'
    };
    const assessment = buildUserFacingAssessment({ confidence: 'UNKNOWN', copy });
    expect(assessment.confidence.label).toBe('Assessment pending');
    expect(assessment.confidence.explanation).toBe('The assessment is pending.');
  });

  it('returns a safe not-assessed fallback when structured synthesis is missing', () => {
    const assessment = buildUserFacingAssessment({});
    expect(assessment.summary).toContain('Not assessed');
    expect(assessment.foundation.label).toBe('Not assessed');
    expect(assessment.dashaSupport.label).toBe('Not assessed');
    expect(assessment.timing.label).toBe('Not assessed');
    expect(assessment.confidence.label).toBe('Not assessed');
  });
});
