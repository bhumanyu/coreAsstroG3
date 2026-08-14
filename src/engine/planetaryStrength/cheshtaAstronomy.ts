import { Planet } from '../../types';
import { normalizeDegree } from '../nakshatraUtils';

/**
 * Astronomical mean longitude and sheeghrochcha (fast apex / apex of speed)
 * for Cheshta Bala calculations in Vedic astrology using a single canonical
 * sidereal 1900.0 epoch reference frame.
 *
 * Canonical Methodology & Decisions:
 * 1. Single Sidereal Reference Frame:
 *    All epoch base values are defined directly in the sidereal reference frame at
 *    1900-01-01T00:00:00 UTC (Julian Day = 2415020.5). Longitudes advance linearly
 *    using mean daily sidereal motion rates:
 *      siderealMean = normalizeDegree(base + rate * elapsedDays)
 *    This eliminates the legacy hybrid model that computed tropical longitudes and
 *    subtracted Lahiri ayanamsa.
 *
 * 2. Exterior Planets (Mars, Jupiter, Saturn) & Sun:
 *    - Mean Longitude: Planet's own sidereal mean longitude.
 *    - Sheeghrochcha (Fast Apex): Sun's sidereal mean longitude.
 *
 * 3. Interior Planets (Mercury, Venus):
 *    - Mean Longitude: Tied directly to the Sun's sidereal mean longitude
 *      (meanLongitude = sunSiderealMean).
 *    - Sheeghrochcha (Fast Apex): Calculated using a consistent linear daily rate
 *      formula without mixed secular-t polynomial terms:
 *        Mercury Sheeghrochcha = normalizeDegree(164.0 + 4.09233443 * elapsedDays)
 *        Venus Sheeghrochcha = normalizeDegree(328.51 + 1.60213047 * elapsedDays)
 *
 * 4. Supported Planets:
 *    - Supported: SUN, MARS, MERCURY, JUPITER, VENUS, SATURN.
 *    - Unsupported: MOON (uses Paksha Bala for Cheshta), RAHU, KETU (nodes have no Cheshta Bala).
 *      Passing MOON, RAHU, or KETU throws an explicit Error.
 */
export interface CheshtaAstronomy {
  readonly meanLongitude: number;
  readonly sheeghrochha: number;
}

export const EPOCH_1900_UTC_MS = Date.UTC(1900, 0, 1, 0, 0, 0);

export const EPOCH_MEAN_LONGITUDE: Readonly<Record<Planet.SUN | Planet.MARS | Planet.JUPITER | Planet.SATURN, number>> = Object.freeze({
  [Planet.SUN]: 257.4568,
  [Planet.MARS]: 270.22,
  [Planet.JUPITER]: 220.04,
  [Planet.SATURN]: 236.74,
});

export const MEAN_LONGITUDE_RATES: Readonly<Record<Planet.SUN | Planet.MARS | Planet.JUPITER | Planet.SATURN, number>> = Object.freeze({
  [Planet.SUN]: 0.98564736,
  [Planet.MARS]: 0.52403295,
  [Planet.JUPITER]: 0.08309121,
  [Planet.SATURN]: 0.03345973,
});

export const MERCURY_SHEEGHROCHCHA_BASE = 164.0;
export const MERCURY_SHEEGHROCHCHA_RATE = 4.09233443;

export const VENUS_SHEEGHROCHCHA_BASE = 328.51;
export const VENUS_SHEEGHROCHCHA_RATE = 1.60213047;

/**
 * Calculates mean longitude and sheeghrochcha for a planet at a given UTC birth instant
 * directly in the canonical sidereal frame.
 */
export function calculateCheshtaAstronomy(
  planet: Planet,
  birthInstant: Date
): CheshtaAstronomy {
  if (!birthInstant || !(birthInstant instanceof Date) || Number.isNaN(birthInstant.getTime())) {
    throw new TypeError('birthInstant must be a valid Date object.');
  }

  if (planet === Planet.MOON || planet === Planet.RAHU || planet === Planet.KETU) {
    throw new Error(`Cheshta astronomy is not defined for ${planet}`);
  }

  const elapsedDays = (birthInstant.getTime() - EPOCH_1900_UTC_MS) / 86400000;

  // Sun's sidereal mean longitude (serves as base for Sun, sheeghrochcha for exterior planets, and mean for interior planets)
  const sunSiderealMean = normalizeDegree(
    EPOCH_MEAN_LONGITUDE[Planet.SUN] + MEAN_LONGITUDE_RATES[Planet.SUN] * elapsedDays
  );

  let siderealMean = 0;
  let siderealSheegh = 0;

  switch (planet) {
    case Planet.SUN:
      siderealMean = sunSiderealMean;
      siderealSheegh = sunSiderealMean;
      break;
    case Planet.MARS:
      siderealMean = normalizeDegree(
        EPOCH_MEAN_LONGITUDE[Planet.MARS] + MEAN_LONGITUDE_RATES[Planet.MARS] * elapsedDays
      );
      siderealSheegh = sunSiderealMean;
      break;
    case Planet.JUPITER:
      siderealMean = normalizeDegree(
        EPOCH_MEAN_LONGITUDE[Planet.JUPITER] + MEAN_LONGITUDE_RATES[Planet.JUPITER] * elapsedDays
      );
      siderealSheegh = sunSiderealMean;
      break;
    case Planet.SATURN:
      siderealMean = normalizeDegree(
        EPOCH_MEAN_LONGITUDE[Planet.SATURN] + MEAN_LONGITUDE_RATES[Planet.SATURN] * elapsedDays
      );
      siderealSheegh = sunSiderealMean;
      break;
    case Planet.MERCURY:
      siderealMean = sunSiderealMean;
      siderealSheegh = normalizeDegree(
        MERCURY_SHEEGHROCHCHA_BASE + MERCURY_SHEEGHROCHCHA_RATE * elapsedDays
      );
      break;
    case Planet.VENUS:
      siderealMean = sunSiderealMean;
      siderealSheegh = normalizeDegree(
        VENUS_SHEEGHROCHCHA_BASE + VENUS_SHEEGHROCHCHA_RATE * elapsedDays
      );
      break;
    default:
      throw new Error(`Cheshta astronomy is not defined for ${planet}`);
  }

  return Object.freeze({
    meanLongitude: siderealMean,
    sheeghrochha: siderealSheegh
  });
}
