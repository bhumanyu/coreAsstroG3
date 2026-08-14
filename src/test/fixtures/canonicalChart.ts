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

