import type { Horoscope, Planet } from '../../../types';

/**
 * Fixture chart designed to produce mixed structural effects:
 * - 10H↔6H = SUPPORT (supporting relationship)
 * - 10H↔8H = CHALLENGE (challenging relationship)
 * 
 * This ensures the structural reasoning direction is MIXED.
 * 
 * Setup:
 * - 10H lord (Saturn) is placed in 6H → LORD_IN_HOUSE relationship (10H↔6H)
 * - 8H lord (Mars) is placed in 10H → LORD_IN_HOUSE relationship (10H↔8H)
 * 
 * Since 10H is PRIMARY, 6H is SUPPORTING, and 8H is CHALLENGING:
 * - 10H↔6H → SUPPORT
 * - 10H↔8H → CHALLENGE
 */
export const MIXED_STRUCTURAL_CHART: Horoscope = {
  birthDetails: {
    date: { year: 1990, month: 6, day: 15 },
    time: { hour: 10, minute: 30, second: 0 },
    timezone: 'Asia/Kolkata'
  },
  planetFacts: {
    SUN: { house: 5, sign: 'LEO', position: { longitude: 135.2 } },
    MOON: { house: 4, sign: 'CANCER', position: { longitude: 118.4 } },
    MARS: { house: 10, sign: 'CAPRICORN', position: { longitude: 295.2 } },
    MERCURY: { house: 5, sign: 'LEO', position: { longitude: 138.5 } },
    JUPITER: { house: 12, sign: 'PISCES', position: { longitude: 345.2 } },
    VENUS: { house: 4, sign: 'CANCER', position: { longitude: 115.3 } },
    SATURN: { house: 6, sign: 'VIRGO', position: { longitude: 175.8 } },
    RAHU: { house: 11, sign: 'AQUARIUS', position: { longitude: 325.4 } },
    KETU: { house: 5, sign: 'LEO', position: { longitude: 135.2 } }
  },
  houseAnalysis: {
    houses: [
      { house: 1, lord: 'MARS' as Planet, sign: 'ARIES' },
      { house: 2, lord: 'VENUS' as Planet, sign: 'TAURUS' },
      { house: 3, lord: 'MERCURY' as Planet, sign: 'GEMINI' },
      { house: 4, lord: 'MOON' as Planet, sign: 'CANCER' },
      { house: 5, lord: 'SUN' as Planet, sign: 'LEO' },
      { house: 6, lord: 'SATURN' as Planet, sign: 'VIRGO' },
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
      SUN: { house: 5, sign: 'LEO', dignity: 'OWN' },
      MOON: { house: 4, sign: 'CANCER', dignity: 'OWN' },
      MARS: { house: 10, sign: 'CAPRICORN', dignity: 'ENEMY' },
      MERCURY: { house: 5, sign: 'LEO', dignity: 'ENEMY' },
      JUPITER: { house: 12, sign: 'PISCES', dignity: 'OWN' },
      VENUS: { house: 4, sign: 'CANCER', dignity: 'FRIEND' },
      SATURN: { house: 6, sign: 'VIRGO', dignity: 'ENEMY' },
      RAHU: { house: 11, sign: 'AQUARIUS', dignity: 'FRIEND' },
      KETU: { house: 5, sign: 'LEO', dignity: 'ENEMY' }
    }
  },
  natalGrahaDrishti: {
    aspects: []
  }
} as any;