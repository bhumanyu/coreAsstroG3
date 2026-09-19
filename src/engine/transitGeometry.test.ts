import { describe, it, expect } from 'vitest';
import {
  normalizeAngularDistance,
  classifyTransitAngularRelationship,
  DEFAULT_TRANSIT_GEOMETRY_CONFIG
} from './transitGeometry';
import { Sign, TransitRelationshipType } from '../types';

describe('PR-038B Transit Geometry Engine', () => {
  describe('normalizeAngularDistance', () => {
    it('calculates normal minimal angular distance', () => {
      expect(normalizeAngularDistance(10, 30)).toBeCloseTo(20);
      expect(normalizeAngularDistance(30, 10)).toBeCloseTo(20);
    });

    it('calculates wraparound minimal angular distance (359° and 1° -> 2°)', () => {
      expect(normalizeAngularDistance(359, 1)).toBeCloseTo(2);
      expect(normalizeAngularDistance(1, 359)).toBeCloseTo(2);
    });

    it('returns 0 for equal longitudes', () => {
      expect(normalizeAngularDistance(45, 45)).toBe(0);
      expect(normalizeAngularDistance(0, 360)).toBe(0);
    });

    it('handles exact 180° opposition distance', () => {
      expect(normalizeAngularDistance(0, 180)).toBe(180);
      expect(normalizeAngularDistance(10, 190)).toBe(180);
    });

    it('normalizes angles outside [0, 360)', () => {
      expect(normalizeAngularDistance(730, 30)).toBeCloseTo(20);
      expect(normalizeAngularDistance(-10, 10)).toBeCloseTo(20);
    });

    it('throws on non-finite longitudes', () => {
      expect(() => normalizeAngularDistance(NaN, 10)).toThrow(/must be a finite number/);
      expect(() => normalizeAngularDistance(10, Infinity)).toThrow(/must be a finite number/);
      expect(() => normalizeAngularDistance(-Infinity, 10)).toThrow(/must be a finite number/);
    });
  });

  describe('classifyTransitAngularRelationship', () => {
    it('identifies exact contact within tolerance (precedence over same sign)', () => {
      const rel = classifyTransitAngularRelationship(
        15.0,
        15.0000005,
        Sign.ARIES,
        Sign.ARIES,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      expect(rel.relationship).toBe(TransitRelationshipType.EXACT_CONTACT);
      expect(rel.exactContact).toBe(true);
      expect(rel.angularSeparation).toBeCloseTo(0.0000005, 7);
      expect(rel.orb).toBeCloseTo(0.0000005, 7);
      expect(Object.isFrozen(rel)).toBe(true);
    });

    it('identifies conjunction when within configured orb', () => {
      const config = {
        conjunctionOrbDegrees: 5,
        oppositionOrbDegrees: 0,
        exactContactToleranceDegrees: 1e-6
      };
      // Across sign boundary: 29° Aries (29°) and 1° Taurus (31°) -> separation 2°
      const rel = classifyTransitAngularRelationship(
        29,
        31,
        Sign.ARIES,
        Sign.TAURUS,
        config
      );
      expect(rel.relationship).toBe(TransitRelationshipType.CONJUNCTION);
      expect(rel.exactContact).toBe(false);
      expect(rel.angularSeparation).toBeCloseTo(2);
      expect(rel.orb).toBeCloseTo(2);
    });

    it('identifies opposition when within configured orb', () => {
      const config = {
        conjunctionOrbDegrees: 0,
        oppositionOrbDegrees: 5,
        exactContactToleranceDegrees: 1e-6
      };
      // 10° Aries (10°) vs 13° Libra (193°) -> diff 183°, minimal distance on circle 177°, opposition delta 3°
      const rel = classifyTransitAngularRelationship(
        10,
        193,
        Sign.ARIES,
        Sign.LIBRA,
        config
      );
      expect(rel.relationship).toBe(TransitRelationshipType.OPPOSITION);
      expect(rel.exactContact).toBe(false);
      expect(rel.angularSeparation).toBeCloseTo(177);
      expect(rel.orb).toBeCloseTo(3);
    });

    it('identifies same sign when signs match but outside conjunction/exact contact', () => {
      // 1° Aries vs 29° Aries -> separation 28°
      const rel = classifyTransitAngularRelationship(
        1,
        29,
        Sign.ARIES,
        Sign.ARIES,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      expect(rel.relationship).toBe(TransitRelationshipType.SAME_SIGN);
      expect(rel.exactContact).toBe(false);
      expect(rel.angularSeparation).toBeCloseTo(28);
      expect(rel.orb).toBeCloseTo(28);
    });

    it('returns NONE when signs differ and no geometric aspect matches', () => {
      // 10° Aries vs 10° Taurus -> separation 30°
      const rel = classifyTransitAngularRelationship(
        10,
        40,
        Sign.ARIES,
        Sign.TAURUS,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      expect(rel.relationship).toBe(TransitRelationshipType.NONE);
      expect(rel.exactContact).toBe(false);
      expect(rel.angularSeparation).toBeCloseTo(30);
    });

    it('handles 359° and 1° wraparound correctly', () => {
      const config = {
        conjunctionOrbDegrees: 3,
        oppositionOrbDegrees: 0,
        exactContactToleranceDegrees: 1e-6
      };
      const rel = classifyTransitAngularRelationship(
        359,
        1,
        Sign.PISCES,
        Sign.ARIES,
        config
      );
      expect(rel.relationship).toBe(TransitRelationshipType.CONJUNCTION);
      expect(rel.angularSeparation).toBeCloseTo(2);
      expect(rel.exactContact).toBe(false);
    });

    it('throws on non-finite input longitudes', () => {
      expect(() =>
        classifyTransitAngularRelationship(NaN, 10, Sign.ARIES, Sign.ARIES)
      ).toThrow(/must be a finite number/);
      expect(() =>
        classifyTransitAngularRelationship(10, Infinity, Sign.ARIES, Sign.ARIES)
      ).toThrow(/must be a finite number/);
    });

    it('throws on negative or non-finite config orbs', () => {
      expect(() =>
        classifyTransitAngularRelationship(10, 20, Sign.ARIES, Sign.ARIES, {
          conjunctionOrbDegrees: -1,
          oppositionOrbDegrees: 0,
          exactContactToleranceDegrees: 1e-6
        })
      ).toThrow(/must be a non-negative finite number/);

      expect(() =>
        classifyTransitAngularRelationship(10, 20, Sign.ARIES, Sign.ARIES, {
          conjunctionOrbDegrees: 0,
          oppositionOrbDegrees: -0.5,
          exactContactToleranceDegrees: 1e-6
        })
      ).toThrow(/must be a non-negative finite number/);

      expect(() =>
        classifyTransitAngularRelationship(10, 20, Sign.ARIES, Sign.ARIES, {
          conjunctionOrbDegrees: 0,
          oppositionOrbDegrees: 0,
          exactContactToleranceDegrees: NaN
        })
      ).toThrow(/must be a non-negative finite number/);
    });

    it('exact contact wins over same-sign precedence', () => {
      const rel = classifyTransitAngularRelationship(
        10,
        10,
        Sign.ARIES,
        Sign.ARIES,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      expect(rel.relationship).toBe(TransitRelationshipType.EXACT_CONTACT);
      expect(rel.exactContact).toBe(true);
      expect(rel.angularSeparation).toBe(0);
    });

    it('close same-sign classifies as conjunction when within configured orb', () => {
      const config = {
        conjunctionOrbDegrees: 5,
        oppositionOrbDegrees: 0,
        exactContactToleranceDegrees: 1e-6
      };
      // 10° Aries vs 12° Aries -> separation 2° <= 5° orb
      const rel = classifyTransitAngularRelationship(
        10,
        12,
        Sign.ARIES,
        Sign.ARIES,
        config
      );
      expect(rel.relationship).toBe(TransitRelationshipType.CONJUNCTION);
      expect(rel.angularSeparation).toBeCloseTo(2);
    });

    it('provides deterministic results for identical inputs', () => {
      const rel1 = classifyTransitAngularRelationship(
        25.5,
        28.5,
        Sign.ARIES,
        Sign.ARIES,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      const rel2 = classifyTransitAngularRelationship(
        25.5,
        28.5,
        Sign.ARIES,
        Sign.ARIES,
        DEFAULT_TRANSIT_GEOMETRY_CONFIG
      );
      expect(rel1).toEqual(rel2);
    });
  });
});
