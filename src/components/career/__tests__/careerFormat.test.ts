import { describe, it, expect } from 'vitest';
import {
  formatStrength,
  formatConfidence,
  formatDirection,
  formatEvidenceRole,
  formatD10Relationship,
  formatActivationEffect,
  formatTransitEffect,
  formatSeverity
} from '../careerFormat';

describe('Career presentation formatters (P-UI-04)', () => {
  describe('formatStrength', () => {
    it('formats known strengths into title case', () => {
      expect(formatStrength('STRONG')).toBe('Strong');
      expect(formatStrength('STRONGLY_SUPPORTED')).toBe('Strongly Supported');
      expect(formatStrength('VERY_STRONG')).toBe('Very Strong');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatStrength(undefined)).toBe('Unavailable');
      expect(formatStrength('UNAVAILABLE')).toBe('Unavailable');
      expect(formatStrength('unavailable')).toBe('Unavailable');
    });
  });

  describe('formatConfidence', () => {
    it('formats known confidence literals', () => {
      expect(formatConfidence('HIGH')).toBe('High Confidence');
      expect(formatConfidence('MEDIUM')).toBe('Medium Confidence');
      expect(formatConfidence('LOW')).toBe('Low Confidence');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatConfidence(undefined)).toBe('Unavailable');
      expect(formatConfidence('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatDirection', () => {
    it('formats known direction literals', () => {
      expect(formatDirection('SUPPORT')).toBe('Supporting');
      expect(formatDirection('CHALLENGE')).toBe('Challenging');
      expect(formatDirection('NEUTRAL')).toBe('Neutral');
      expect(formatDirection('MIXED')).toBe('Mixed');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatDirection(undefined)).toBe('Unavailable');
      expect(formatDirection('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatEvidenceRole', () => {
    it('formats all 7 real product evidence roles', () => {
      expect(formatEvidenceRole('PRIMARY')).toBe('Primary Driver');
      expect(formatEvidenceRole('SUPPORTING')).toBe('Supporting');
      expect(formatEvidenceRole('CHALLENGING')).toBe('Challenging');
      expect(formatEvidenceRole('MODIFIER')).toBe('Modifier');
      expect(formatEvidenceRole('REFINEMENT')).toBe('Refinement');
      expect(formatEvidenceRole('CONFLICTING')).toBe('Conflicting');
      expect(formatEvidenceRole('NEUTRAL')).toBe('Contextual');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatEvidenceRole(undefined)).toBe('Unavailable');
      expect(formatEvidenceRole('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatD10Relationship', () => {
    it('formats valid D10 relationship enum values', () => {
      expect(formatD10Relationship('CONFIRMS')).toBe('Confirms');
      expect(formatD10Relationship('PARTIALLY_CONFIRMS')).toBe('Partially Confirms');
      expect(formatD10Relationship('MODIFIES')).toBe('Modifies');
      expect(formatD10Relationship('CONFLICTS')).toBe('Conflicts');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatD10Relationship(undefined)).toBe('Unavailable');
      expect(formatD10Relationship('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatActivationEffect', () => {
    it('formats activation effects', () => {
      expect(formatActivationEffect('ACTIVATES')).toBe('Activates');
      expect(formatActivationEffect('CHALLENGES')).toBe('Challenges');
      expect(formatActivationEffect('SUPPORTS')).toBe('Supports');
      expect(formatActivationEffect('NEUTRAL')).toBe('Neutral');
      expect(formatActivationEffect('AMPLIFIES')).toBe('Amplifies');
      expect(formatActivationEffect('OBSTRUCTS')).toBe('Obstructs');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatActivationEffect(undefined)).toBe('Unavailable');
      expect(formatActivationEffect('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatTransitEffect', () => {
    it('formats transit trigger effects', () => {
      expect(formatTransitEffect('TRIGGER')).toBe('Trigger');
      expect(formatTransitEffect('MODIFIER')).toBe('Modifier');
      expect(formatTransitEffect('CHALLENGE')).toBe('Challenge');
      expect(formatTransitEffect('NO_MATERIAL_TRIGGER')).toBe('No Material Trigger');
      expect(formatTransitEffect('UNKNOWN')).toBe('Unknown');
      expect(formatTransitEffect('INSUFFICIENT_DATA')).toBe('Insufficient Data');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatTransitEffect(undefined)).toBe('Unavailable');
      expect(formatTransitEffect('UNAVAILABLE')).toBe('Unavailable');
    });
  });

  describe('formatSeverity', () => {
    it('formats qualification severities', () => {
      expect(formatSeverity('HIGH')).toBe('High Severity');
      expect(formatSeverity('MEDIUM')).toBe('Moderate');
      expect(formatSeverity('LOW')).toBe('Low Impact');
    });

    it('returns Unavailable for undefined or UNAVAILABLE', () => {
      expect(formatSeverity(undefined)).toBe('Unavailable');
      expect(formatSeverity('UNAVAILABLE')).toBe('Unavailable');
    });
  });
});
