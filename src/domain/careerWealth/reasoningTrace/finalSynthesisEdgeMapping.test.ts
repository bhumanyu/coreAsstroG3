import { describe, expect, it } from 'vitest';
import {
  mapActivationStatusToEdgeType,
  mapTimingStatusToEdgeType,
  mapDivisionalRelationshipToEdgeType,
  mapManifestationStatusToEdgeType,
  mapPromiseStatusToEdgeType
} from './finalSynthesisEdgeMapping';

describe('finalSynthesisEdgeMapping (CW-06B)', () => {
  describe('mapPromiseStatusToEdgeType', () => {
    it('maps positive promise statuses to SUPPORTS', () => {
      expect(mapPromiseStatusToEdgeType('VERY_STRONG')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('STRONG')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('MODERATE')).toBe('SUPPORTS');
    });

    it('maps CHALLENGED promise status to CHALLENGES', () => {
      expect(mapPromiseStatusToEdgeType('CHALLENGED')).toBe('CHALLENGES');
    });

    it('returns undefined for MIXED and INSUFFICIENT_DATA (no edge)', () => {
      expect(mapPromiseStatusToEdgeType('MIXED')).toBeUndefined();
      expect(mapPromiseStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
    });
  });

  describe('mapActivationStatusToEdgeType', () => {
    it('maps SUPPORT to ACTIVATES', () => {
      expect(mapActivationStatusToEdgeType('SUPPORT')).toBe('ACTIVATES');
    });

    it('maps CHALLENGE to CHALLENGES', () => {
      expect(mapActivationStatusToEdgeType('CHALLENGE')).toBe('CHALLENGES');
    });

    it('maps MIXED to MODIFIES', () => {
      expect(mapActivationStatusToEdgeType('MIXED')).toBe('MODIFIES');
    });

    it('returns undefined for NEUTRAL and INSUFFICIENT_DATA (no edge)', () => {
      expect(mapActivationStatusToEdgeType('NEUTRAL')).toBeUndefined();
      expect(mapActivationStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
    });
  });

  describe('mapTimingStatusToEdgeType', () => {
    it('maps SUPPORT to ACTIVATES', () => {
      expect(mapTimingStatusToEdgeType('SUPPORT')).toBe('ACTIVATES');
    });

    it('maps CHALLENGE to CHALLENGES', () => {
      expect(mapTimingStatusToEdgeType('CHALLENGE')).toBe('CHALLENGES');
    });

    it('maps MIXED to MODIFIES', () => {
      expect(mapTimingStatusToEdgeType('MIXED')).toBe('MODIFIES');
    });

    it('returns undefined for NEUTRAL and INSUFFICIENT_DATA (no edge)', () => {
      expect(mapTimingStatusToEdgeType('NEUTRAL')).toBeUndefined();
      expect(mapTimingStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
    });
  });

  describe('mapDivisionalRelationshipToEdgeType', () => {
    it('maps CONFIRMS and PARTIALLY_CONFIRMS to CONFIRMS', () => {
      expect(mapDivisionalRelationshipToEdgeType('CONFIRMS')).toBe('CONFIRMS');
      expect(mapDivisionalRelationshipToEdgeType('PARTIALLY_CONFIRMS')).toBe('CONFIRMS');
    });

    it('maps CONFLICTS to CHALLENGES', () => {
      expect(mapDivisionalRelationshipToEdgeType('CONFLICTS')).toBe('CHALLENGES');
    });

    it('returns undefined for MODIFIES and UNAVAILABLE (no edge)', () => {
      expect(mapDivisionalRelationshipToEdgeType('MODIFIES')).toBeUndefined();
      expect(mapDivisionalRelationshipToEdgeType('UNAVAILABLE')).toBeUndefined();
    });
  });

  describe('mapManifestationStatusToEdgeType', () => {
    it('maps VERY_STRONG, STRONG, MODERATE to MANIFESTS', () => {
      expect(mapManifestationStatusToEdgeType('VERY_STRONG')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('STRONG')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('MODERATE')).toBe('MANIFESTS');
    });

    it('maps CHALLENGED to CHALLENGES', () => {
      expect(mapManifestationStatusToEdgeType('CHALLENGED')).toBe('CHALLENGES');
    });

    it('returns undefined for MIXED and INSUFFICIENT_DATA (no edge)', () => {
      expect(mapManifestationStatusToEdgeType('MIXED')).toBeUndefined();
      expect(mapManifestationStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
    });
  });
});
