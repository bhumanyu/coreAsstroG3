import { normalizeDegree } from './nakshatraUtils';
import { AyanamsaType } from '../types';

/**
 * Normalizes an angle in degrees into [-180, 180).
 */
export function normalize180(deg: number): number {
  const norm = normalizeDegree(deg);
  return norm >= 180 ? norm - 360 : norm;
}

/**
 * Calculates Julian Day number for a given UTC Date.
 */
export function calculateJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + (hours - 12) / 24;
}

/**
 * Single parsing boundary for birth datetimes.
 * Rejects timezone-less strings and requires an explicit UTC ('Z') or explicit timezone offset.
 */
export function parseUtcDate(dateTimeStr: string): Date {
  if (!dateTimeStr || typeof dateTimeStr !== 'string') {
    throw new TypeError('dateTimeStr must be a non-empty string');
  }

  // Accept explicit Z or explicit offset only
  const explicitOffsetOrZ = /([+-]\d{2}:\d{2}|Z)$/i;
  if (!explicitOffsetOrZ.test(dateTimeStr)) {
    throw new Error('Birth datetime must include an explicit timezone offset or Z.');
  }

  const d = new Date(dateTimeStr);
  if (Number.isNaN(d.getTime())) {
    throw new TypeError('Invalid ISO datetime string with explicit timezone.');
  }
  return d;
}

/**
 * Gets ayanamsa offset in degrees relative to Lahiri baseline.
 */
export function getAyanamsaOffset(ayanamsa: AyanamsaType, date?: Date): number {
  let lahiri = 23.85305; // J2000 baseline
  if (date) {
    const jd = calculateJulianDay(date);
    const t = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
    lahiri = 23.85305 + 1.396967 * t;
  }

  switch (ayanamsa) {
    case AyanamsaType.LAHIRI: return lahiri;
    case AyanamsaType.RAMAN: return lahiri - 1.25;
    case AyanamsaType.KRISHNAMURTI: return lahiri + 0.10;
    case AyanamsaType.FAGAN_BRADLEY: return lahiri + 0.90;
    case AyanamsaType.TROPICAL: return 0.0;
    default: return lahiri;
  }
}

/**
 * Calculates Sun's tropical ecliptic longitude for a given Julian Day.
 */
export function getSunTropicalLongitude(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const mSun = normalizeDegree(357.5291 + 35999.0503 * t);
  const cSun = (1.9146 - 0.0048 * t) * Math.sin(toRad(mSun)) + (0.01999 - 0.0001 * t) * Math.sin(toRad(2 * mSun)) + 0.00029 * Math.sin(toRad(3 * mSun));
  return normalizeDegree(280.46646 + 36000.76983 * t + cSun);
}

/**
 * Calculates mean obliquity of the ecliptic in degrees for Julian centuries t.
 */
export function getObliquity(t: number): number {
  return 23.4392911 - 0.0130042 * t;
}

/**
 * Calculates declination given tropical longitude, ecliptic latitude, and obliquity in degrees.
 * Uses sin(dec) = sin(beta)cos(eps) + cos(beta)sin(eps)sin(lambda).
 */
export function calculateDeclination(
  tropicalLongitudeDeg: number,
  eclipticLatitudeDeg: number,
  obliquityDeg: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const beta = toRad(eclipticLatitudeDeg);
  const eps = toRad(obliquityDeg);
  const lambda = toRad(tropicalLongitudeDeg);

  const sinDec = Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda);
  const clampedSinDec = Math.max(-1, Math.min(1, sinDec));
  return toDeg(Math.asin(clampedSinDec));
}

export interface SolarTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  solarMidnight: Date;
}

/**
 * Computes Local Hour Angle (LHA) of Sun and declination at a specific timestamp.
 */
