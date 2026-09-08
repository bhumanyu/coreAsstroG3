import { describe, it, expect } from 'vitest';
import {
  formatDirection,
  formatEvidenceRole,
  formatConfidence,
  formatStrength,
  formatProductStatus,
  formatRelationship,
  formatSeverity
} from '../overviewFormat';

describe('Overview Presentation Formatters (P-UI-03)', () => {
  describe('formatDirection', () => {
    it('formats real ProductDirection literals', () => {
      expect(formatDirection('SUPPORT')).toBe('Supporting');
      expect(formatDirection('CHALLENGE')).toBe('Challenging');
      expect(formatDirection('NEUTRAL')).toBe('Neutral');
      expect(formatDirection('MIXED')).toBe('Mixed');
      expect(formatDirection(undefined)).toBe('Neutral');
    });
  });

  describe('formatEvidenceRole', () => {
    it('formats the seven canonical ProductEvidenceRole literals', () => {
      expect(formatEvidenceRole('PRIMARY')).toBe('Primary Driver');
      expect(formatEvidenceRole('SUPPORTING')).toBe('Supporting');
      expect(formatEvidenceRole('CHALLENGING')).toBe('Challenging');
      expect(formatEvidenceRole('MODIFIER')).toBe('Modifier');
      expect(formatEvidenceRole('REFINEMENT')).toBe('Refinement');
      expect(formatEvidenceRole('CONFLICTING')).toBe('Conflicting');
      expect(formatEvidenceRole('NEUTRAL')).toBe('Contextual');
      expect(formatEvidenceRole(undefined)).toBe('Contextual');
    });
  });

  describe('formatConfidence', () => {
    it('formats real ProductConfidence literals', () => {
      expect(formatConfidence('HIGH')).toBe('High Confidence');
      expect(formatConfidence('MEDIUM')).toBe('Medium Confidence');
      expect(formatConfidence('LOW')).toBe('Low Confidence');
      expect(formatConfidence(undefined)).toBe('Medium Confidence');
    });
  });

  describe('formatStrength', () => {
    it('formats free-form strength strings into Title Case', () => {
      expect(formatStrength('STRONGLY_SUPPORTED')).toBe('Strongly Supported');
      expect(formatStrength('VERY_STRONG')).toBe('Very Strong');
      expect(formatStrength('MODERATE')).toBe('Moderate');
    });

    it('returns "Unavailable" and NEVER "Weak" for UNAVAILABLE or missing', () => {
      expect(formatStrength('UNAVAILABLE')).toBe('Unavailable');
      expect(formatStrength('unavailable')).toBe('Unavailable');
      expect(formatStrength(undefined)).toBe('Unavailable');
      expect(formatStrength('')).toBe('Unavailable');
      expect(formatStrength('UNAVAILABLE')).not.toBe('Weak');
    });
  });

  describe('formatProductStatus', () => {
    it('formats real ProductStatus literals', () => {
      expect(formatProductStatus('READY')).toBe('Complete');
      expect(formatProductStatus('PARTIAL')).toBe('Partial Assessment');
      expect(formatProductStatus('ERROR')).toBe('Calculation Issue');
      expect(formatProductStatus(undefined)).toBe('In Progress');
    });
  });

  describe('formatRelationship', () => {
    it('formats varga relationship values without returning percentages', () => {
      expect(formatRelationship('CONFIRMS')).toBe('Confirms');
      expect(formatRelationship('PARTIALLY_CONFIRMS')).toBe('Partially Confirms');
      expect(formatRelationship('MODIFIES')).toBe('Modifies');
      expect(formatRelationship('CONFLICTS')).toBe('Conflicts');
      expect(formatRelationship('UNAVAILABLE')).toBe('Unavailable');
      expect(formatRelationship(undefined)).toBe('Unavailable');
    });
  });

  describe('formatSeverity', () => {
    it('formats qualification severity', () => {
      expect(formatSeverity('HIGH')).toBe('High Severity');
      expect(formatSeverity('MEDIUM')).toBe('Moderate');
      expect(formatSeverity('LOW')).toBe('Low Impact');
      expect(formatSeverity(undefined)).toBe('Information');
    });
  });
});
