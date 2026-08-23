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
 * SUITE D08-A1: External Ephemeris Moon Anchor (Skipped pending external Swiss Ephemeris integration)
 * SUITE D08-A2: Internal Moon Anchor Consistency (Engine-vs-Itself)
 */
describe('D08-A: Moon Sidereal Anchor Validation', () => {
  /**
   * D08-A1: External Ephemeris Moon Anchor.
   *
   * Skipped honestly because exact external Swiss Ephemeris / JPL Horizons ground-truth integration
   * is pending. Fabricating expected numbers from current engine output is strictly prohibited.
   */
  describe.skip('D08-A1 — External Ephemeris Moon Anchor', () => {
    // TODO: Pending external Swiss Ephemeris / JPL Horizons ground-truth integration.
    // Currently skipped to prevent false-green circular self-validation against analytical approximations.
    for (const refCase of MOON_ANCHOR_REFERENCE_CASES) {
      it(`validates ${refCase.id}: Moon sidereal longitude matches external ephemeris ground truth`, () => {
        // Enforce discriminator: ensure a mathematical fixture can never accidentally be used as external ground truth
        expect(refCase.source.type).toBe('EXTERNAL_EPHEMERIS');

        const fixedAsOf = '2024-06-01T00:00:00.000Z';
        const horoscope = calculateHoroscope(refCase.birth, { asOf: fixedAsOf });

        expect(horoscope.planetFacts).toBeDefined();
        const moonFact = horoscope.planetFacts[Planet.MOON];
        expect(moonFact).toBeDefined();
        if (!moonFact) {
          throw new Error(`planetFacts[Planet.MOON] undefined for ${refCase.id}`);
        }

        const actualMoonLongitude: number =
          moonFact.position.siderealLongitude ??
          moonFact.position.eclipticLongitude ??
          moonFact.position.longitude;
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
   * D08-A2: Internal Moon Anchor Consistency (Engine-vs-Itself).
   *
   * Validates internal pipeline consistency across CoreAstro subsystems:
   * `generatePlanetaryPositions` == `horoscope.planetFacts[Planet.MOON]` == `horoscope.vimshottari.moonSiderealLongitude`.
   *
   * ASTRONOMICAL CONVENTION NOTE:
   * `generatePlanetaryPositions` in `astroEngine.ts` calculates tropical planetary longitudes
   * and subtracts the Lahiri ayanamsa (`siderealLong = normalizeDegree(p1.long - ayanamsaShift)`),
   * assigning the resulting post-ayanamsa sidereal value to `siderealLongitude`, `eclipticLongitude`,
   * and `longitude`. The Moon longitude fed into Vimshottari is therefore explicitly SIDEREAL + LAHIRI.
   */
  describe('D08-A2 — Internal Moon Anchor Consistency (Engine-vs-Itself)', () => {
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

        // Read explicitly-sidereal fields
        const generatedSiderealLongitude =
          moonPos.siderealLongitude ?? moonPos.eclipticLongitude ?? moonPos.longitude;
        const factSiderealLongitude =
          moonFact.position.siderealLongitude ??
          moonFact.position.eclipticLongitude ??
          moonFact.position.longitude;
        const vimshottariMoonLongitude = horoscope.vimshottari!.moonSiderealLongitude;

        // Verify explicit sidereal accessor matches eclipticLongitude and longitude
        expect(moonPos.siderealLongitude).toBe(moonPos.eclipticLongitude);
        expect(moonFact.position.siderealLongitude).toBe(moonFact.position.eclipticLongitude);

        // Verify generated position matches fact position
        expect(factSiderealLongitude).toBe(generatedSiderealLongitude);

        // Verify vimshottari timeline anchor matches astronomy sidereal moon longitude
        expectCloseToReference(
          vimshottariMoonLongitude,
          generatedSiderealLongitude,
          DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees,
          `${refCase.id} horoscope.vimshottari.moonSiderealLongitude vs generated astronomy position`
        );
      });
    }
  });
});
