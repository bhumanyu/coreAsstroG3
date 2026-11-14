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
      expect(formatDirection('SUPPORT')).toBe('Supportive');
      expect(formatDirection('CHALLENGE')).toBe('Challenging');
      expect(formatDirection('NEUTRAL')).toBe('Neutral');
      expect(formatDirection('MIXED')).toBe('A combination of supportive and challenging indications');
      expect(formatDirection('UNAVAILABLE')).toBe('Not available for this analysis');
      expect(formatDirection(undefined)).toBe('Not available');
      expect(formatDirection('')).toBe('Not available');
      expect(formatDirection('UNKNOWN_DIRECTION')).toBe('Not assessed');
      expect(formatDirection('  sUpPoRt  ')).toBe('Supportive');
    });
  });

  describe('formatEvidenceRole', () => {
    it('formats the seven canonical ProductEvidenceRole literals', () => {
      expect(formatEvidenceRole('PRIMARY')).toBe('Primary factor');
      expect(formatEvidenceRole('SUPPORTING')).toBe('Supporting factor');
      expect(formatEvidenceRole('CHALLENGING')).toBe('Challenging factor');
      expect(formatEvidenceRole('MODIFIER')).toBe('Transits may modify the underlying indications');
      expect(formatEvidenceRole('REFINEMENT')).toBe('Refining factor');
      expect(formatEvidenceRole('CONFLICTING')).toBe('Conflicting factor');
      expect(formatEvidenceRole('NEUTRAL')).toBe('Neutral');
      expect(formatEvidenceRole(undefined)).toBe('Not available');
    });
  });

  describe('formatConfidence', () => {
    it('formats real ProductConfidence literals', () => {
      expect(formatConfidence('HIGH')).toBe('High evidence confidence');
      expect(formatConfidence('MEDIUM')).toBe('Moderate evidence confidence');
      expect(formatConfidence('LOW')).toBe('Limited evidence confidence');
      expect(formatConfidence('UNAVAILABLE')).toBe('Confidence unavailable');
      expect(formatConfidence(undefined)).toBe('Confidence unavailable');
    });
  });

  describe('formatStrength', () => {
    it('formats free-form strength strings into Title Case', () => {
      expect(formatStrength('STRONGLY_SUPPORTED')).toBe('Strongly supportive indications');
      expect(formatStrength('VERY_STRONG')).toBe('Very strong foundation');
      expect(formatStrength('MODERATE')).toBe('Moderate foundation');
    });

    it('returns "Foundation not assessed" and NEVER "Weak" for UNAVAILABLE or missing', () => {
      expect(formatStrength('UNAVAILABLE')).toBe('Foundation not assessed');
      expect(formatStrength('unavailable')).toBe('Foundation not assessed');
      expect(formatStrength(undefined)).toBe('Not available');
      expect(formatStrength('')).toBe('Not available');
      expect(formatStrength('UNAVAILABLE')).not.toBe('Weak');
    });
  });

  describe('formatProductStatus', () => {
    it('formats real ProductStatus literals', () => {
      expect(formatProductStatus('READY')).toBe('Complete');
      expect(formatProductStatus('PARTIAL')).toBe('Partially complete');
      expect(formatProductStatus('ERROR')).toBe('Could not be completed');
      expect(formatProductStatus(undefined)).toBe('In progress');
    });
  });

  describe('formatRelationship', () => {
    it('formats varga relationship values without returning percentages', () => {
      expect(formatRelationship('CONFIRMS')).toBe('The divisional chart supports the natal indication');
      expect(formatRelationship('PARTIALLY_CONFIRMS')).toBe('The divisional chart provides partial support');
      expect(formatRelationship('MODIFIES')).toBe('The divisional chart modifies how the indication may manifest');
      expect(formatRelationship('CONFLICTS')).toBe('The divisional chart shows conflicting indications');
      expect(formatRelationship('UNAVAILABLE')).toBe('Not available for this analysis');
      expect(formatRelationship(undefined)).toBe('Not available');
    });
  });

  describe('formatSeverity', () => {
    it('formats qualification severity', () => {
      expect(formatSeverity('HIGH')).toBe('High severity');
      expect(formatSeverity('MEDIUM')).toBe('Moderate');
      expect(formatSeverity('LOW')).toBe('Low impact');
      expect(formatSeverity(undefined)).toBe('Information');
    });
  });
});
