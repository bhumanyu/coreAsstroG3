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
  readonly crossChecks?: readonly ReferenceSource[];
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
 * PROVENANCE, METHODOLOGY & REPRODUCIBILITY ARTIFACT:
 * ---------------------------------------------------
 * These reference cases specify real, non-placeholder geographic coordinates and timestamps.
 * IMPORTANT: The expected Moon sidereal longitudes (68.4215°, 308.1542°, 194.8876°) are currently
 * UNVERIFIED TARGETS pending external ground-truth ephemeris capture from Swiss Ephemeris / DE431.
 *
 * Intended ground-truth capture parameters for the reproducibility artifact:
 * - Ephemeris engine: Swiss Ephemeris (sweph) v2.10+ / DE431
 * - Target body: Moon (SE_MOON)
 * - Calculation mode: Geocentric apparent sidereal longitude (SEFLG_SWIEPH | SEFLG_SIDEREAL | SEFLG_SPEED)
 * - Ayanamsa mode: SE_SIDM_LAHIRI (Traditional Lahiri Chitrapaksha, IAU 1980 / 2000 precession)
 * - Birth instant input: UTC timestamp parsed from ISO-8601
 * - Geographic coordinates: Geocentric latitude / longitude
 *
 * Regeneration Reference:
 * To capture and verify ground-truth longitudes, run the Swiss Ephemeris CLI tool `swetest`:
 * ```bash
 * # Example for New Delhi 1980-01-01 06:00:00 UTC (11:30 IST):
 * swetest -b1.1.1980 -ut06:00:00 -p1 -eswe -sid1 -fP -head
 * ```
 * Test suites consuming these cases maintain strict separation and remain skipped in CI (`describe.skip`)
 * until verified external ephemeris values are captured and cross-checked.
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
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Gemini / Mrigashira) - UNVERIFIED TARGET
    expectedMoonSiderealLongitude: 68.4215,
    expectedSign: 'Gemini',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction (geocentric apparent)',
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
    notes: 'Real-world New Delhi birth coordinates with TARGET/UNVERIFIED Swiss Ephemeris Lahiri value pending ground-truth ephemeris capture.'
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
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Aquarius / Shatabhisha) - UNVERIFIED TARGET
    expectedMoonSiderealLongitude: 308.1542,
    expectedSign: 'Aquarius',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction (geocentric apparent)',
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
    notes: 'Real-world London birth coordinates with TARGET/UNVERIFIED Swiss Ephemeris Lahiri value pending ground-truth ephemeris capture.'
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
    // Target Swiss Ephemeris Lahiri Sidereal Moon Longitude (Libra / Swati) - UNVERIFIED TARGET
    expectedMoonSiderealLongitude: 194.8876,
    expectedSign: 'Libra',
    source: {
      type: 'EXTERNAL_EPHEMERIS',
      name: 'Swiss Ephemeris',
      methodology: 'High-precision numerical integration (DE431) with Swiss Ephemeris Lahiri Ayanamsa subtraction (geocentric apparent)',
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
    notes: 'Real-world Tokyo birth coordinates with TARGET/UNVERIFIED Swiss Ephemeris Lahiri value pending ground-truth ephemeris capture.'
  }
]);
