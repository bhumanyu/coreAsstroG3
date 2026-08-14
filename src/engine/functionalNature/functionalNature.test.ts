import { describe, it, expect } from 'vitest';
import { Sign, Planet } from '../../types';
import { SIGNS_ORDER } from '../../data/astroData';
import { determineFunctionalNature, FunctionalNature } from './functionalNature';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';

describe('Functional Nature Classifier (PR-042)', () => {
  describe('Functional Nature Rules', () => {
    it('Aries Mars owns [1,8] (Trikona 1, Dusthana 8) => MIXED', () => {
      const report = determineFunctionalNature(Sign.ARIES);
      const marsEv = report.evidence.find(e => e.planet === Planet.MARS);
      expect(marsEv?.functionalNature).toBe(FunctionalNature.MIXED);
    });

    it('Aries Sun owns [5] (Trikona 5, no Dusthana) => BENEFIC', () => {
      const report = determineFunctionalNature(Sign.ARIES);
      const sunEv = report.evidence.find(e => e.planet === Planet.SUN);
      expect(sunEv?.functionalNature).toBe(FunctionalNature.BENEFIC);
    });

    it('Aries Mercury owns [3,6] (Dusthana 6, no Trikona) => MALEFIC', () => {
      const report = determineFunctionalNature(Sign.ARIES);
      const mercEv = report.evidence.find(e => e.planet === Planet.MERCURY);
      expect(mercEv?.functionalNature).toBe(FunctionalNature.MALEFIC);
    });

    it('Aries Saturn owns [10,11] (neither Trikona nor Dusthana) => NEUTRAL', () => {
      const report = determineFunctionalNature(Sign.ARIES);
      const satEv = report.evidence.find(e => e.planet === Planet.SATURN);
      expect(satEv?.functionalNature).toBe(FunctionalNature.NEUTRAL);
    });

    it('accepts a HouseLordshipReport input directly', () => {
      const hlReport = analyzeHouseLordship(Sign.CANCER);
      const report = determineFunctionalNature(hlReport);
      expect(report.evidence.length).toBe(9);
    });
  });

  describe('Rahu / Ketu', () => {
    it('Rahu and Ketu are always NEUTRAL across all 12 ascendants', () => {
      for (const ascSign of SIGNS_ORDER) {
        const report = determineFunctionalNature(ascSign);
        const rahuEv = report.evidence.find(e => e.planet === Planet.RAHU);
        const ketuEv = report.evidence.find(e => e.planet === Planet.KETU);

        expect(rahuEv?.functionalNature).toBe(FunctionalNature.NEUTRAL);
        expect(ketuEv?.functionalNature).toBe(FunctionalNature.NEUTRAL);
      }
    });
  });

  describe('Immutability and Error Handling', () => {
    it('returns frozen report, evidence array, and evidence items', () => {
      const report = determineFunctionalNature(Sign.ARIES);
      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.evidence)).toBe(true);
      expect(Object.isFrozen(report.evidence[0])).toBe(true);
    });

    it('throws TypeError for null/invalid input', () => {
      expect(() => determineFunctionalNature(null as any)).toThrow(TypeError);
      expect(() => determineFunctionalNature(undefined as any)).toThrow(TypeError);
      expect(() => determineFunctionalNature('INVALID' as any)).toThrow(TypeError);
    });
  });

  describe('Exhaustive 12 Ascendants x 7 Classical Planets Vector Matrix', () => {
    it('verifies exact functional nature for all 12 ascendants and 7 classical planets', () => {
      const matrix: Record<Sign, Record<Planet, FunctionalNature>> = {
        [Sign.ARIES]: {
          [Planet.SUN]: FunctionalNature.BENEFIC,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.MIXED,
          [Planet.MERCURY]: FunctionalNature.MALEFIC,
          [Planet.JUPITER]: FunctionalNature.MIXED,
          [Planet.VENUS]: FunctionalNature.NEUTRAL,
          [Planet.SATURN]: FunctionalNature.NEUTRAL,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.TAURUS]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.MALEFIC,
          [Planet.MERCURY]: FunctionalNature.BENEFIC,
          [Planet.JUPITER]: FunctionalNature.MALEFIC,
          [Planet.VENUS]: FunctionalNature.MIXED,
          [Planet.SATURN]: FunctionalNature.BENEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.GEMINI]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.MALEFIC,
          [Planet.MERCURY]: FunctionalNature.BENEFIC,
          [Planet.JUPITER]: FunctionalNature.NEUTRAL,
          [Planet.VENUS]: FunctionalNature.MIXED,
          [Planet.SATURN]: FunctionalNature.MIXED,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.CANCER]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.BENEFIC,
          [Planet.MARS]: FunctionalNature.BENEFIC,
          [Planet.MERCURY]: FunctionalNature.MALEFIC,
          [Planet.JUPITER]: FunctionalNature.MIXED,
          [Planet.VENUS]: FunctionalNature.NEUTRAL,
          [Planet.SATURN]: FunctionalNature.MALEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.LEO]: {
          [Planet.SUN]: FunctionalNature.BENEFIC,
          [Planet.MOON]: FunctionalNature.MALEFIC,
          [Planet.MARS]: FunctionalNature.BENEFIC,
          [Planet.MERCURY]: FunctionalNature.NEUTRAL,
          [Planet.JUPITER]: FunctionalNature.MIXED,
          [Planet.VENUS]: FunctionalNature.NEUTRAL,
          [Planet.SATURN]: FunctionalNature.MALEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.VIRGO]: {
          [Planet.SUN]: FunctionalNature.MALEFIC,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.MALEFIC,
          [Planet.MERCURY]: FunctionalNature.BENEFIC,
          [Planet.JUPITER]: FunctionalNature.NEUTRAL,
          [Planet.VENUS]: FunctionalNature.BENEFIC,
          [Planet.SATURN]: FunctionalNature.MIXED,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.LIBRA]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.NEUTRAL,
          [Planet.MERCURY]: FunctionalNature.MIXED,
          [Planet.JUPITER]: FunctionalNature.MALEFIC,
          [Planet.VENUS]: FunctionalNature.MIXED,
          [Planet.SATURN]: FunctionalNature.BENEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.SCORPIO]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.BENEFIC,
          [Planet.MARS]: FunctionalNature.MIXED,
          [Planet.MERCURY]: FunctionalNature.MALEFIC,
          [Planet.JUPITER]: FunctionalNature.BENEFIC,
          [Planet.VENUS]: FunctionalNature.MALEFIC,
          [Planet.SATURN]: FunctionalNature.NEUTRAL,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.SAGITTARIUS]: {
          [Planet.SUN]: FunctionalNature.BENEFIC,
          [Planet.MOON]: FunctionalNature.MALEFIC,
          [Planet.MARS]: FunctionalNature.MIXED,
          [Planet.MERCURY]: FunctionalNature.NEUTRAL,
          [Planet.JUPITER]: FunctionalNature.BENEFIC,
          [Planet.VENUS]: FunctionalNature.MALEFIC,
          [Planet.SATURN]: FunctionalNature.NEUTRAL,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.CAPRICORN]: {
          [Planet.SUN]: FunctionalNature.MALEFIC,
          [Planet.MOON]: FunctionalNature.NEUTRAL,
          [Planet.MARS]: FunctionalNature.NEUTRAL,
          [Planet.MERCURY]: FunctionalNature.MIXED,
          [Planet.JUPITER]: FunctionalNature.MALEFIC,
          [Planet.VENUS]: FunctionalNature.BENEFIC,
          [Planet.SATURN]: FunctionalNature.BENEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.AQUARIUS]: {
          [Planet.SUN]: FunctionalNature.NEUTRAL,
          [Planet.MOON]: FunctionalNature.MALEFIC,
          [Planet.MARS]: FunctionalNature.NEUTRAL,
          [Planet.MERCURY]: FunctionalNature.MIXED,
          [Planet.JUPITER]: FunctionalNature.NEUTRAL,
          [Planet.VENUS]: FunctionalNature.BENEFIC,
          [Planet.SATURN]: FunctionalNature.MIXED,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        },
        [Sign.PISCES]: {
          [Planet.SUN]: FunctionalNature.MALEFIC,
          [Planet.MOON]: FunctionalNature.BENEFIC,
          [Planet.MARS]: FunctionalNature.BENEFIC,
          [Planet.MERCURY]: FunctionalNature.NEUTRAL,
          [Planet.JUPITER]: FunctionalNature.BENEFIC,
          [Planet.VENUS]: FunctionalNature.MALEFIC,
          [Planet.SATURN]: FunctionalNature.MALEFIC,
          [Planet.RAHU]: FunctionalNature.NEUTRAL,
          [Planet.KETU]: FunctionalNature.NEUTRAL
        }
      };

      for (const ascSign of SIGNS_ORDER) {
        const report = determineFunctionalNature(ascSign);
        for (const ev of report.evidence) {
          const expected = matrix[ascSign][ev.planet];
          expect(ev.functionalNature).toBe(expected);
        }
      }
    });
  });
});
