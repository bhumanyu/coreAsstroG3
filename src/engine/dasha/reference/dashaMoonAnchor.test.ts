import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { Planet } from '../../../types';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-D: Moon / Nakshatra Ephemeris Validation
 *
 * NOTE ON EPHEMERIS BENCHMARKS:
 * As documented in `src/test/fixtures/canonicalChart.ts`, this repository currently does not
 * include externally benchmarked Swiss Ephemeris / NASA JPL Horizons Moon positions.
 * The synthetic cases in `DASHA_REFERENCE_CASES` are analytical reference benchmarks for Dasha math
 * (which drive `calculateVimshottari` directly with `expectedMoonLongitude`).
 *
 * Per the D08-D specification, external astronomical ephemeris comparison tests against
 * unverified planetary positions are marked as skipped/TODO to prevent fabricating
 * expected ephemeris longitudes from current engine output.
 */
describe('D08-D: Moon / Nakshatra Ephemeris Validation (Reference vs Horoscope)', () => {
  describe.skip('External Ephemeris Benchmark Comparison (Pending External Ephemeris Ground Truth)', () => {
    for (const refCase of DASHA_REFERENCE_CASES) {
      it(`[TODO/SKIPPED] ${refCase.id}: Moon sidereal longitude matches external ephemeris benchmark`, () => {
        const horoscope = calculateHoroscope(refCase.birth, { asOf: '2024-06-01T00:00:00.000Z' });
        expect(horoscope.vimshottari).toBeDefined();

        expectCloseToReference(
          horoscope.vimshottari.moonSiderealLongitude,
          refCase.expectedMoonLongitude,
          DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees,
          `${refCase.id} moonSiderealLongitude`
        );
        expect(horoscope.vimshottari.nakshatra).toBe(refCase.expectedNakshatra);
        expect(horoscope.vimshottari.nakshatraLord).toBe(refCase.expectedNakshatraLord);
      });
    }
  });

  describe('Engine Internal Consistency: Horoscope Moon -> Vimshottari Timeline Anchor', () => {
    it('anchors horoscope.vimshottari exactly to the calculated Moon ecliptic longitude', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: '2024-06-01T00:00:00.000Z' });
      expect(horoscope.vimshottari).toBeDefined();

      const moonFact = horoscope.planetFacts[Planet.MOON];
      expect(moonFact).toBeDefined();

      const expectedMoonLong =
        moonFact.position?.eclipticLongitude ??
        moonFact.position?.longitude ??
        (moonFact as any).longitude;

      expect(typeof expectedMoonLong).toBe('number');

      expectCloseToReference(
        horoscope.vimshottari.moonSiderealLongitude,
        expectedMoonLong,
        DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees,
        'horoscope.vimshottari.moonSiderealLongitude vs planetFacts Moon longitude'
      );
    });
  });
});
