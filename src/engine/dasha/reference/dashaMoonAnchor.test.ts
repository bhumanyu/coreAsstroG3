import { describe, it, expect } from 'vitest';
import { calculateHoroscope, generatePlanetaryPositions } from '../../astroEngine';
import { Planet } from '../../../types';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { MOON_ANCHOR_REFERENCE_CASES } from './moonAnchorReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-A: Independent Moon Sidereal Anchor Validation
 *
 * Validates the pipeline: `BirthDetails → CoreAstro astronomy → Moon sidereal longitude`.
 *
 * SECTION 1: External Ephemeris Benchmark (Skipped pending external Swiss Ephemeris integration)
 * SECTION 2: Engine Internal Consistency Invariant (Engine-vs-Itself)
 */
describe('D08-A: Moon Sidereal Anchor Validation', () => {
  /**
   * External Ephemeris Ground-Truth Comparison.
   *
   * Skipped honestly because exact external Swiss Ephemeris / JPL Horizons ground-truth integration
   * is pending. Fabricating expected numbers from current engine output is strictly prohibited.
   */
  describe.skip('D08-A: Independent Moon Sidereal Anchor (External Ephemeris Ground-Truth Comparison)', () => {
    // TODO: Pending external Swiss Ephemeris / JPL Horizons ground-truth integration.
    // Currently skipped to prevent false-green circular self-validation against analytical approximations.
    for (const refCase of MOON_ANCHOR_REFERENCE_CASES) {
      it(`validates ${refCase.id}: Moon sidereal longitude matches external ephemeris ground truth`, () => {
        const fixedAsOf = '2024-06-01T00:00:00.000Z';
        const horoscope = calculateHoroscope(refCase.birth, { asOf: fixedAsOf });

        expect(horoscope.planetFacts).toBeDefined();
        const moonFact = horoscope.planetFacts[Planet.MOON];
        expect(moonFact).toBeDefined();
        if (!moonFact) {
          throw new Error(`planetFacts[Planet.MOON] undefined for ${refCase.id}`);
        }

        const actualMoonLongitude: number = moonFact.position.eclipticLongitude ?? moonFact.position.longitude;
        const tolerance: number = DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees;

        expectCloseToReference(
          actualMoonLongitude,
          refCase.expectedMoonSiderealLongitude,
          tolerance,
          `${refCase.id} Moon sidereal longitude vs external ephemeris`
        );
      });
    }
  });

  /**
   * Engine Invariant: Moon Sidereal Longitude Consistency (Engine-vs-Itself).
   *
   * Validates internal pipeline consistency across CoreAstro subsystems:
   * `generatePlanetaryPositions` == `horoscope.planetFacts[Planet.MOON]` == `horoscope.vimshottari.moonSiderealLongitude`.
   */
  describe('Engine Invariant: Moon Sidereal Longitude Consistency (Engine-vs-Itself)', () => {
    for (const refCase of DASHA_REFERENCE_CASES) {
      it(`verifies internal consistency of Moon longitude across horoscope subsystems for ${refCase.id}`, () => {
        const fixedAsOf = '2024-06-01T00:00:00.000Z';
        const horoscope = calculateHoroscope(refCase.birth, { asOf: fixedAsOf });

        expect(horoscope.vimshottari).toBeDefined();
        expect(horoscope.planetFacts).toBeDefined();

        const moonFact = horoscope.planetFacts[Planet.MOON];
        expect(moonFact).toBeDefined();
        if (!moonFact) {
          throw new Error(`planetFacts[Planet.MOON] undefined for ${refCase.id}`);
        }

        const positions = generatePlanetaryPositions(refCase.birth);
        const moonPos = positions[Planet.MOON];
        expect(moonPos).toBeDefined();
        if (!moonPos) {
          throw new Error(`generatePlanetaryPositions Planet.MOON undefined for ${refCase.id}`);
        }

        const generatedLongitude = moonPos.eclipticLongitude ?? moonPos.longitude;
        const factLongitude = moonFact.position.eclipticLongitude ?? moonFact.position.longitude;
        const vimshottariMoonLongitude = horoscope.vimshottari!.moonSiderealLongitude;

        // Verify generated position matches fact position
        expect(factLongitude).toBe(generatedLongitude);

        // Verify vimshottari timeline anchor matches astronomy moon longitude
        expectCloseToReference(
          vimshottariMoonLongitude,
          generatedLongitude,
          DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees,
          `${refCase.id} horoscope.vimshottari.moonSiderealLongitude vs generated astronomy position`
        );
      });
    }
  });
});
