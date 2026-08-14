import { describe, it, expect } from 'vitest';
import { Planet } from '../../types';
import {
  calculateCheshtaAstronomy,
  EPOCH_MEAN_LONGITUDE,
  MERCURY_SHEEGHROCHCHA_BASE,
  VENUS_SHEEGHROCHCHA_BASE
} from './cheshtaAstronomy';

describe('cheshtaAstronomy', () => {
  it('shouldCalculateCheshtaAstronomyFor1900Epoch', () => {
    const epoch1900 = new Date('1900-01-01T00:00:00Z');
    const result = calculateCheshtaAstronomy(Planet.SUN, epoch1900);

    expect(result).toBeDefined();
    expect(typeof result.meanLongitude).toBe('number');
    expect(typeof result.sheeghrochha).toBe('number');
    expect(result.meanLongitude).toBeGreaterThanOrEqual(0);
    expect(result.meanLongitude).toBeLessThan(360);
    expect(result.sheeghrochha).toBeGreaterThanOrEqual(0);
    expect(result.sheeghrochha).toBeLessThan(360);
  });

  it('shouldCalculateSupportedPlanets', () => {
    const testDate = new Date('2023-06-15T12:00:00Z');
    const supportedPlanets = [
      Planet.SUN,
      Planet.MARS,
      Planet.MERCURY,
      Planet.JUPITER,
      Planet.VENUS,
      Planet.SATURN
    ];

    for (const planet of supportedPlanets) {
      const res = calculateCheshtaAstronomy(planet, testDate);
      expect(Number.isFinite(res.meanLongitude)).toBe(true);
      expect(Number.isFinite(res.sheeghrochha)).toBe(true);
      expect(res.meanLongitude).toBeGreaterThanOrEqual(0);
      expect(res.meanLongitude).toBeLessThan(360);
      expect(res.sheeghrochha).toBeGreaterThanOrEqual(0);
      expect(res.sheeghrochha).toBeLessThan(360);
    }
  });

  it('shouldRejectUnsupportedPlanets', () => {
    const testDate = new Date('2023-01-01T00:00:00Z');
    const unsupportedPlanets = [Planet.MOON, Planet.RAHU, Planet.KETU];

    for (const planet of unsupportedPlanets) {
      expect(() => calculateCheshtaAstronomy(planet, testDate)).toThrow(
        /Cheshta astronomy is not defined/
      );
    }
  });

  it('shouldMatchCanonical1900MeanLongitudeConstants', () => {
    const epoch1900 = new Date('1900-01-01T00:00:00Z');

    const sunRes = calculateCheshtaAstronomy(Planet.SUN, epoch1900);
    expect(sunRes.meanLongitude).toBeCloseTo(257.4568, 4);
    expect(sunRes.sheeghrochha).toBeCloseTo(257.4568, 4);
    expect(sunRes.meanLongitude).toBe(EPOCH_MEAN_LONGITUDE[Planet.SUN]);

    const marsRes = calculateCheshtaAstronomy(Planet.MARS, epoch1900);
    expect(marsRes.meanLongitude).toBeCloseTo(270.22, 4);
    expect(marsRes.sheeghrochha).toBeCloseTo(257.4568, 4);
    expect(marsRes.meanLongitude).toBe(EPOCH_MEAN_LONGITUDE[Planet.MARS]);

    const jupRes = calculateCheshtaAstronomy(Planet.JUPITER, epoch1900);
    expect(jupRes.meanLongitude).toBeCloseTo(220.04, 4);
    expect(jupRes.sheeghrochha).toBeCloseTo(257.4568, 4);
    expect(jupRes.meanLongitude).toBe(EPOCH_MEAN_LONGITUDE[Planet.JUPITER]);

    const satRes = calculateCheshtaAstronomy(Planet.SATURN, epoch1900);
    expect(satRes.meanLongitude).toBeCloseTo(236.74, 4);
    expect(satRes.sheeghrochha).toBeCloseTo(257.4568, 4);
    expect(satRes.meanLongitude).toBe(EPOCH_MEAN_LONGITUDE[Planet.SATURN]);

    const mercRes = calculateCheshtaAstronomy(Planet.MERCURY, epoch1900);
    expect(mercRes.meanLongitude).toBeCloseTo(257.4568, 4); // tied to Sun
    expect(mercRes.sheeghrochha).toBeCloseTo(MERCURY_SHEEGHROCHCHA_BASE, 4);

    const venRes = calculateCheshtaAstronomy(Planet.VENUS, epoch1900);
    expect(venRes.meanLongitude).toBeCloseTo(257.4568, 4); // tied to Sun
    expect(venRes.sheeghrochha).toBeCloseTo(VENUS_SHEEGHROCHCHA_BASE, 4);
  });

  it('shouldNormalizeDegreesBetween0And360', () => {
    const testDate = new Date('2023-06-15T12:00:00Z');
    const planets = [Planet.SUN, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN];

    for (const planet of planets) {
      const res = calculateCheshtaAstronomy(planet, testDate);
      expect(res.meanLongitude).toBeGreaterThanOrEqual(0);
      expect(res.meanLongitude).toBeLessThan(360);
      expect(res.sheeghrochha).toBeGreaterThanOrEqual(0);
      expect(res.sheeghrochha).toBeLessThan(360);
    }
  });

  it('shouldReturnFrozenObject', () => {
    const epoch1900 = new Date('1900-01-01T00:00:00Z');
    const res = calculateCheshtaAstronomy(Planet.MARS, epoch1900);
    expect(Object.isFrozen(res)).toBe(true);
  });

  it('shouldThrowOnInvalidBirthInstant', () => {
    expect(() => calculateCheshtaAstronomy(Planet.SUN, new Date('invalid'))).toThrow();
    // @ts-expect-error testing invalid argument
    expect(() => calculateCheshtaAstronomy(Planet.SUN, null)).toThrow();
  });
});
