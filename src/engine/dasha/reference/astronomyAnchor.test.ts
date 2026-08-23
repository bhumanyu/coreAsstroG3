import { describe, it, expect } from 'vitest';
import { generatePlanetaryPositions, calculateHoroscope } from '../../astroEngine';
import { Planet } from '../../../types';
import { ASTRONOMY_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-A: Independent Astronomy-Anchor Validation
 *
 * Validates the pipeline: `BirthDetails → CoreAstro astronomy → Moon sidereal longitude`.
 * This validates the astronomy generation stage that is decoupled from pure Dasha mathematical formulas.
 * Keeping this test suite separate ensures astronomy regressions are immediately distinguishable
 * from Dasha-engine regressions.
 */
describe('D08-A: Astronomy Anchor Validation (BirthDetails -> CoreAstro Astronomy -> Moon Sidereal Longitude)', () => {
  describe('Planetary Positions Astronomy Generation vs Reference Ephemeris', () => {
    for (const astroCase of ASTRONOMY_REFERENCE_CASES) {
      it(`validates ${astroCase.id}: Moon ecliptic longitude matches reference anchor`, () => {
        const positions = generatePlanetaryPositions(astroCase.birth);
        const moonPos = positions[Planet.MOON];

        expect(moonPos).toBeDefined();
        if (!moonPos) {
          throw new Error(`Planet.MOON position undefined for ${astroCase.id}`);
        }

        const actualMoonLongitude: number = moonPos.eclipticLongitude ?? moonPos.longitude;
        const astroTolerance: number = DASHA_REFERENCE_TOLERANCES.astronomyMoonLongitudeDegrees ?? 1e-4;

        expectCloseToReference(
          actualMoonLongitude,
          astroCase.expectedMoonLongitude,
          astroTolerance,
          `${astroCase.id} generatePlanetaryPositions Moon eclipticLongitude`
        );
      });
    }
  });

  describe('Full Horoscope Astronomy Integration to Vimshottari Timeline Anchor', () => {
    for (const astroCase of ASTRONOMY_REFERENCE_CASES) {
      it(`anchors horoscope.vimshottari Moon longitude to astronomy position for ${astroCase.id}`, () => {
        const fixedAsOf = '2024-06-01T00:00:00.000Z';
        const horoscope = calculateHoroscope(astroCase.birth, { asOf: fixedAsOf });

        expect(horoscope.vimshottari).toBeDefined();
        if (!horoscope.vimshottari) {
          throw new Error(`horoscope.vimshottari undefined for ${astroCase.id}`);
        }

        const positions = generatePlanetaryPositions(astroCase.birth);
        const moonPos = positions[Planet.MOON];
        if (!moonPos) {
          throw new Error(`Planet.MOON position undefined for ${astroCase.id}`);
        }

        const expectedMoonLongitude: number = moonPos.eclipticLongitude ?? moonPos.longitude;
        const moonTolerance: number = DASHA_REFERENCE_TOLERANCES.moonLongitudeDegrees ?? 1e-6;

        expectCloseToReference(
          horoscope.vimshottari.moonSiderealLongitude,
          expectedMoonLongitude,
          moonTolerance,
          `${astroCase.id} horoscope.vimshottari.moonSiderealLongitude vs generatePlanetaryPositions`
        );
      });
    }
  });
});
