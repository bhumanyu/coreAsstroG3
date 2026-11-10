import { describe, expect, it } from 'vitest';
import {
  buildDomainAssessmentNarrative,
  explainUserFacingClassification,
  formatEvidenceConfidence,
  formatIndicationStrength,
  formatOutcome,
  formatUserFacingClassification
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
      expect(explainUserFacingClassification(value)).toContain('not be treated as evidence against');
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

  it('safely title-cases a future unknown code rather than displaying the enum', () => {
    expect(formatUserFacingClassification('FUTURE_NEW_STATE')).toBe('Future New State');
  });
});
