import { describe, expect, it } from 'vitest';
import {
  angularDistance,
  compareAngle,
  normalizeDegrees,
  signedAngularDifferenceDegrees
} from './angularComparison';
import {
  CALCULATION_REFERENCE_FIXTURES,
  RG_09_CALCULATION_REFERENCE_GATE
} from './calculationReferenceFixtures';
import { calculateNakshatra } from '../nakshatraUtils';
import { calculateSign, calculateWholeSignHouse, getDivisionalLongitude } from '../chartMath';
import { generatePlanetaryPositions } from '../astroEngine';
import { calculateVimshottari, VIMSHOTTARI_YEAR_DAYS } from '../dasha/vimshottari';
import { Planet } from '../../types';

describe('RG-09 calculation reference validation', () => {
  it('requires approved independent fixtures before RG-09 can pass', () => {
    expect(CALCULATION_REFERENCE_FIXTURES.length).toBeGreaterThan(0);
  });

  describe('angular comparison helpers', () => {
    it('normalizes positive and negative angles into [0, 360)', () => {
      expect(normalizeDegrees(370)).toBe(10);
      expect(normalizeDegrees(-30)).toBe(330);
      expect(normalizeDegrees(720)).toBe(0);
    });

    it('uses the shortest signed difference across the 0/360 boundary', () => {
      expect(signedAngularDifferenceDegrees(1, 359)).toBe(2);
      expect(signedAngularDifferenceDegrees(359, 1)).toBe(-2);
      expect(angularDistance(1, 359)).toBe(2);
    });

    it('compares circular distances inclusively against tolerance', () => {
      expect(compareAngle(0.1, 359.9, 0.2)).toBe(true);
      expect(compareAngle(0.1, 359.9, 0.19)).toBe(false);
    });

    it('rejects non-finite angles and invalid tolerances', () => {
      expect(() => normalizeDegrees(Number.NaN)).toThrow(RangeError);
      expect(() => angularDistance(Number.POSITIVE_INFINITY, 0)).toThrow(RangeError);
      expect(() => compareAngle(0, 0, -0.1)).toThrow(RangeError);
    });
  });

  for (const fixture of CALCULATION_REFERENCE_FIXTURES) {
    it(`validates approved reference ${fixture.id} through ${fixture.entryPoint}`, () => {
      expect(fixture.provenance.independentlyProduced).toBe(true);
      expect(fixture.provenance.sourceName.trim()).not.toBe('');
      expect(fixture.provenance.citation.trim()).not.toBe('');
      expect(fixture.provenance.sourceVersion.trim()).not.toBe('');
      expect(fixture.provenance.methodology.trim()).not.toBe('');
      expect(fixture.provenance.retrievedAt.trim()).not.toBe('');
      expect(fixture.provenance.approvedBy.trim()).not.toBe('');
      expect(fixture.provenance.approvedAt.trim()).not.toBe('');

      switch (fixture.kind) {
        case 'PLANETARY_LONGITUDE': {
          expect(fixture.conventions.coordinateFrame).toBe('SIDEREAL');
          expect(fixture.conventions.ayanamsa).toBe(fixture.input.birth.ayanamsa);
          const actual = generatePlanetaryPositions(fixture.input.birth)[fixture.input.planet];
          expect(actual.siderealLongitude).toBeDefined();
          expect(compareAngle(
            actual.siderealLongitude!,
            fixture.expected.degrees,
            fixture.expected.toleranceDegrees
          )).toBe(true);
          break;
        }
        case 'PLANETARY_MOTION': {
          expect(fixture.conventions.coordinateFrame).toBe('SIDEREAL');
          expect(fixture.conventions.ayanamsa).toBe(fixture.input.birth.ayanamsa);
          if (fixture.scenario === 'PROGRADE') {
            expect(fixture.expected.speedDegreesPerDay).toBeGreaterThan(0);
            expect(fixture.expected.retrograde).toBe(false);
            expect(fixture.expected.stationary).toBe(false);
          } else if (fixture.scenario === 'RETROGRADE') {
            expect(fixture.expected.speedDegreesPerDay).toBeLessThan(0);
            expect(fixture.expected.retrograde).toBe(true);
            expect(fixture.expected.stationary).toBe(false);
          } else {
            expect(Math.abs(fixture.expected.speedDegreesPerDay)).toBeLessThan(0.005);
            expect(fixture.expected.stationary).toBe(true);
          }
          const actual = generatePlanetaryPositions(fixture.input.birth)[fixture.input.planet];
          if (fixture.scenario === 'PROGRADE') {
            expect(actual.motion.speed).toBeGreaterThan(0);
          } else if (fixture.scenario === 'RETROGRADE') {
            expect(actual.motion.speed).toBeLessThan(0);
          } else {
            expect(Math.abs(actual.motion.speed)).toBeLessThan(0.005);
          }
          expect(Math.abs(actual.motion.speed - fixture.expected.speedDegreesPerDay))
            .toBeLessThanOrEqual(fixture.expected.speedToleranceDegreesPerDay);
          expect(actual.motion.retrograde).toBe(fixture.expected.retrograde);
          expect(actual.motion.stationary).toBe(fixture.expected.stationary);
          break;
        }
        case 'RAHU_KETU_OPPOSITION': {
          expect(fixture.conventions.coordinateFrame).toBe('SIDEREAL');
          expect(fixture.conventions.ayanamsa).toBe(fixture.input.birth.ayanamsa);
          const positions = generatePlanetaryPositions(fixture.input.birth);
          expect(positions[Planet.RAHU].siderealLongitude).toBeDefined();
          expect(positions[Planet.KETU].siderealLongitude).toBeDefined();
          const actualSeparation = angularDistance(
            positions[Planet.RAHU].siderealLongitude!,
            positions[Planet.KETU].siderealLongitude!
          );
          expect(fixture.expected.degrees).toBe(180);
          expect(Math.abs(actualSeparation - fixture.expected.degrees))
            .toBeLessThanOrEqual(fixture.expected.toleranceDegrees);
          break;
        }
        case 'SIGN_BOUNDARY':
          expect(calculateSign(fixture.input.longitude)).toBe(fixture.expectedSign);
          break;
        case 'NAKSHATRA_BOUNDARY': {
          const actual = calculateNakshatra(fixture.input.longitude);
          expect(actual.nakshatra).toBe(fixture.expectedNakshatra);
          expect(actual.pada).toBe(fixture.expectedPada);
          break;
        }
        case 'HOUSE_POSITION':
          expect(calculateWholeSignHouse(
            fixture.input.referenceSign,
            fixture.input.targetSign
          )).toBe(fixture.expectedHouse);
          break;
        case 'VARGA_LONGITUDE':
          expect(compareAngle(
            getDivisionalLongitude(fixture.input.longitude, fixture.input.chartType),
            fixture.expected.degrees,
            fixture.expected.toleranceDegrees
          )).toBe(true);
          break;
        case 'VIMSHOTTARI_DASHA': {
          expect(fixture.conventions.coordinateFrame).toBe('SIDEREAL');
          expect(fixture.conventions.yearLengthDays).toBe(VIMSHOTTARI_YEAR_DAYS);
          const timeline = calculateVimshottari(fixture.input);
          const firstMahadasha = timeline.mahadashas[0];
          expect(firstMahadasha).toBeDefined();
          expect(timeline.nakshatra).toBe(fixture.expected.nakshatra);
          expect(timeline.nakshatraLord).toBe(fixture.expected.nakshatraLord);
          expect(Math.abs(timeline.nakshatraProgress - fixture.expected.nakshatraProgress))
            .toBeLessThanOrEqual(fixture.tolerance.fraction);
          expect(Math.abs(timeline.remainingFraction - fixture.expected.remainingFraction))
            .toBeLessThanOrEqual(fixture.tolerance.fraction);
          expect(firstMahadasha!.planet).toBe(fixture.expected.firstMahadashaLord);
          expect(Math.abs(
            new Date(firstMahadasha!.start).getTime()
            - new Date(fixture.expected.firstMahadashaStart).getTime()
          )).toBeLessThanOrEqual(fixture.tolerance.boundaryMilliseconds);
          expect(Math.abs(
            new Date(firstMahadasha!.end).getTime()
            - new Date(fixture.expected.firstMahadashaEnd).getTime()
          )).toBeLessThanOrEqual(fixture.tolerance.boundaryMilliseconds);
          break;
        }
      }

    });
  }

  it('marks RG-09 ready only when fixtures and required coverage are complete', () => {
    const expectedStatus =
      CALCULATION_REFERENCE_FIXTURES.length > 0
      && RG_09_CALCULATION_REFERENCE_GATE.coverageComplete
        ? 'READY'
        : 'BLOCKED';
    expect(RG_09_CALCULATION_REFERENCE_GATE.fixtureCount)
      .toBe(CALCULATION_REFERENCE_FIXTURES.length);
    expect(RG_09_CALCULATION_REFERENCE_GATE.status).toBe(expectedStatus);
    expect(RG_09_CALCULATION_REFERENCE_GATE.status === 'READY').toBe(
      RG_09_CALCULATION_REFERENCE_GATE.fixtureCount > 0
      && RG_09_CALCULATION_REFERENCE_GATE.coverageComplete
    );
  });
});
