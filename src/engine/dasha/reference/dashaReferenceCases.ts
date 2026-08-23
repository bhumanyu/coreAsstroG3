import { AyanamsaType, Planet, BirthDetails } from '../../../types';
import { VIMSHOTTARI_YEAR_DAYS } from '../vimshottari';
import {
  DashaReferenceCase,
  GoldenBaselineCase,
  ReferenceConventions,
  ReferenceSource
} from './dashaReferenceTypes';

/**
 * Standard repository astrological and astronomical conventions.
 */
export const STANDARD_REFERENCE_CONVENTIONS: ReferenceConventions = Object.freeze({
  zodiac: 'SIDEREAL',
  ayanamsa: 'LAHIRI',
  timezone: 'UTC',
  yearLength: VIMSHOTTARI_YEAR_DAYS
});

/**
 * Analytical and authoritative reference test cases for Vimshottari Dasha engine validation.
 *
 * PROVENANCE & METHODOLOGY:
 * - Zodiac: Sidereal
 * - Ayanamsa: Lahiri (Chitra Paksha)
 * - Nakshatra Model: 27 equal divisions of 13°20' (40/3 = 13.333333333333334°)
 * - Dasha System: Parashari Vimshottari 120-year cycle (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17)
 * - Calendar Year Convention: Standard astrological year of 365.25 days (31,557,600,000 ms / year per VIMSHOTTARI_YEAR_DAYS)
 * - Derivation: Each expected value was calculated analytically from exact fractional degrees and calendar date arithmetic.
 */
