import { describe, expect, it } from 'vitest';
import {
  mapAxisStatusToEdgeType,
  mapActivationStatusToEdgeType,
  mapDivisionalRelationshipToEdgeType,
  mapManifestationStatusToEdgeType,
  mapPromiseStatusToEdgeType
} from './finalSynthesisEdgeMapping';

describe('finalSynthesisEdgeMapping (CW-06B)', () => {
  describe('mapAxisStatusToEdgeType', () => {
    it('maps SUPPORT to SUPPORTS', () => {
      expect(mapAxisStatusToEdgeType('SUPPORT')).toBe('SUPPORTS');
    });

    it('maps CHALLENGE to CHALLENGES', () => {
      expect(mapAxisStatusToEdgeType('CHALLENGE')).toBe('CHALLENGES');
    });

    it('returns undefined for NEUTRAL, INSUFFICIENT_DATA, MIXED, and undefined', () => {
      expect(mapAxisStatusToEdgeType('NEUTRAL')).toBeUndefined();
      expect(mapAxisStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
      expect(mapAxisStatusToEdgeType('MIXED')).toBeUndefined();
      expect(mapAxisStatusToEdgeType(undefined)).toBeUndefined();
    });
  });

  describe('mapActivationStatusToEdgeType', () => {
    it('maps SUPPORT and ACTIVE to ACTIVATES', () => {
      expect(mapActivationStatusToEdgeType('SUPPORT')).toBe('ACTIVATES');
      expect(mapActivationStatusToEdgeType('ACTIVE')).toBe('ACTIVATES');
    });

    it('maps CHALLENGE and INACTIVE to CHALLENGES', () => {
      expect(mapActivationStatusToEdgeType('CHALLENGE')).toBe('CHALLENGES');
      expect(mapActivationStatusToEdgeType('INACTIVE')).toBe('CHALLENGES');
    });

    it('returns undefined for NEUTRAL, INSUFFICIENT_DATA, MIXED, and undefined', () => {
      expect(mapActivationStatusToEdgeType('NEUTRAL')).toBeUndefined();
      expect(mapActivationStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
      expect(mapActivationStatusToEdgeType('MIXED')).toBeUndefined();
      expect(mapActivationStatusToEdgeType(undefined)).toBeUndefined();
    });
  });

  describe('mapDivisionalRelationshipToEdgeType', () => {
    it('maps CONFIRMS and PARTIALLY_CONFIRMS to CONFIRMS', () => {
      expect(mapDivisionalRelationshipToEdgeType('CONFIRMS')).toBe('CONFIRMS');
      expect(mapDivisionalRelationshipToEdgeType('PARTIALLY_CONFIRMS')).toBe('CONFIRMS');
    });

    it('maps CONFLICTS and CONFLICTING to CHALLENGES', () => {
      expect(mapDivisionalRelationshipToEdgeType('CONFLICTS')).toBe('CHALLENGES');
      expect(mapDivisionalRelationshipToEdgeType('CONFLICTING')).toBe('CHALLENGES');
    });

    it('returns undefined for NEUTRAL, UNAVAILABLE, and undefined (no edge)', () => {
      expect(mapDivisionalRelationshipToEdgeType('NEUTRAL')).toBeUndefined();
      expect(mapDivisionalRelationshipToEdgeType('UNAVAILABLE')).toBeUndefined();
      expect(mapDivisionalRelationshipToEdgeType(undefined)).toBeUndefined();
    });
  });

  describe('mapManifestationStatusToEdgeType', () => {
    it('maps real manifestation statuses to MANIFESTS', () => {
      expect(mapManifestationStatusToEdgeType('VERY_STRONG')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('STRONG')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('MODERATE')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('MIXED')).toBe('MANIFESTS');
      expect(mapManifestationStatusToEdgeType('CHALLENGED')).toBe('MANIFESTS');
    });

    it('returns undefined for INSUFFICIENT_DATA and undefined', () => {
      expect(mapManifestationStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
      expect(mapManifestationStatusToEdgeType(undefined)).toBeUndefined();
      expect(mapManifestationStatusToEdgeType('')).toBeUndefined();
    });
  });

  describe('mapPromiseStatusToEdgeType', () => {
    it('maps positive promise statuses to SUPPORTS', () => {
      expect(mapPromiseStatusToEdgeType('VERY_STRONG')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('STRONG')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('MODERATE')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('GOOD')).toBe('SUPPORTS');
      expect(mapPromiseStatusToEdgeType('EXCELLENT')).toBe('SUPPORTS');
    });

    it('maps negative promise statuses to CHALLENGES', () => {
      expect(mapPromiseStatusToEdgeType('CHALLENGED')).toBe('CHALLENGES');
      expect(mapPromiseStatusToEdgeType('POOR')).toBe('CHALLENGES');
      expect(mapPromiseStatusToEdgeType('WEAK')).toBe('CHALLENGES');
      expect(mapPromiseStatusToEdgeType('VERY_WEAK')).toBe('CHALLENGES');
      expect(mapPromiseStatusToEdgeType('LIMITED')).toBe('CHALLENGES');
    });

    it('returns undefined for non-decisive or undefined promise statuses', () => {
      expect(mapPromiseStatusToEdgeType('INSUFFICIENT_DATA')).toBeUndefined();
      expect(mapPromiseStatusToEdgeType(undefined)).toBeUndefined();
    });
  });
});
