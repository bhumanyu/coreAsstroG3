import { describe, it, expect } from 'vitest';
import { calculateVimshottari, normalizeDegrees } from '../vimshottari';
import { Planet } from '../../../types';

/**
 * Task D08-I: Longitude Wraparound and Nakshatra Boundary Validation
 */
describe('D08-I: Longitude Wraparound & Boundary Edge Cases', () => {
  const birthIso = '2000-01-01T00:00:00.000Z';

  describe('normalizeDegrees Angular Mapping', () => {
    it('maps 360°, multiples of 360°, and negative multiples to 0°', () => {
      expect(normalizeDegrees(0)).toBe(0);
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(720)).toBe(0);
      expect(Math.abs(normalizeDegrees(-360))).toBe(0);
      expect(Math.abs(normalizeDegrees(-720))).toBe(0);
    });

    it('maps angles near 360° correctly without negative zero or overflow', () => {
      expect(normalizeDegrees(359.999999)).toBeCloseTo(359.999999, 6);
      expect(normalizeDegrees(360.000001)).toBeCloseTo(0.000001, 6);
      expect(normalizeDegrees(-0.000001)).toBeCloseTo(359.999999, 6);
    });
  });

  describe('Nakshatra and Lord Selection at Cusp Boundaries', () => {
    it('correctly maps near-end-of-Revati (359.999999°) to Revati / Mercury with near-zero balance', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 359.999999
      });

      expect(timeline.nakshatra).toBe('Revati');
      expect(timeline.nakshatraLord).toBe(Planet.MERCURY);
      expect(timeline.nakshatraProgress).toBeCloseTo(1.0, 5);
      expect(timeline.remainingFraction).toBeCloseTo(0.0, 5);
      expect(timeline.mahadashas[0].planet).toBe(Planet.MERCURY);
    });

    it('correctly maps 0.0° and 360.0° to Ashwini / Ketu with 100% balance', () => {
      for (const lon of [0.0, 360.0, 720.0]) {
        const timeline = calculateVimshottari({
          birthDateTime: birthIso,
          moonSiderealLongitude: lon
        });

        expect(timeline.nakshatra).toBe('Ashwini');
        expect(timeline.nakshatraLord).toBe(Planet.KETU);
        expect(timeline.nakshatraProgress).toBe(0);
        expect(timeline.remainingFraction).toBe(1);
        expect(timeline.mahadashas[0].planet).toBe(Planet.KETU);
      }
    });

    it('correctly maps 0.000001° just inside Ashwini to Ashwini / Ketu', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0.000001
      });

      expect(timeline.nakshatra).toBe('Ashwini');
      expect(timeline.nakshatraLord).toBe(Planet.KETU);
      expect(timeline.nakshatraProgress).toBeGreaterThan(0);
      expect(timeline.nakshatraProgress).toBeLessThan(0.0001);
      expect(timeline.remainingFraction).toBeGreaterThan(0.9999);
    });

    it('correctly handles Ashwini -> Bharani boundary at 13°20\' (40/3 = 13.333333333333334°)', () => {
      const span = 40 / 3;

      // 1. Epsilon before 13°20': Ashwini (Ketu)
      const justBefore = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: span - 1e-8
      });
      expect(justBefore.nakshatra).toBe('Ashwini');
      expect(justBefore.nakshatraLord).toBe(Planet.KETU);
      expect(justBefore.nakshatraProgress).toBeCloseTo(1.0, 6);
      expect(justBefore.remainingFraction).toBeCloseTo(0.0, 6);

      // 2. Exact 13°20': Bharani (Venus)
      const exactBoundary = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: span
      });
      expect(exactBoundary.nakshatra).toBe('Bharani');
      expect(exactBoundary.nakshatraLord).toBe(Planet.VENUS);
      expect(exactBoundary.nakshatraProgress).toBe(0);
      expect(exactBoundary.remainingFraction).toBe(1);

      // 3. Epsilon after 13°20': Bharani (Venus)
      const justAfter = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: span + 1e-5
      });
      expect(justAfter.nakshatra).toBe('Bharani');
      expect(justAfter.nakshatraLord).toBe(Planet.VENUS);
      expect(justAfter.nakshatraProgress).toBeGreaterThan(0);
      expect(justAfter.nakshatraProgress).toBeLessThan(0.0001);
    });
  });
});
