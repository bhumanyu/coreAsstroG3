import { describe, it, expect } from 'vitest';
import { VIMSHOTTARI_YEAR_DAYS } from '../vimshottari';
import {
  DASHA_REFERENCE_CASES,
  ASTRONOMY_REFERENCE_CASES,
  DASHA_GOLDEN_BASELINE_CASES
} from './dashaReferenceCases';
import { MOON_ANCHOR_REFERENCE_CASES } from './moonAnchorReferenceCases';

/**
 * Task D08-B: Reference Provenance & Metadata Validation
 */
describe('D08-B: Reference Provenance & Metadata Validation', () => {
  describe('Authoritative Reference Cases Provenance Completeness', () => {
    it('ensures the authoritative reference set contains at least 9 distinct Mahadasha lord cases', () => {
      expect(DASHA_REFERENCE_CASES.length).toBeGreaterThanOrEqual(9);
    });

    for (const refCase of DASHA_REFERENCE_CASES) {
      describe(`Provenance for ${refCase.id}`, () => {
        it('has non-empty descriptive identification', () => {
          expect(refCase.id).toBeDefined();
          expect(refCase.id.trim().length).toBeGreaterThan(0);
          expect(refCase.description).toBeDefined();
          expect(refCase.description.trim().length).toBeGreaterThan(0);
        });

        it('has type MATHEMATICAL_ANALYTICAL and non-empty source block', () => {
          expect(refCase.source).toBeDefined();
          expect(typeof refCase.source).toBe('object');
          expect(refCase.source.type).toBe('MATHEMATICAL_ANALYTICAL');
          expect(refCase.source.name).toBeDefined();
          expect(refCase.source.name.trim().length).toBeGreaterThan(0);
          expect(refCase.source.methodology).toBeDefined();
          expect(refCase.source.methodology.trim().length).toBeGreaterThan(0);
          expect(refCase.source.zodiac).toBe('SIDEREAL');
          expect(refCase.source.ayanamsa).toBe('LAHIRI');
          expect(refCase.source.timezone).toBeDefined();
          expect(refCase.source.timezone.trim().length).toBeGreaterThan(0);
          expect(refCase.source.dateConvention).toBeDefined();
          expect(refCase.source.dateConvention.trim().length).toBeGreaterThan(0);
        });

        it('has non-empty conventions block matching repository standards', () => {
          expect(refCase.conventions).toBeDefined();
          expect(refCase.conventions.zodiac).toBe('SIDEREAL');
          expect(refCase.conventions.ayanamsa).toBe('LAHIRI');
          expect(refCase.conventions.timezone).toBeDefined();
          expect(refCase.conventions.yearLength).toBe(VIMSHOTTARI_YEAR_DAYS);
          expect(refCase.conventions.yearLength).toBe(365.25);
        });

        it('is not flagged as a circular golden/self-baseline snapshot', () => {
          expect(refCase.isGoldenSelfBaseline).not.toBe(true);
        });
      });
    }
  });

  describe('External Ephemeris Moon-Anchor Reference Cases Provenance', () => {
    it('ensures moon-anchor reference cases exist', () => {
      expect(MOON_ANCHOR_REFERENCE_CASES.length).toBeGreaterThanOrEqual(3);
    });

    for (const moonCase of MOON_ANCHOR_REFERENCE_CASES) {
      describe(`Provenance for ${moonCase.id}`, () => {
        it('has type EXTERNAL_EPHEMERIS and non-empty source block', () => {
          expect(moonCase.source).toBeDefined();
          expect(moonCase.source.type).toBe('EXTERNAL_EPHEMERIS');
          expect(moonCase.source.name).toBeDefined();
          expect(moonCase.source.name.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.methodology).toBeDefined();
          expect(moonCase.source.methodology.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.zodiac).toBe('SIDEREAL');
          expect(moonCase.source.ayanamsa).toBe('LAHIRI');
          expect(moonCase.source.timezone).toBeDefined();
          expect(moonCase.source.timezone.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.dateConvention).toBeDefined();
          expect(moonCase.source.dateConvention.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.version).toBeDefined();
          expect(moonCase.source.version!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.url).toBeDefined();
          expect(moonCase.source.url!.trim().length).toBeGreaterThan(0);
        });

        it('has explicit external ephemeris reproducibility metadata', () => {
          expect(moonCase.source.ephemerisBackend).toBeDefined();
          expect(moonCase.source.ephemerisBackend!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.ephemerisVersion).toBeDefined();
          expect(moonCase.source.ephemerisVersion!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.calculationFlags).toBeDefined();
          expect(moonCase.source.calculationFlags!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.outputFormat).toBeDefined();
          expect(moonCase.source.outputFormat!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.verifiedCommand).toBeDefined();
          expect(moonCase.source.verifiedCommand!.trim().length).toBeGreaterThan(0);
          expect(moonCase.source.verifiedCommand).toContain('swetest');
        });

        it('has valid birth coordinates and expected moon sidereal longitude', () => {
          expect(moonCase.birth.latitude).toBeDefined();
          expect(moonCase.birth.longitude).toBeDefined();
          expect(moonCase.birth.dateTimeStr).toBeDefined();
          expect(moonCase.expectedMoonSiderealLongitude).toBeGreaterThanOrEqual(0);
          expect(moonCase.expectedMoonSiderealLongitude).toBeLessThan(360);
        });
      });
    }
  });

  describe('Astronomical Reference Cases Provenance', () => {
    for (const astroCase of ASTRONOMY_REFERENCE_CASES) {
      it(`validates complete provenance for astronomy case ${astroCase.id}`, () => {
        expect(astroCase.source.type).toBe('MATHEMATICAL_ANALYTICAL');
        expect(astroCase.source.name).toBeDefined();
        expect(astroCase.source.methodology).toBeDefined();
        expect(astroCase.conventions.zodiac).toBe('SIDEREAL');
        expect(astroCase.conventions.ayanamsa).toBe('LAHIRI');
        expect(astroCase.conventions.yearLength).toBe(365.25);
      });
    }
  });

  describe('Golden Baseline Cases Isolation and Disclaimers', () => {
    it('ensures golden baseline cases are explicitly flagged with disclaimer and excluded from authoritative set', () => {
      expect(DASHA_GOLDEN_BASELINE_CASES.length).toBeGreaterThan(0);

      for (const goldenCase of DASHA_GOLDEN_BASELINE_CASES) {
        expect(goldenCase.isGoldenSelfBaseline).toBe(true);
        expect(goldenCase.disclaimer).toBeDefined();
        expect(goldenCase.disclaimer).toContain('NOT an externally validated ephemeris benchmark');

        // Confirm not in authoritative set
        const inAuthSet = DASHA_REFERENCE_CASES.some(c => c.id === goldenCase.id);
        expect(inAuthSet).toBe(false);
      }
    });
  });
});
