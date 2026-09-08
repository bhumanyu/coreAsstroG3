import { describe, it, expect } from 'vitest';
import {
  formatConclusionStatus,
  formatConfidence,
  formatAvailability,
  formatDirection,
  formatEvidenceRole,
  formatPromiseStrength,
  formatVargaRelationship,
  formatActivationEffect,
  formatTransitEffect,
  formatSeverity,
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass,
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass,
  getVargaRelationshipBadgeClass,
  getAvailabilityBadgeClass,
  getSeverityBadgeClass
} from '../reasoningFormat';

describe('reasoningFormat pure presentation formatters (P-UI-06)', () => {
  describe('formatConclusionStatus', () => {
    it('formats canonical literals', () => {
      expect(formatConclusionStatus('STRONGLY_SUPPORTED')).toBe('Strongly Supported');
      expect(formatConclusionStatus('SUPPORTED')).toBe('Supported');
      expect(formatConclusionStatus('MIXED')).toBe('Mixed');
      expect(formatConclusionStatus('CHALLENGED')).toBe('Challenged');
      expect(formatConclusionStatus('UNAVAILABLE')).toBe('Unavailable');
      expect(formatConclusionStatus(undefined)).toBe('Unavailable');
    });
  });

  describe('formatConfidence', () => {
    it('formats canonical confidence values', () => {
      expect(formatConfidence('HIGH')).toBe('High Confidence');
      expect(formatConfidence('MEDIUM')).toBe('Medium Confidence');
      expect(formatConfidence('LOW')).toBe('Low Confidence');
      expect(formatConfidence('UNAVAILABLE')).toBe('Unavailable');
      expect(formatConfidence(undefined)).toBe('Unavailable');
    });
  });

  describe('formatAvailability', () => {
    it('formats all four availability literals', () => {
      expect(formatAvailability('AVAILABLE')).toBe('Available');
      expect(formatAvailability('PARTIAL')).toBe('Partial');
      expect(formatAvailability('CONDITIONAL')).toBe('Conditional');
      expect(formatAvailability('UNAVAILABLE')).toBe('Unavailable');
      expect(formatAvailability(undefined)).toBe('Unavailable');
    });
  });

  describe('formatDirection', () => {
    it('formats direction literals', () => {
      expect(formatDirection('SUPPORT')).toBe('Supporting');
      expect(formatDirection('CHALLENGE')).toBe('Challenging');
      expect(formatDirection('NEUTRAL')).toBe('Neutral');
      expect(formatDirection('MIXED')).toBe('Mixed');
      expect(formatDirection('UNAVAILABLE')).toBe('Unavailable');
      expect(formatDirection(undefined)).toBe('Unavailable');
    });
  });

  describe('formatEvidenceRole', () => {
    it('formats all seven canonical evidence roles', () => {
      expect(formatEvidenceRole('PRIMARY')).toBe('Primary Driver');
      expect(formatEvidenceRole('SUPPORTING')).toBe('Supporting');
      expect(formatEvidenceRole('CHALLENGING')).toBe('Challenging');
      expect(formatEvidenceRole('MODIFIER')).toBe('Modifier');
      expect(formatEvidenceRole('REFINEMENT')).toBe('Refinement');
      expect(formatEvidenceRole('CONFLICTING')).toBe('Conflicting');
      expect(formatEvidenceRole('NEUTRAL')).toBe('Contextual');
      expect(formatEvidenceRole('UNAVAILABLE')).toBe('Unavailable');
      expect(formatEvidenceRole(undefined)).toBe('Unavailable');
    });
  });

  describe('formatPromiseStrength', () => {
    it('formats promise strength literals', () => {
      expect(formatPromiseStrength('VERY_STRONG')).toBe('Very Strong');
      expect(formatPromiseStrength('STRONG')).toBe('Strong');
      expect(formatPromiseStrength('MODERATE')).toBe('Moderate');
      expect(formatPromiseStrength('WEAK')).toBe('Weak');
      expect(formatPromiseStrength('VERY_WEAK')).toBe('Very Weak');
      expect(formatPromiseStrength('UNAVAILABLE')).toBe('Unavailable');
      expect(formatPromiseStrength(undefined)).toBe('Unavailable');
    });
  });

  describe('formatVargaRelationship', () => {
    it('formats varga relationship values', () => {
      expect(formatVargaRelationship('CONFIRMS')).toBe('Confirms');
      expect(formatVargaRelationship('PARTIALLY_CONFIRMS')).toBe('Partially Confirms');
      expect(formatVargaRelationship('MODIFIES')).toBe('Modifies');
      expect(formatVargaRelationship('CONFLICTS')).toBe('Conflicts');
      expect(formatVargaRelationship('UNAVAILABLE')).toBe('Unavailable');
      expect(formatVargaRelationship(undefined)).toBe('Unavailable');
    });
  });

  describe('formatActivationEffect & formatTransitEffect', () => {
    it('formats activation and transit effects', () => {
      expect(formatActivationEffect('ACTIVATES')).toBe('Activates');
      expect(formatActivationEffect('CHALLENGES')).toBe('Challenges');
      expect(formatActivationEffect('SUPPORTS')).toBe('Supports');
      expect(formatActivationEffect('AMPLIFIES')).toBe('Amplifies');
      expect(formatActivationEffect('OBSTRUCTS')).toBe('Obstructs');

      expect(formatTransitEffect('TRIGGER')).toBe('Trigger');
      expect(formatTransitEffect('MODIFIER')).toBe('Modifier');
      expect(formatTransitEffect('CHALLENGE')).toBe('Challenge');
      expect(formatTransitEffect('NO_MATERIAL_TRIGGER')).toBe('No Material Trigger');
    });
  });

  describe('formatSeverity', () => {
    it('formats qualification severity', () => {
      expect(formatSeverity('HIGH')).toBe('High Severity');
      expect(formatSeverity('MEDIUM')).toBe('Moderate');
      expect(formatSeverity('LOW')).toBe('Low Impact');
      expect(formatSeverity(undefined)).toBe('Unavailable');
    });
  });

  describe('badge class helpers', () => {
    it('returns appropriate tailwind classes', () => {
      expect(getConclusionStatusBadgeClass('STRONGLY_SUPPORTED')).toContain('text-emerald-300');
      expect(getConclusionStatusBadgeClass('CHALLENGED')).toContain('text-rose-300');
      expect(getPromiseStrengthBadgeClass('STRONG')).toContain('text-indigo-300');
      expect(getDirectionBadgeClass('SUPPORT')).toContain('text-emerald-300');
      expect(getEvidenceRoleBadgeClass('PRIMARY')).toContain('text-purple-300');
      expect(getVargaRelationshipBadgeClass('CONFIRMS')).toContain('text-emerald-300');
      expect(getAvailabilityBadgeClass('AVAILABLE')).toContain('text-emerald-300');
      expect(getSeverityBadgeClass('HIGH')).toContain('text-rose-300');
    });
  });
});
