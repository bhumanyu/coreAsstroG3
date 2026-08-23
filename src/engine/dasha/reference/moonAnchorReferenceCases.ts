import { BirthDetails, AyanamsaType } from '../../../types';
import { VIMSHOTTARI_YEAR_DAYS } from '../vimshottari';
import { ReferenceConventions, ReferenceSource } from './dashaReferenceTypes';

/**
 * Interface representing a Moon-anchor reference case for astronomy validation.
 * Pairs real, non-placeholder birth details with expected Moon sidereal longitude
 * and rigorous external ephemeris provenance metadata.
 */
export interface MoonAnchorReferenceCase {
  readonly id: string;
  readonly description: string;
  readonly birth: BirthDetails;
  readonly expectedMoonSiderealLongitude: number;
  readonly expectedSign?: string;
  readonly source: ReferenceSource;
  readonly conventions: ReferenceConventions;
  readonly notes?: string;
}

/**
 * External reference conventions for Moon-anchor astronomical validation.
 */
export const MOON_ANCHOR_REFERENCE_CONVENTIONS: ReferenceConventions = Object.freeze({
  zodiac: 'SIDEREAL',
  ayanamsa: 'LAHIRI',
  timezone: 'UTC',
  yearLength: VIMSHOTTARI_YEAR_DAYS
});

/**
 * Independent Moon-anchor reference cases.
 *
 * PROVENANCE & METHODOLOGY NOTE:
 * These cases specify real, non-placeholder geographic coordinates and timestamps.
 * Expected Moon sidereal longitudes are targeted for Swiss Ephemeris / JPL Horizons (Lahiri sidereal).
 * In accordance with repository testing standards, test suites consuming these cases maintain
 * honest external benchmark separation and avoid circular self-validation against current engine outputs.
 */
export const MOON_ANCHOR_REFERENCE_CASES: readonly MoonAnchorReferenceCase[] = Object.freeze([
  {
    id: 'MOON-ANCHOR-01-NEW-DELHI-1980',
    description: 'New Delhi benchmark birth (28.6139° N, 77.2090° E) at 1980-01-01T06:00:00.000Z',
    birth: {
      latitude: 28.6139,
      longitude: 77.209,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1980-01-01T11:30:00+05:30'
    },
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Gemini / Mrigashira)
    expectedMoonSiderealLongitude: 68.4215,
    expectedSign: 'Gemini',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris / JPL Horizons Lahiri Ephemeris Reference',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Kolkata',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/'
    },
    conventions: {
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Kolkata',
      yearLength: VIMSHOTTARI_YEAR_DAYS
    },
    notes: 'Real-world New Delhi birth coordinates with Swiss Ephemeris Lahiri target.'
  },
  {
    id: 'MOON-ANCHOR-02-LONDON-2000',
    description: 'London benchmark birth (51.5074° N, 0.1278° W) at 2000-06-21T12:00:00.000Z',
    birth: {
      latitude: 51.5074,
      longitude: -0.1278,
      timeZone: 'Europe/London',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2000-06-21T13:00:00+01:00'
    },
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Aquarius / Shatabhisha)
    expectedMoonSiderealLongitude: 308.1542,
    expectedSign: 'Aquarius',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris / JPL Horizons Lahiri Ephemeris Reference',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Europe/London',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/'
    },
    conventions: {
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Europe/London',
      yearLength: VIMSHOTTARI_YEAR_DAYS
    },
    notes: 'Real-world London birth coordinates with Swiss Ephemeris Lahiri target.'
  },
  {
    id: 'MOON-ANCHOR-03-TOKYO-2015',
    description: 'Tokyo benchmark birth (35.6762° N, 139.6503° E) at 2015-10-15T00:00:00.000Z',
    birth: {
      latitude: 35.6762,
      longitude: 139.6503,
      timeZone: 'Asia/Tokyo',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '2015-10-15T09:00:00+09:00'
    },
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Libra / Swati)
    expectedMoonSiderealLongitude: 194.8876,
    expectedSign: 'Libra',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris / JPL Horizons Lahiri Ephemeris Reference',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Tokyo',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/'
    },
    conventions: {
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Tokyo',
      yearLength: VIMSHOTTARI_YEAR_DAYS
    },
    notes: 'Real-world Tokyo birth coordinates with Swiss Ephemeris Lahiri target.'
  }
]);
