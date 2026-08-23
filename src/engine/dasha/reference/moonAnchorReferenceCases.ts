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
  /**
   * Future architecture placeholder for a later D08.1 (Swiss Ephemeris vs JPL Horizons agreement layer).
   * Note: Cross-source validation is NOT yet active or validated in D08.
   */
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
 * UNVERIFIED TARGETS pending external ground-truth ephemeris capture from Swiss Ephemeris.
 *
 * Intended ground-truth capture parameters for the reproducibility artifact:
 * - Ephemeris engine: Swiss Ephemeris (sweph) v2.10+ compressed ephemeris files (`-eswe`)
 * - Target body: Moon (SE_MOON = 1, `-p1`)
 * - Calculation mode: Geocentric apparent sidereal longitude (`-sid1` for SE_SIDM_LAHIRI)
 * - Ayanamsa mode: SE_SIDM_LAHIRI (Traditional Lahiri Chitrapaksha)
 * - Output format: `-fPL` (Planet name + decimal ecliptic Longitude with floating-point precision)
 * - Birth instant input: UTC timestamp (`-utHH:MM:SS -bDD.MM.YYYY`)
 *
 * CLI Reproduction Command & Expected Output Format:
 * To capture and verify ground-truth longitudes, run the Swiss Ephemeris CLI tool `swetest`:
 * ```bash
 * # Example for New Delhi 1980-01-01 06:00:00 UTC (11:30 IST):
 * swetest -b1.1.1980 -ut06:00:00 -p1 -eswe -sid1 -fPL -head
 *
 * # Expected CLI output snippet:
 * # Moon        68.4215000
 * ```
 *
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
      methodology: 'Swiss Ephemeris compressed numerical ephemeris (sweph files, -eswe) with Lahiri Ayanamsa subtraction (-sid1, geocentric apparent sidereal longitude)',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Kolkata',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/',
      ephemerisBackend: 'Swiss Ephemeris (sweph)',
      ephemerisVersion: '2.10',
      calculationFlags: '-eswe -sid1 -p1 -fPL -head',
      outputFormat: 'Planet name and decimal sidereal longitude (-fPL)',
      verifiedCommand: 'swetest -b1.1.1980 -ut06:00:00 -p1 -eswe -sid1 -fPL -head'
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
      methodology: 'Swiss Ephemeris compressed numerical ephemeris (sweph files, -eswe) with Lahiri Ayanamsa subtraction (-sid1, geocentric apparent sidereal longitude)',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Europe/London',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/',
      ephemerisBackend: 'Swiss Ephemeris (sweph)',
      ephemerisVersion: '2.10',
      calculationFlags: '-eswe -sid1 -p1 -fPL -head',
      outputFormat: 'Planet name and decimal sidereal longitude (-fPL)',
      verifiedCommand: 'swetest -b21.6.2000 -ut12:00:00 -p1 -eswe -sid1 -fPL -head'
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
      methodology: 'Swiss Ephemeris compressed numerical ephemeris (sweph files, -eswe) with Lahiri Ayanamsa subtraction (-sid1, geocentric apparent sidereal longitude)',
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      timezone: 'Asia/Tokyo',
      dateConvention: '365.25 days/year',
      version: 'SwissEph-2.10',
      url: 'https://www.astro.com/swisseph/',
      ephemerisBackend: 'Swiss Ephemeris (sweph)',
      ephemerisVersion: '2.10',
      calculationFlags: '-eswe -sid1 -p1 -fPL -head',
      outputFormat: 'Planet name and decimal sidereal longitude (-fPL)',
      verifiedCommand: 'swetest -b15.10.2015 -ut00:00:00 -p1 -eswe -sid1 -fPL -head'
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