function getSunLHA(timeMs: number, latitude: number, longitude: number): { LHA: number; dec: number } {
  const d = new Date(timeMs);
  const jd = calculateJulianDay(d);
  const t = (jd - 2451545.0) / 36525.0;
  const sunLong = getSunTropicalLongitude(jd);
  const obliq = getObliquity(t);
  const dec = calculateDeclination(sunLong, 0, obliq);

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const gmst = normalizeDegree(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t);
  const sinRA = Math.cos(toRad(obliq)) * Math.sin(toRad(sunLong));
  const cosRA = Math.cos(toRad(sunLong));
  const ra = normalizeDegree(toDeg(Math.atan2(sinRA, cosRA)));
  const gha = normalizeDegree(gmst - ra);
  const lha = normalizeDegree(gha + longitude);

  return { LHA: lha, dec };
}

/**
 * Solves for the timestamp where Sun's Local Hour Angle matches targetLhaDeg.
 */
function solveForLHA(targetLhaDeg: number, initialMs: number, latitude: number, longitude: number): number {
  let currentMs = initialMs;
  for (let i = 0; i < 4; i++) {
    const { LHA } = getSunLHA(currentMs, latitude, longitude);
    const diff = normalize180(targetLhaDeg - LHA);
    currentMs += (diff / 360) * 24 * 3600 * 1000;
  }
  return currentMs;
}

/**
 * Extracts timezone offset in minutes from an ISO string with explicit timezone (+HH:MM or Z).
 */