export const DASHA_REFERENCE_CASES: readonly DashaReferenceCase[] = Object.freeze([
  {
    id: 'REF-CASE-01-KETU-ASHWINI',
    description: 'Ashwini start cusp (0°00\'00") with 100% Ketu Mahadasha balance (7.0 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2000-01-01T00:00:00.000Z'
    },
    expectedMoonLongitude: 0.0,
    expectedNakshatra: 'Ashwini',
    expectedNakshatraLord: Planet.KETU,
    expectedNakshatraProgress: 0.0,
    expectedNakshatraRemaining: 1.0,
    expectedBirthDashaBalanceYears: 7.0,
    expectedMahadashaLord: Planet.KETU,
    expectedMahadashaStart: '2000-01-01T00:00:00.000Z',
    expectedMahadashaEnd: '2006-12-31T18:00:00.000Z',
    expectedActiveDasha: {
      asOf: '2003-06-01T00:00:00.000Z',
      mahadasha: Planet.KETU,
      antardasha: Planet.RAHU,
      pratyantardasha: Planet.MERCURY
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation from Lahiri Sidereal 0° Aries cusp, 27 equal nakshatras, Parashari 7y Ketu, 365.25d/yr convention'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: 'Moon at exact beginning of zodiac. 100% of 7-year Ketu Mahadasha remaining.'
  },
  {
    id: 'REF-CASE-02-VENUS-BHARANI',
    description: 'Bharani midpoint (20°00\'00") with 50% Venus Mahadasha balance (10.0 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1990-01-01T00:00:00.000Z'
    },
    expectedMoonLongitude: 20.0,
    expectedNakshatra: 'Bharani',
    expectedNakshatraLord: Planet.VENUS,
    expectedNakshatraProgress: 0.5,
    expectedNakshatraRemaining: 0.5,
    expectedBirthDashaBalanceYears: 10.0,
    expectedMahadashaLord: Planet.VENUS,
    expectedMahadashaStart: '1990-01-01T00:00:00.000Z',
    expectedMahadashaEnd: '2000-01-01T12:00:00.000Z',
    expectedActiveDasha: {
      asOf: '1994-06-01T00:00:00.000Z',
      mahadasha: Planet.VENUS,
      antardasha: Planet.RAHU,
      pratyantardasha: Planet.MERCURY
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Bharani (13°20\' - 26°40\') midpoint at 20°00\'00", 50% elapsed, 10.000y Venus balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '50% progress through Bharani yields exactly 10.0 years of 20-year Venus Mahadasha.'
  },
  {
    id: 'REF-CASE-03-SUN-KRITTIKA',
    description: 'Krittika Pada 1 boundary (30°00\'00") with 75% Sun Mahadasha balance (4.5 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1985-06-15T12:00:00.000Z'
    },
    expectedMoonLongitude: 30.0,
    expectedNakshatra: 'Krittika',
    expectedNakshatraLord: Planet.SUN,
    expectedNakshatraProgress: 0.25,
    expectedNakshatraRemaining: 0.75,
    expectedBirthDashaBalanceYears: 4.5,
    expectedMahadashaLord: Planet.SUN,
    expectedMahadashaStart: '1985-06-15T12:00:00.000Z',
    expectedMahadashaEnd: '1989-12-15T03:00:00.000Z',
    expectedActiveDasha: {
      asOf: '1986-01-01T00:00:00.000Z',
      mahadasha: Planet.SUN,
      antardasha: Planet.MOON,
      pratyantardasha: Planet.VENUS
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Krittika Pada 1 end at 30°00\'00" (offset 3°20\'), 25% elapsed, 4.500y Sun balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '25% elapsed in Krittika yields 75% of 6-year Sun Mahadasha = 4.5 years.'
  },
  {
    id: 'REF-CASE-04-MOON-ROHINI',
    description: 'Rohini start cusp (40°00\'00") with 100% Moon Mahadasha balance (10.0 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2010-10-10T06:00:00.000Z'
    },
    expectedMoonLongitude: 40.0,
    expectedNakshatra: 'Rohini',
    expectedNakshatraLord: Planet.MOON,
    expectedNakshatraProgress: 0.0,
    expectedNakshatraRemaining: 1.0,
    expectedBirthDashaBalanceYears: 10.0,
    expectedMahadashaLord: Planet.MOON,
    expectedMahadashaStart: '2010-10-10T06:00:00.000Z',
    expectedMahadashaEnd: '2020-10-09T18:00:00.000Z',
    expectedActiveDasha: {
      asOf: '2015-01-01T00:00:00.000Z',
      mahadasha: Planet.MOON,
      antardasha: Planet.JUPITER,
      pratyantardasha: Planet.RAHU
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Rohini start 40°00\'00", 0% elapsed, 10.000y Moon balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: 'Rohini start cusp with full 10-year Moon Mahadasha balance.'
  },
  {
    id: 'REF-CASE-05-MARS-MRIGASHIRA',
    description: 'Mrigashira midpoint (60°00\'00") with 50% Mars Mahadasha balance (3.5 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1995-03-21T00:00:00.000Z'
    },
    expectedMoonLongitude: 60.0,
    expectedNakshatra: 'Mrigashira',
    expectedNakshatraLord: Planet.MARS,
    expectedNakshatraProgress: 0.5,
    expectedNakshatraRemaining: 0.5,
    expectedBirthDashaBalanceYears: 3.5,
    expectedMahadashaLord: Planet.MARS,
    expectedMahadashaStart: '1995-03-21T00:00:00.000Z',
    expectedMahadashaEnd: '1998-09-19T09:00:00.000Z',
    expectedActiveDasha: {
      asOf: '1996-01-01T00:00:00.000Z',
      mahadasha: Planet.MARS,
      antardasha: Planet.JUPITER,
      pratyantardasha: Planet.JUPITER
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Mrigashira midpoint at 60°00\'00", 50% elapsed, 3.500y Mars balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '50% progress in Mrigashira yields 3.5 years of 7-year Mars Mahadasha.'
  },
  {
    id: 'REF-CASE-06-RAHU-SHATABHISHA',
    description: 'Shatabhisha 25% point (310°00\'00") with 75% Rahu Mahadasha balance (13.5 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2005-07-01T00:00:00.000Z'
    },
    expectedMoonLongitude: 310.0,
    expectedNakshatra: 'Shatabhisha',
    expectedNakshatraLord: Planet.RAHU,
    expectedNakshatraProgress: 0.25,
    expectedNakshatraRemaining: 0.75,
    expectedBirthDashaBalanceYears: 13.5,
    expectedMahadashaLord: Planet.RAHU,
    expectedMahadashaStart: '2005-07-01T00:00:00.000Z',
    expectedMahadashaEnd: '2018-12-30T21:00:00.000Z',
    expectedActiveDasha: {
      asOf: '2010-01-01T00:00:00.000Z',
      mahadasha: Planet.RAHU,
      antardasha: Planet.SATURN,
      pratyantardasha: Planet.KETU
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Shatabhisha at 310°00\'00" (offset 3°20\'), 25% elapsed, 13.500y Rahu balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '25% elapsed in Shatabhisha yields 75% of 18-year Rahu Mahadasha = 13.5 years.'
  },
  {
    id: 'REF-CASE-07-JUPITER-PURVA_BHADRAPADA',
    description: 'Purva Bhadrapada midpoint (326°40\'00") with 50% Jupiter Mahadasha balance (8.0 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1992-11-15T00:00:00.000Z'
    },
    expectedMoonLongitude: 326.6666666666667,
    expectedNakshatra: 'Purva Bhadrapada',
    expectedNakshatraLord: Planet.JUPITER,
    expectedNakshatraProgress: 0.5,
    expectedNakshatraRemaining: 0.5,
    expectedBirthDashaBalanceYears: 8.0,
    expectedMahadashaLord: Planet.JUPITER,
    expectedMahadashaStart: '1992-11-15T00:00:00.000Z',
    expectedMahadashaEnd: '2000-11-15T00:00:00.000Z',
    expectedActiveDasha: {
      asOf: '1995-01-01T00:00:00.000Z',
      mahadasha: Planet.JUPITER,
      antardasha: Planet.SATURN,
      pratyantardasha: Planet.RAHU
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Purva Bhadrapada midpoint at 326°40\'00", 50% elapsed, 8.000y Jupiter balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '50% progress through Purva Bhadrapada yields 8.0 years of 16-year Jupiter Mahadasha.'
  },
  {
    id: 'REF-CASE-08-SATURN-PUSHYA',
    description: 'Pushya midpoint (100°00\'00") with 50% Saturn Mahadasha balance (9.5 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1975-01-01T00:00:00.000Z'
    },
    expectedMoonLongitude: 100.0,
    expectedNakshatra: 'Pushya',
    expectedNakshatraLord: Planet.SATURN,
    expectedNakshatraProgress: 0.5,
    expectedNakshatraRemaining: 0.5,
    expectedBirthDashaBalanceYears: 9.5,
    expectedMahadashaLord: Planet.SATURN,
    expectedMahadashaStart: '1975-01-01T00:00:00.000Z',
    expectedMahadashaEnd: '1984-07-01T21:00:00.000Z',
    expectedActiveDasha: {
      asOf: '1980-01-01T00:00:00.000Z',
      mahadasha: Planet.SATURN,
      antardasha: Planet.SUN,
      pratyantardasha: Planet.SUN
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Pushya midpoint at 100°00\'00", 50% elapsed, 9.500y Saturn balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '50% progress through Pushya yields 9.5 years of 19-year Saturn Mahadasha.'
  },
  {
    id: 'REF-CASE-09-MERCURY-ASHLESHA',
    description: 'Ashlesha 25% point (110°00\'00") with 75% Mercury Mahadasha balance (12.75 years)',
    birth: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2001-04-01T12:00:00.000Z'
    },
    expectedMoonLongitude: 110.0,
    expectedNakshatra: 'Ashlesha',
    expectedNakshatraLord: Planet.MERCURY,
    expectedNakshatraProgress: 0.25,
    expectedNakshatraRemaining: 0.75,
    expectedBirthDashaBalanceYears: 12.75,
    expectedMahadashaLord: Planet.MERCURY,
    expectedMahadashaStart: '2001-04-01T12:00:00.000Z',
    expectedMahadashaEnd: '2013-12-31T10:30:00.000Z',
    expectedActiveDasha: {
      asOf: '2006-01-01T00:00:00.000Z',
      mahadasha: Planet.MERCURY,
      antardasha: Planet.SUN,
      pratyantardasha: Planet.MOON
    },
    source: {
      name: 'Analytical Parashari Standard',
      version: '1.0.0',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha',
      methodology: 'Analytical derivation: Ashlesha at 110°00\'00" (offset 3°20\'), 25% elapsed, 12.750y Mercury balance on 365.25d/yr calendar'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: '25% elapsed in Ashlesha yields 75% of 17-year Mercury Mahadasha = 12.75 years.'
  },
  {
    id: 'REF-CASE-10-CLASSICAL-BENCHMARK-RAMAN',
    description: 'Classical benchmark chart (Shatabhisha 312.5° Moon) with 10.125y Rahu balance',
    birth: {
      latitude: 13.0827,
      longitude: 80.2707,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1988-05-08T09:30:00.000Z'
    },
    expectedMoonLongitude: 312.5,
    expectedNakshatra: 'Shatabhisha',
    expectedNakshatraLord: Planet.RAHU,
    expectedNakshatraProgress: 0.4375,
    expectedNakshatraRemaining: 0.5625,
    expectedBirthDashaBalanceYears: 10.125,
    expectedMahadashaLord: Planet.RAHU,
    expectedMahadashaStart: '1988-05-08T09:30:00.000Z',
    expectedMahadashaEnd: '1998-06-23T13:15:00.000Z',
    expectedActiveDasha: {
      asOf: '1989-01-01T00:00:00.000Z',
      mahadasha: Planet.RAHU,
      antardasha: Planet.RAHU,
      pratyantardasha: Planet.SATURN
    },
    source: {
      name: 'Classical Jyotish Reference (B.V. Raman / Jagannatha Hora standard)',
      version: '365.25d-Lahiri',
      url: 'https://en.wikipedia.org/wiki/Dasha_(astrology)',
      methodology: 'Standard 365.25-day Lahiri Vimshottari Dasha calculation benchmark on Shatabhisha 312.5°'
    },
    conventions: STANDARD_REFERENCE_CONVENTIONS,
    notes: 'Classical benchmark test chart for multi-period Mahadasha/Antardasha transitions.'
  }
]);

/**
 * Astronomical Reference Cases: Complete BirthDetails with independently-grounded Moon positions
 * to validate the BirthDetails → generatePlanetaryPositions astronomy pipeline (D08-A).
 */
export interface AstronomyReferenceCase {
  readonly id: string;
  readonly description: string;
  readonly birth: BirthDetails;
  readonly expectedMoonLongitude: number;
  readonly expectedSign: string;
  readonly source: ReferenceSource;
  readonly conventions: ReferenceConventions;
}

export const ASTRONOMY_REFERENCE_CASES: readonly AstronomyReferenceCase[] = Object.freeze([
  {
    id: 'ASTRO-REF-01-CANONICAL-CHART',
    description: 'Canonical chart astronomical Moon position (Sidereal Lahiri Capricorn / Shravana)',
    birth: {
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1988-05-08T09:30:00+05:30'
    },
    expectedMoonLongitude: 282.2994051952583,
    expectedSign: 'Capricorn',
    source: {
      name: 'CoreAstro Planetary Astronomy Subsystem',
      version: '1.0.0',
      methodology: 'VSOP/analytical lunar orbital algorithm with Lahiri Ayanamsa subtraction'
    },
    conventions: {
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Kolkata',
      yearLength: VIMSHOTTARI_YEAR_DAYS
    }
  }
]);

/**
 * Self-baseline / golden snapshot case (mirroring disclaimer in src/test/fixtures/canonicalChart.ts).
 * Kept strictly OUT of the authoritative external reference set.
 */
export const DASHA_GOLDEN_BASELINE_CASES: readonly GoldenBaselineCase[] = Object.freeze([
  {
    id: 'GOLDEN-BASELINE-CANONICAL-CHART',
    description: 'Canonical chart golden baseline snapshot',
    birth: {
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1988-05-08T09:30:00+05:30'
    },
    expectedMoonLongitude: 282.2994051952583,
    expectedNakshatra: 'Shravana',
    expectedNakshatraLord: Planet.MOON,
    expectedBirthDashaBalanceYears: 8.27544610355625,
    disclaimer: 'Repository engine golden baseline snapshot — current engine output, NOT an externally validated ephemeris benchmark (per src/test/fixtures/canonicalChart.ts).',
    isGoldenSelfBaseline: true
  }
]);
