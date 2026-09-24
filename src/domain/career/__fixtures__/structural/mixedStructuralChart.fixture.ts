import type { Horoscope, Planet } from '../../../types';

/**
 * Fixture chart designed to produce mixed structural effects:
 * - 10H↔6H = SUPPORT (supporting relationship)
 * - 10H↔8H = CHALLENGE (challenging relationship)
 * 
 * This ensures the structural reasoning direction is MIXED.
 */
export const MIXED_STRUCTURAL_CHART: Horoscope = {
  birthDetails: {
    date: { year: 1990, month: 6, day: 15 },
    time: { hour: 10, minute: 30, second: 0 },
    timezone: 'Asia/Kolkata'
  },
  planetFacts: {
    SUN: { house: 10, sign: 'GEMINI', position: { longitude: 75.5 } },
    MOON: { house: 6, sign: 'SCORPIO', position: { longitude: 210.3 } },
    MARS: { house: 8, sign: 'AQUARIUS', position: { longitude: 315.7 } },
    MERCURY: { house: 10, sign: 'GEMINI', position: { longitude: 78.2 } },
    JUPITER: { house: 6, sign: 'SCORPIO', position: { longitude: 212.5 } },
    VENUS: { house: 2, sign: 'CANCER', position: { longitude: 118.4 } },
    SATURN: { house: 8, sign: 'AQUARIUS', position: { longitude: 318.9 } },
    RAHU: { house: 11, sign: 'PISCES', position: { longitude: 345.2 } },
    KETU: { house: 5, sign: 'VIRGO', position: { longitude: 165.2 } }
  },
  houseAnalysis: {
    houses: [
      { house: 1, lord: 'MARS' as Planet, sign: 'ARIES' },
      { house: 2, lord: 'VENUS' as Planet, sign: 'TAURUS' },
      { house: 3, lord: 'MERCURY' as Planet, sign: 'GEMINI' },
      { house: 4, lord: 'MOON' as Planet, sign: 'CANCER' },
      { house: 5, lord: 'SUN' as Planet, sign: 'LEO' },
      { house: 6, lord: 'MERCURY' as Planet, sign: 'VIRGO' },
      { house: 7, lord: 'VENUS' as Planet, sign: 'LIBRA' },
      { house: 8, lord: 'MARS' as Planet, sign: 'SCORPIO' },
      { house: 9, lord: 'JUPITER' as Planet, sign: 'SAGITTARIUS' },
      { house: 10, lord: 'SATURN' as Planet, sign: 'CAPRICORN' },
      { house: 11, lord: 'SATURN' as Planet, sign: 'AQUARIUS' },
      { house: 12, lord: 'JUPITER' as Planet, sign: 'PISCES' }
    ]
  },
  planetAnalysis: {
    planets: {
      SUN: { house: 10, sign: 'GEMINI', dignity: 'FRIEND' },
      MOON: { house: 6, sign: 'SCORPIO', dignity: 'ENEMY' },
      MARS: { house: 8, sign: 'AQUARIUS', dignity: 'NEUTRAL' },
      MERCURY: { house: 10, sign: 'GEMINI', dignity: 'OWN' },
      JUPITER: { house: 6, sign: 'SCORPIO', dignity: 'ENEMY' },
      VENUS: { house: 2, sign: 'CANCER', dignity: 'ENEMY' },
      SATURN: { house: 8, sign: 'AQUARIUS', dignity: 'OWN' },
      RAHU: { house: 11, sign: 'PISCES', dignity: 'FRIEND' },
      KETU: { house: 5, sign: 'VIRGO', dignity: 'ENEMY' }
    }
  },
  natalGrahaDrishti: {
    aspects: [
      // Jupiter in 6th house aspects 10th house (SUPPORT for 10H↔6H)
      { sourcePlanet: 'JUPITER' as Planet, targetHouse: 10, type: 'FULL_7TH' },
      // Saturn in 8th house aspects 10th house (CHALLENGE for 10H↔8H)
      { sourcePlanet: 'SATURN' as Planet, targetHouse: 10, type: 'FULL_7TH' }
    ]
  }
} as any;