export function getTimezoneOffsetMinutes(dateTimeStr: string): number {
  if (dateTimeStr.endsWith('Z') || dateTimeStr.endsWith('z')) {
    return 0;
  }
  const match = dateTimeStr.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

export interface LocalCivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * Calculates sunrise, sunset, solar noon, and solar midnight for a given location and local civil date.
 * Returns null for polar day/night where the Sun never rises or sets.
 */
export function calculateSunriseSunsetForLocalDate(
  latitude: number,
  longitude: number,
  localDate: LocalCivilDate
): SolarTimes | null {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  // Approximate noon in UTC
  const dateNoonUtcMs = Date.UTC(
    localDate.year,
    localDate.month - 1,
    localDate.day,
    12, 0, 0
  ) - (longitude / 15) * 3600 * 1000;

  const noonMs = solveForLHA(0, dateNoonUtcMs, latitude, longitude);
  const { dec } = getSunLHA(noonMs, latitude, longitude);

  const latRad = toRad(latitude);
  const decRad = toRad(dec);

  const cosH0 = (Math.sin(toRad(-0.833)) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  if (cosH0 > 1 || cosH0 < -1) {
    return null; // Polar night or polar day
  }

  const h0 = toDeg(Math.acos(cosH0));

  const sunriseMs = solveForLHA(360 - h0, noonMs - (h0 / 15) * 3600 * 1000, latitude, longitude);
  const sunsetMs = solveForLHA(h0, noonMs + (h0 / 15) * 3600 * 1000, latitude, longitude);
  const midnightMs = solveForLHA(180, noonMs + 12 * 3600 * 1000, latitude, longitude);

  return {
    sunrise: new Date(sunriseMs),
    sunset: new Date(sunsetMs),
    solarNoon: new Date(noonMs),
    solarMidnight: new Date(midnightMs)
  };
}

/**
 * Calculates sunrise, sunset, solar noon, and solar midnight for a given location and UTC calendar date.
 * Note: This function computes solar events for the UTC calendar date of the input instant
 * and is NOT the API for local-civil-date calculations (use calculateSunriseSunsetForLocalDate for that).
 * Returns null for polar day/night where the Sun never rises or sets.
 */
export function calculateSunriseSunset(latitude: number, longitude: number, utcDate: Date): SolarTimes | null {
  const localDate: LocalCivilDate = {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate()
  };
  return calculateSunriseSunsetForLocalDate(latitude, longitude, localDate);
}

export interface SolarDayDetails {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  solarMidnight: Date;
  nextSunrise: Date;
  isDaytime: boolean;
}

function stepLocalDate(localDate: LocalCivilDate, days: number): LocalCivilDate {
  const d = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + days, 12, 0, 0));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

/**
 * Resolves the active solar day (sunrise to next sunrise) containing birthInstant.
 * Uses local civil date derived from birthInstant + timezoneOffsetMinutes.
 * Returns null in polar conditions.
 */
export function getSolarDayDetails(
  latitude: number,
  longitude: number,
  birthInstant: Date,
  timezoneOffsetMinutes: number
): SolarDayDetails | null {
  const localMs = birthInstant.getTime() + timezoneOffsetMinutes * 60000;
  const localDateObj = new Date(localMs);
  const currentLocalDate: LocalCivilDate = {
    year: localDateObj.getUTCFullYear(),
    month: localDateObj.getUTCMonth() + 1,
    day: localDateObj.getUTCDate()
  };

  const curr = calculateSunriseSunsetForLocalDate(latitude, longitude, currentLocalDate);
  if (!curr) return null;

  const t = birthInstant.getTime();
  if (t < curr.sunrise.getTime()) {
    // Before today's sunrise -> belongs to solar day of previous civil date
    const prevLocalDate = stepLocalDate(currentLocalDate, -1);
    const prev = calculateSunriseSunsetForLocalDate(latitude, longitude, prevLocalDate);
    if (!prev) return null;

    return {
      sunrise: prev.sunrise,
      sunset: prev.sunset,
      solarNoon: prev.solarNoon,
      solarMidnight: prev.solarMidnight,
      nextSunrise: curr.sunrise,
      isDaytime: false
    };
  }

  const nextLocalDate = stepLocalDate(currentLocalDate, 1);
  const next = calculateSunriseSunsetForLocalDate(latitude, longitude, nextLocalDate);
  if (!next) return null;

  if (t >= curr.sunrise.getTime() && t < curr.sunset.getTime()) {
    return {
      sunrise: curr.sunrise,
      sunset: curr.sunset,
      solarNoon: curr.solarNoon,
      solarMidnight: curr.solarMidnight,
      nextSunrise: next.sunrise,
      isDaytime: true
    };
  }

  // After sunset
  return {
    sunrise: curr.sunrise,
    sunset: curr.sunset,
    solarNoon: curr.solarNoon,
    solarMidnight: curr.solarMidnight,
    nextSunrise: next.sunrise,
    isDaytime: false
  };
}

/**
 * Gets Sun's sidereal longitude at a given Date.
 */
export function getSunSiderealLongitude(date: Date, ayanamsa: AyanamsaType): number {
  const jd = calculateJulianDay(date);
  const trop = getSunTropicalLongitude(jd);
  const offset = getAyanamsaOffset(ayanamsa, date);
  return normalizeDegree(trop - offset);
}

/**
 * Finds the most recent instant <= birthInstant when the Sun crossed targetSiderealLongitudeDeg.
 * Explicitly brackets the crossing before binary searching down to <= 1 second precision.
 */
export function findPreviousSolarIngress(
  targetSiderealLongitudeDeg: number,
  birthInstant: Date,
  ayanamsa: AyanamsaType
): Date {
  const birthMs = birthInstant.getTime();
  const DAY_MS = 86400 * 1000;

  const isBeforeTarget = (ms: number): boolean => {
    const sunLong = getSunSiderealLongitude(new Date(ms), ayanamsa);
    const diff = normalizeDegree(sunLong - targetSiderealLongitudeDeg);
    return diff >= 180;
  };

  let high = birthMs;
  let iterations = 0;
  const MAX_ITERATIONS = 370;

  // Step 1: If birthInstant is before target in the current cycle, step high backward.
  while (isBeforeTarget(high)) {
    high -= DAY_MS;
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      throw new Error(`Failed to bracket solar ingress for target ${targetSiderealLongitudeDeg}° within ${MAX_ITERATIONS} days.`);
    }
  }

  // Step 2: Step low backward from high until low is before target.
  let low = high - DAY_MS;
  while (!isBeforeTarget(low)) {
    high = low;
    low = high - DAY_MS;
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      throw new Error(`Failed to bracket solar ingress for target ${targetSiderealLongitudeDeg}° within ${MAX_ITERATIONS} days.`);
    }
  }

  // Binary search [low, high]
  while (high - low > 1000) {
    const mid = Math.floor((low + high) / 2);
    if (isBeforeTarget(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}
