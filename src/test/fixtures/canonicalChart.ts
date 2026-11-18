/**
 * Repository canonical fixture values (not an external ephemeris benchmark).
 *
 * Display local time: 1988-05-08 09:30 Asia/Kolkata (offset +05:30)
 * Canonical UTC instant: 1988-05-08T04:00:00Z
 * Methodology: Sidereal / Lahiri / Whole Sign / Vimshottari / Parashari
 * Timezone-less datetimes are rejected by parseUtcDate.
 */

import { BirthDetails, AyanamsaType, Planet } from '../../types';

export const CANONICAL_BIRTH_DETAILS: BirthDetails = Object.freeze({
  latitude: 25.75,
  longitude: 85.4167,
  timeZone: 'Asia/Kolkata',
  ayanamsa: AyanamsaType.LAHIRI,
  dateTimeStr: '1988-05-08T09:30:00+05:30'
} as const);

export const CANONICAL_UTC_INSTANT = '1988-05-08T04:00:00Z';

/**
 * Vaishali, Bihar birth details — same instant/methodology as CANONICAL_BIRTH_DETAILS
 * but anchored to the Vaishali location (~25.98°N, 85.21°E) instead of Patna.
 * Produces the Taurus-Mercury chart: Mercury in Taurus (house 12),
 * Saturn in Sagittarius (house 7), Mars exalted in Capricorn (house 8).
 */
export const VAISHALI_BIRTH_DETAILS: BirthDetails = Object.freeze({
  name: 'Vaishali chart',
  placeOfBirth: 'Vaishali, Bihar',
  latitude: 25.98,
  longitude: 85.21,
  timeZone: 'Asia/Kolkata',
  ayanamsa: AyanamsaType.LAHIRI,
  dateTimeStr: '1988-05-08T09:30:00+05:30'
} as const);

/**
 * Bokaro, Jharkhand birth details — the "new live chart" used for the
 * Virgo-lagna pattern-detection audit. Produces Virgo lagna with
 * Moon/Venus in Gemini (house 10), Sun/Mercury/Jupiter/Ketu in Cancer
 * (house 11, Jupiter exalted at ~0.25° Cancer and combust), and Mars in
 * Aries (house 8).
 */
export const BOKARO_BIRTH_DETAILS: BirthDetails = Object.freeze({
  name: 'Bokaro chart',
  placeOfBirth: 'Bokaro, Jharkhand, India',
  latitude: 23.6693,
  longitude: 86.1511,
  timeZone: 'Asia/Kolkata',
  ayanamsa: AyanamsaType.LAHIRI,
  dateTimeStr: '1990-07-21T10:00:00+05:30'
} as const);

/**
 * Varun birth details — Kolkata anchor (~22.57°N, 88.36°E), 9 Nov 1984 01:50 IST.
 * Used for the Rahu-Ketu node condition / pattern-qualification audit.
 */
export const VARUN_BIRTH_DETAILS: BirthDetails = Object.freeze({
  name: 'Varun chart',
  placeOfBirth: 'Kolkata, West Bengal, India',
  latitude: 22.57,
  longitude: 88.36,
  timeZone: 'Asia/Kolkata',
  ayanamsa: AyanamsaType.LAHIRI,
  dateTimeStr: '1984-11-09T01:50:00+05:30'
} as const);

/**
 * Repository engine golden baseline snapshot — current engine output, NOT an externally validated ephemeris benchmark.
 */
export const CANONICAL_GOLDEN_EXPECTED = Object.freeze({
  ascendantLongitude: 87.34353537163112,
  planets: Object.freeze({
    [Planet.SUN]: 24.097297373240824,
    [Planet.MOON]: 282.2994051952583,
    [Planet.MARS]: 296.8230673370204,
    [Planet.MERCURY]: 43.102466092295685,
    [Planet.JUPITER]: 20.491907577081673,
    [Planet.VENUS]: 63.11954483807847,
    [Planet.SATURN]: 248.5711990593497,
    [Planet.RAHU]: 326.6901719257589,
    [Planet.KETU]: 146.6901719257588
  })
} as const);

