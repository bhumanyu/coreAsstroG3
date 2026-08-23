import { describe, it, expect } from 'vitest';
import { VIMSHOTTARI_YEAR_DAYS } from '../vimshottari';
import {
  DASHA_REFERENCE_CASES,
  ASTRONOMY_REFERENCE_CASES,
  DASHA_GOLDEN_BASELINE_CASES
} from './dashaReferenceCases';

/**
 * Task D08-B: Reference Provenance & Conventions Validation
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

        it('has non-empty source block with name, methodology, zodiac, ayanamsa, timezone, and dateConvention', () => {
          expect(refCase.source).toBeDefined();
          expect(typeof refCase.source).toBe('object');
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

  describe('Astronomical Reference Cases Provenance', () => {
    for (const astroCase of ASTRONOMY_REFERENCE_CASES) {
      it(`validates complete provenance for astronomy case ${astroCase.id}`, () => {
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
