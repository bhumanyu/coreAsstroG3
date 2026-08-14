import { describe, it, expect } from 'vitest';
import {
  calculateJulianDay,
  parseUtcDate,
  getSunTropicalLongitude,
  getObliquity,
  calculateDeclination,
  calculateSunriseSunset,
  calculateSunriseSunsetForLocalDate,
  getSolarDayDetails,
  getTimezoneOffsetMinutes,
  getSunSiderealLongitude,
  findPreviousSolarIngress
} from './solarTime';
import { AyanamsaType } from '../types';

describe('solarTime module', () => {
  it('shouldCalculateJulianDayCorrectly', () => {
    // 2000-01-01 12:00 UTC = JD 2451545.0
    const jd = calculateJulianDay(new Date('2000-01-01T12:00:00Z'));
    expect(jd).toBeCloseTo(2451545.0, 5);
  });

  it('shouldParseUtcDateWithExplicitOffsetOrZ', () => {
    const d1 = parseUtcDate('1988-05-08T09:30:00+05:30');
    expect(d1.toISOString()).toBe('1988-05-08T04:00:00.000Z');

    const d2 = parseUtcDate('2000-01-01T12:00:00Z');
    expect(d2.toISOString()).toBe('2000-01-01T12:00:00.000Z');

    expect(() => parseUtcDate('1988-05-08 09:30:00')).toThrow();
  });

  it('shouldCalculateSunDeclinationAtSolsticesAndEquinoxes', () => {
    const obliq = 23.44;
    // Spring Equinox (0° tropical) -> ~0° declination
    expect(calculateDeclination(0, 0, obliq)).toBeCloseTo(0, 4);

    // Summer Solstice (90° tropical) -> +23.44°
    expect(calculateDeclination(90, 0, obliq)).toBeCloseTo(23.44, 2);

    // Autumn Equinox (180° tropical) -> ~0°
    expect(calculateDeclination(180, 0, obliq)).toBeCloseTo(0, 4);

    // Winter Solstice (270° tropical) -> -23.44°
    expect(calculateDeclination(270, 0, obliq)).toBeCloseTo(-23.44, 2);
  });

  it('shouldCalculateSunriseSunsetAndSolarNoonSymmetryForCanonicalUjjain', () => {
    // Ujjain, India (23.1765° N, 75.7885° E) on 1988-05-08
    const lat = 23.1765;
    const lon = 75.7885;
    const date = new Date('1988-05-08T04:00:00Z');

    const res = calculateSunriseSunset(lat, lon, date);
    expect(res).not.toBeNull();
    if (!res) return;

    expect(res.sunrise.getTime()).toBeLessThan(res.solarNoon.getTime());
    expect(res.solarNoon.getTime()).toBeLessThan(res.sunset.getTime());

    // Solar noon should be roughly halfway between sunrise and sunset
    const morningDuration = res.solarNoon.getTime() - res.sunrise.getTime();
    const afternoonDuration = res.sunset.getTime() - res.solarNoon.getTime();
    expect(Math.abs(morningDuration - afternoonDuration)).toBeLessThan(60000); // within 1 min symmetry
  });

  it('shouldReturnNullForPolarNightOrDay', () => {
    // North pole region in December (80° N, 0° E)
    const lat = 80.0;
    const lon = 0.0;
    const date = new Date('2024-12-21T12:00:00Z');

    const res = calculateSunriseSunset(lat, lon, date);
    expect(res).toBeNull();
  });

  it('shouldResolveSolarDayDetailsForDaytimeAndNighttime', () => {
    const lat = 23.1765;
    const lon = 75.7885;
    const offset = 330; // +05:30 for Ujjain

    // Daytime instant (12:00 local time = ~06:30 UTC)
    const dayInstant = new Date('1988-05-08T06:30:00Z');
    const dayDetails = getSolarDayDetails(lat, lon, dayInstant, offset);
    expect(dayDetails).not.toBeNull();
    expect(dayDetails?.isDaytime).toBe(true);

    // Nighttime instant (02:00 local time = 20:30 UTC previous day)
    const nightInstant = new Date('1988-05-07T20:30:00Z');
    const nightDetails = getSolarDayDetails(lat, lon, nightInstant, offset);
    expect(nightDetails).not.toBeNull();
    expect(nightDetails?.isDaytime).toBe(false);
  });

  it('shouldResolveSolarDayUsingLocalCivilDateNotUtcCalendarDate', () => {
    const dateTimeStr = '2023-05-15T00:30:00+05:30';
    const lat = 23.1765;
    const lon = 75.7885;

    const instant = parseUtcDate(dateTimeStr);
    const offset = getTimezoneOffsetMinutes(dateTimeStr);
    const dayDetails = getSolarDayDetails(lat, lon, instant, offset);

    expect(dayDetails).not.toBeNull();
    if (!dayDetails) return;

    // Local 00:30 AM on May 15 is pre-sunrise.
    // The solar day details resolves against May 15 local date.
    // Its nextSunrise (May 15 morning sunrise) after offset falls on local date May 15.
    const localNextSunriseDate = new Date(dayDetails.nextSunrise.getTime() + offset * 60000).getUTCDate();
    expect(localNextSunriseDate).toBe(15);
    expect(dayDetails.isDaytime).toBe(false);
  });

  it('shouldResolveSolarDayForNegativeTimezoneOffset', () => {
    // New York (40.7128° N, 74.0060° W), -05:00 offset
    // 21:00 (9:00 PM) on May 15 local time = May 16 02:00:00Z UTC
    const dateTimeStrNY = '2023-05-15T21:00:00-05:00';
    const latNY = 40.7128;
    const lonNY = -74.0060;

    const instantNY = parseUtcDate(dateTimeStrNY);
    const offsetNY = getTimezoneOffsetMinutes(dateTimeStrNY);
    const dayDetailsNY = getSolarDayDetails(latNY, lonNY, instantNY, offsetNY);

    expect(dayDetailsNY).not.toBeNull();
    if (!dayDetailsNY) return;

    // Sunrise on the local civil date (May 15) must be May 15 local date, not May 16 UTC date
    const localSunriseDateNY = new Date(dayDetailsNY.sunrise.getTime() + offsetNY * 60000).getUTCDate();
    expect(localSunriseDateNY).toBe(15);
    expect(dayDetailsNY.isDaytime).toBe(false);

    // Los Angeles (34.0522° N, 118.2437° W), -07:00 offset
    // 20:00 (8:00 PM) on May 15 local time = May 16 03:00:00Z UTC
    const dateTimeStrLA = '2023-05-15T20:00:00-07:00';
    const latLA = 34.0522;
    const lonLA = -118.2437;

    const instantLA = parseUtcDate(dateTimeStrLA);
    const offsetLA = getTimezoneOffsetMinutes(dateTimeStrLA);
    const dayDetailsLA = getSolarDayDetails(latLA, lonLA, instantLA, offsetLA);

    expect(dayDetailsLA).not.toBeNull();
    if (!dayDetailsLA) return;

    const localSunriseDateLA = new Date(dayDetailsLA.sunrise.getTime() + offsetLA * 60000).getUTCDate();
    expect(localSunriseDateLA).toBe(15);
    expect(dayDetailsLA.isDaytime).toBe(false);
  });

  it('shouldResolveSolarDayForUtc', () => {
    // Greenwich / London (51.5074° N, 0.1278° W), UTC ('Z')
    const dateTimeStr = '2023-05-15T12:00:00Z';
    const lat = 51.5074;
    const lon = -0.1278;

    const instant = parseUtcDate(dateTimeStr);
    const offset = getTimezoneOffsetMinutes(dateTimeStr);
    expect(offset).toBe(0);

    const dayDetails = getSolarDayDetails(lat, lon, instant, offset);
    expect(dayDetails).not.toBeNull();
    if (!dayDetails) return;

    expect(dayDetails.isDaytime).toBe(true);
    expect(dayDetails.sunrise.getUTCDate()).toBe(15);
  });

  it('shouldFindPreviousSolarIngressCorrectly', () => {
    const birthInstant = new Date('1988-05-08T04:00:00Z');
    // Find previous ingress into 0° Aries sidereal (usually mid-April)
    const ingress = findPreviousSolarIngress(0, birthInstant, AyanamsaType.LAHIRI);
    expect(ingress.getTime()).toBeLessThanOrEqual(birthInstant.getTime());

    const sunLongAtIngress = getSunSiderealLongitude(ingress, AyanamsaType.LAHIRI);
    expect(sunLongAtIngress).toBeCloseTo(0, 1);
  });
});
