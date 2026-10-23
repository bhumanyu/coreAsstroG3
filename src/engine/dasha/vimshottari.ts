/**
 * PR-041: Birth-Anchored Vimshottari Dasha Engine
 *
 * Computes birth-anchored Vimshottari Dasha timelines down to Pratyantardasha
 * level based on Moon's sidereal longitude and birth date/time.
 *
 * Reuses repository metadata (NAKSHATRAS_METADATA, Planet enum).
 * Implements deterministic date arithmetic and exact boundary tiling.
 */

import { Planet } from '../../types';
import { NAKSHATRAS_METADATA } from '../../data/astroData';
import { calculateNakshatra } from '../nakshatraUtils';

/**
 * Engine contract: 1 Vimshottari year = 365.25 days; this materially affects MD/AD/PD boundaries and must match the chosen reference software/source.
 */
export const VIMSHOTTARI_YEAR_DAYS = 365.25;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_VIMSHOTTARI_YEAR = VIMSHOTTARI_YEAR_DAYS * MS_PER_DAY;

/**
 * Vimshottari Mahadasha durations in years for each planet.
 */
export const DASHA_YEARS: Record<Planet, number> = Object.freeze({
  [Planet.KETU]: 7,
  [Planet.VENUS]: 20,
  [Planet.SUN]: 6,
  [Planet.MOON]: 10,
  [Planet.MARS]: 7,
  [Planet.RAHU]: 18,
  [Planet.JUPITER]: 16,
  [Planet.SATURN]: 19,
  [Planet.MERCURY]: 17
});

/**
 * Canonical 9-planet Vimshottari sequence.
 */
export const DASHA_SEQUENCE: readonly Planet[] = Object.freeze([
  Planet.KETU,
  Planet.VENUS,
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.RAHU,
  Planet.JUPITER,
  Planet.SATURN,
  Planet.MERCURY
]);

/**
 * Input structure for Vimshottari Dasha calculation.
 */
export interface VimshottariInput {
  readonly birthDateTime: string;           // ISO string
  readonly moonSiderealLongitude: number;   // degrees (any numeric, normalized)
  readonly until?: string;                  // optional ISO string horizon
}

/**
 * Pratyantardasha Period.
 */
export interface PratyantardashaPeriod {
  readonly planet: Planet;
  readonly start: string;    // ISO string
  readonly end: string;      // ISO string
}

/**
 * Antardasha Period.
 */
export interface AntardashaPeriod {
  readonly planet: Planet;
  readonly start: string;    // ISO string
  readonly end: string;      // ISO string
  readonly pratyantardashas: readonly PratyantardashaPeriod[];
}

/**
 * Mahadasha Period.
 */
export interface MahadashaPeriod {
  readonly planet: Planet;
  readonly start: string;    // ISO string
  readonly end: string;      // ISO string
  readonly antardashas: readonly AntardashaPeriod[];
}

/**
 * Complete Vimshottari Timeline.
 */
export interface VimshottariTimeline {
  readonly birthDateTime: string;
  readonly moonSiderealLongitude: number;
  readonly nakshatra: string;
  readonly nakshatraLord: Planet;
  readonly nakshatraProgress: number; // 0.0..1.0
  readonly remainingFraction: number;// 0.0..1.0
  readonly mahadashas: readonly MahadashaPeriod[];
}

/**
 * Active Dasha state representation at a specific point in time.
 */
export interface ActiveDashaState {
  readonly mahadasha: MahadashaPeriod;
  readonly antardasha: AntardashaPeriod;
  readonly pratyantardasha: PratyantardashaPeriod;
}

/**
 * Normalizes an angular degree into [0°, 360°).
 * Boundary convention: exact 360° wraps to 0° (circular equivalence).
 */
export function normalizeDegrees(degree: number): number {
  if (typeof degree !== 'number' || isNaN(degree) || !isFinite(degree)) {
    throw new TypeError('Longitude must be a finite number.');
  }
  let norm = degree % 360;
  if (norm < 0) {
    norm += 360;
  }
  if (norm === 0) {
    return 0;
  }
  return norm;
}

/**
 * Rotates the Vimshottari dasha sequence to start at the specified planet.
 */
export function rotateDashaSequence(startPlanet: Planet): Planet[] {
  const idx = DASHA_SEQUENCE.indexOf(startPlanet);
  if (idx === -1) {
    throw new TypeError(`Invalid start planet for Dasha sequence: ${startPlanet}`);
  }
  return [...DASHA_SEQUENCE.slice(idx), ...DASHA_SEQUENCE.slice(0, idx)];
}

/**
 * Adds fractional Vimshottari years to a date using VIMSHOTTARI_YEAR_DAYS (365.25 days/yr).
 */
export function addFractionalYears(date: Date, years: number): Date {
  const ms = years * MS_PER_VIMSHOTTARI_YEAR;
  // Date applies ECMAScript TimeClip: fractional milliseconds are truncated, defining period-boundary precision.
  return new Date(date.getTime() + ms);
}

/**
 * Parses strict ISO-8601 date-times with Z or numeric offsets from -23:59 to +23:59.
 * Fractional seconds are accepted at arbitrary decimal precision, but ECMAScript Date
 * retains only milliseconds. Leap seconds are not representable. Timeline output is
 * normalized with toISOString(), so the input's textual timezone is not retained.
 */
function parseIsoDateTime(value: string, field: 'birthDateTime' | 'until'): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) {
    throw new TypeError(`${field} must be an ISO-8601 date-time with Z or an explicit UTC offset.`);
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const daysInMonth = [
    31,
    (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ][month - 1];

  if (
    month < 1 || month > 12 ||
    day < 1 || day > (daysInMonth ?? 0) ||
    hour > 23 || minute > 59 || second > 59
  ) {
    throw new TypeError(`${field} must be a valid ISO-8601 calendar date-time.`);
  }

  if (zone !== 'Z') {
    const [offsetHours, offsetMinutes] = zone.slice(1).split(':').map(Number);
    if (offsetHours > 23 || offsetMinutes > 59) {
      throw new TypeError(`${field} must use a valid ISO-8601 UTC offset.`);
    }
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new TypeError(`${field} must be a valid ISO-8601 calendar date-time.`);
  }
  return date;
}

/**
 * Internal builder for Pratyantardashas within an Antardasha window.
 */
function buildPratyantardashas(
  adPlanet: Planet,
  adStart: Date,
  adEnd: Date
): readonly PratyantardashaPeriod[] {
  const parentDurationMs = adEnd.getTime() - adStart.getTime();
  if (parentDurationMs <= 0) return Object.freeze([]);

  const pdSequence = rotateDashaSequence(adPlanet);
  const pratyantardashas: PratyantardashaPeriod[] = [];
  let currentPdStart = new Date(adStart.getTime());

  for (let i = 0; i < pdSequence.length; i++) {
    if (currentPdStart.getTime() >= adEnd.getTime()) break;

    const pdPlanet = pdSequence[i];
    let pdEnd: Date;

    if (i === pdSequence.length - 1) {
      // Force last PD end to match AD end exactly
      pdEnd = new Date(adEnd.getTime());
    } else {
      const pdRatio = DASHA_YEARS[pdPlanet] / 120;
      const pdDurationMs = parentDurationMs * pdRatio;
      pdEnd = new Date(currentPdStart.getTime() + pdDurationMs);
      if (pdEnd.getTime() > adEnd.getTime()) {
        pdEnd = new Date(adEnd.getTime());
      }
    }

    const pdPeriod: PratyantardashaPeriod = Object.freeze({
      planet: pdPlanet,
      start: currentPdStart.toISOString(),
      end: pdEnd.toISOString()
    });

    pratyantardashas.push(pdPeriod);
    currentPdStart = pdEnd;
  }

  return Object.freeze(pratyantardashas);
}

/**
 * Internal builder for Antardashas within a Mahadasha window.
 */
function buildAntardashas(
  mdPlanet: Planet,
  mdStart: Date,
  mdEnd: Date
): readonly AntardashaPeriod[] {
  const parentDurationMs = mdEnd.getTime() - mdStart.getTime();
  if (parentDurationMs <= 0) return Object.freeze([]);

  const adSequence = rotateDashaSequence(mdPlanet);
  const antardashas: AntardashaPeriod[] = [];
  let currentAdStart = new Date(mdStart.getTime());

  for (let i = 0; i < adSequence.length; i++) {
    if (currentAdStart.getTime() >= mdEnd.getTime()) break;

    const adPlanet = adSequence[i];
    let adEnd: Date;

    if (i === adSequence.length - 1) {
      // Force last AD end to match MD end exactly
      adEnd = new Date(mdEnd.getTime());
    } else {
      const adRatio = DASHA_YEARS[adPlanet] / 120;
      const adDurationMs = parentDurationMs * adRatio;
      adEnd = new Date(currentAdStart.getTime() + adDurationMs);
      if (adEnd.getTime() > mdEnd.getTime()) {
        adEnd = new Date(mdEnd.getTime());
      }
    }

    const pratyantardashas = buildPratyantardashas(adPlanet, currentAdStart, adEnd);

    const adPeriod: AntardashaPeriod = Object.freeze({
      planet: adPlanet,
      start: currentAdStart.toISOString(),
      end: adEnd.toISOString(),
      pratyantardashas
    });

    antardashas.push(adPeriod);
    currentAdStart = adEnd;
  }

  return Object.freeze(antardashas);
}

function buildPratyantardashasAnchored(
  adPlanet: Planet,
  fullAdStart: Date,
  fullAdDurationMs: number,
  windowStart: Date,
  windowEnd: Date
): readonly PratyantardashaPeriod[] {
  if (fullAdDurationMs <= 0 || windowEnd.getTime() <= windowStart.getTime()) {
    return Object.freeze([]);
  }

  const fullAdEnd = new Date(fullAdStart.getTime() + fullAdDurationMs);
  const pdSequence = rotateDashaSequence(adPlanet);
  const pratyantardashas: PratyantardashaPeriod[] = [];
  let currentPdStart = new Date(fullAdStart.getTime());

  for (let i = 0; i < pdSequence.length; i++) {
    if (currentPdStart.getTime() >= windowEnd.getTime()) break;

    const pdPlanet = pdSequence[i];
    const calculatedPdEnd = i === pdSequence.length - 1
      ? new Date(fullAdEnd.getTime())
      : new Date(currentPdStart.getTime() + fullAdDurationMs * (DASHA_YEARS[pdPlanet] / 120));
    const fullPdEnd = new Date(Math.min(calculatedPdEnd.getTime(), fullAdEnd.getTime()));
    const pdStart = new Date(Math.max(currentPdStart.getTime(), windowStart.getTime()));
    const pdEnd = new Date(Math.min(fullPdEnd.getTime(), windowEnd.getTime()));

    if (pdEnd.getTime() > pdStart.getTime()) {
      pratyantardashas.push(Object.freeze({
        planet: pdPlanet,
        start: pdStart.toISOString(),
        end: pdEnd.toISOString()
      }));
    }
    currentPdStart = fullPdEnd;
  }

  return Object.freeze(pratyantardashas);
}

function buildAntardashasAnchored(
  mdPlanet: Planet,
  fullMdStart: Date,
  fullMdDurationMs: number,
  windowStart: Date,
  windowEnd: Date
): readonly AntardashaPeriod[] {
  if (fullMdDurationMs <= 0 || windowEnd.getTime() <= windowStart.getTime()) {
    return Object.freeze([]);
  }

  const fullMdEnd = new Date(fullMdStart.getTime() + fullMdDurationMs);
  const adSequence = rotateDashaSequence(mdPlanet);
  const antardashas: AntardashaPeriod[] = [];
  let currentAdStart = new Date(fullMdStart.getTime());

  for (let i = 0; i < adSequence.length; i++) {
    if (currentAdStart.getTime() >= windowEnd.getTime()) break;

    const adPlanet = adSequence[i];
    const calculatedAdEnd = i === adSequence.length - 1
      ? new Date(fullMdEnd.getTime())
      : new Date(currentAdStart.getTime() + fullMdDurationMs * (DASHA_YEARS[adPlanet] / 120));
    const fullAdEnd = new Date(Math.min(calculatedAdEnd.getTime(), fullMdEnd.getTime()));
    const adStart = new Date(Math.max(currentAdStart.getTime(), windowStart.getTime()));
    const adEnd = new Date(Math.min(fullAdEnd.getTime(), windowEnd.getTime()));

    if (adEnd.getTime() > adStart.getTime()) {
      const fullAdDurationMs = fullAdEnd.getTime() - currentAdStart.getTime();
      const pratyantardashas = buildPratyantardashasAnchored(
        adPlanet,
        currentAdStart,
        fullAdDurationMs,
        adStart,
        adEnd
      );

      antardashas.push(Object.freeze({
        planet: adPlanet,
        start: adStart.toISOString(),
        end: adEnd.toISOString(),
        pratyantardashas
      }));
    }

    currentAdStart = fullAdEnd;
  }

  return Object.freeze(antardashas);
}

/**
 * Calculates birth-anchored Vimshottari Dasha timeline.
 */
export function calculateVimshottari(input: VimshottariInput): VimshottariTimeline {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Input is required and must be an object.');
  }

  if (!input.birthDateTime || typeof input.birthDateTime !== 'string') {
    throw new TypeError('birthDateTime must be an ISO-8601 date-time with Z or an explicit UTC offset.');
  }

  const birthDate = parseIsoDateTime(input.birthDateTime, 'birthDateTime');

  if (
    typeof input.moonSiderealLongitude !== 'number' ||
    isNaN(input.moonSiderealLongitude) ||
    !isFinite(input.moonSiderealLongitude)
  ) {
    throw new TypeError('moonSiderealLongitude must be a finite number.');
  }

  let untilDate: Date;
  if (input.until !== undefined) {
    if (typeof input.until !== 'string') {
      throw new TypeError('until must be an ISO-8601 date-time with Z or an explicit UTC offset when provided.');
    }
    untilDate = parseIsoDateTime(input.until, 'until');
    if (untilDate.getTime() < birthDate.getTime()) {
      throw new TypeError('until horizon cannot be before birthDateTime.');
    }
  } else {
    untilDate = addFractionalYears(birthDate, 120);
  }

  const normLong = normalizeDegrees(input.moonSiderealLongitude);
  const nakResult = calculateNakshatra(normLong);
  const nakMeta = NAKSHATRAS_METADATA.find(n => n.nakshatra === nakResult.nakshatra) as any;
  if (!nakMeta || !nakMeta.lord) {
    throw new TypeError(`Nakshatra metadata not found for ${nakResult.nakshatra}.`);
  }

  const nakshatraName = nakMeta.englishName;
  const nakshatraLord = nakMeta.lord;

  const nakSpan = 40 / 3; // 13.333333333333334 degrees
  const offset = normLong - (nakMeta.number - 1) * nakSpan;

  let nakshatraProgress = offset / nakSpan;
  // Boundary convention: exact boundary belongs to NEXT Nakshatra.
  // Only snap to 0 when actually at or past the next boundary (calculateNakshatra should have placed it there).
  // Do not snap genuinely positive values down to 0 solely for being within 1e-9 of boundary.
  if (nakshatraProgress < 0) {
    nakshatraProgress = 0;
  } else if (nakshatraProgress > 1) {
    nakshatraProgress = 1;
  }

  let remainingFraction = 1 - nakshatraProgress;
  // Apply same boundary convention: only snap to 0 when actually at/past boundary.
  if (remainingFraction < 0) {
    remainingFraction = 0;
  } else if (remainingFraction > 1) {
    remainingFraction = 1;
  }

  const mahadashas: MahadashaPeriod[] = [];
  const rotatedSeq = rotateDashaSequence(nakshatraLord);

  let currentStart = new Date(birthDate.getTime());
  let isFirstMd = true;

  while (currentStart.getTime() < untilDate.getTime()) {
    let emittedInSequence = false;

    for (const mdPlanet of rotatedSeq) {
      if (currentStart.getTime() >= untilDate.getTime()) break;

      const isBirthLordCandidate = isFirstMd && mdPlanet === nakshatraLord;
      const fraction = isBirthLordCandidate ? remainingFraction : 1.0;
      // Only the birth-Nakshatra lord's first candidate receives the birth balance,
      // even if millisecond precision makes that candidate unrepresentable.
      if (isBirthLordCandidate) {
        isFirstMd = false;
      }

      const fullYears = DASHA_YEARS[mdPlanet] * fraction;
      const isPartialFirstMd = isBirthLordCandidate && mahadashas.length === 0;
      let fullMdStart: Date | undefined;
      let fullMdDurationMs: number | undefined;
      let mdEnd: Date;
      let isHorizonClipped = false;

      if (isPartialFirstMd) {
        const fullMdYears = DASHA_YEARS[mdPlanet];
        fullMdStart = addFractionalYears(
          birthDate,
          -nakshatraProgress * fullMdYears
        );
        const fullMdEnd = addFractionalYears(fullMdStart, fullMdYears);
        fullMdDurationMs = fullMdEnd.getTime() - fullMdStart.getTime();
        mdEnd = new Date(Math.min(fullMdEnd.getTime(), untilDate.getTime()));
      } else {
        const fullMdEnd = addFractionalYears(currentStart, fullYears);
        isHorizonClipped = fullMdEnd.getTime() > untilDate.getTime();
        mdEnd = fullMdEnd;
        if (isHorizonClipped) {
          mdEnd = new Date(untilDate.getTime());
        }
        if (isHorizonClipped) {
          fullMdStart = new Date(currentStart.getTime());
          const fullMdEndFromStart = addFractionalYears(fullMdStart, DASHA_YEARS[mdPlanet]);
          fullMdDurationMs = fullMdEndFromStart.getTime() - fullMdStart.getTime();
        }
      }

      // Precision policy invariant: prefer a contiguous, millisecond-representable timeline over
      // representing an unrepresentable birth-lord remainder. ECMAScript Date truncates to
      // milliseconds, so an interval whose end is not after its start is skipped; the next
      // representable period begins the timeline (which is empty only when the horizon is birth).
      if (mdEnd.getTime() <= currentStart.getTime()) {
        continue;
      }

      let antardashas: readonly AntardashaPeriod[];
      if (isPartialFirstMd && fullMdStart && fullMdDurationMs !== undefined) {
        antardashas = buildAntardashasAnchored(
          mdPlanet,
          fullMdStart,
          fullMdDurationMs,
          currentStart,
          mdEnd
        );
      } else if (isHorizonClipped && fullMdStart && fullMdDurationMs !== undefined) {
        antardashas = buildAntardashasAnchored(
          mdPlanet,
          fullMdStart,
          fullMdDurationMs,
          currentStart,
          mdEnd
        );
      } else {
        antardashas = buildAntardashas(mdPlanet, currentStart, mdEnd);
      }

      const mdPeriod: MahadashaPeriod = Object.freeze({
        planet: mdPlanet,
        start: currentStart.toISOString(),
        end: mdEnd.toISOString(),
        antardashas
      });

      mahadashas.push(mdPeriod);
      currentStart = mdEnd;
      emittedInSequence = true;
    }

    // Date precision can make every remaining-fraction candidate zero-length near a boundary.
    // Stop rather than repeating the same sequence without advancing currentStart.
    if (!emittedInSequence) {
      break;
    }
  }

  const timeline: VimshottariTimeline = Object.freeze({
    birthDateTime: birthDate.toISOString(),
    moonSiderealLongitude: normLong,
    nakshatra: nakshatraName,
    nakshatraLord,
    nakshatraProgress,
    remainingFraction,
    mahadashas: Object.freeze(mahadashas)
  });

  return timeline;
}

/**
 * Returns the active Mahadasha, Antardasha, and Pratyantardasha state at a target date.
 */
export function getActiveDasha(
  timeline: VimshottariTimeline,
  at: string | Date
): ActiveDashaState | null {
  if (!timeline || !timeline.mahadashas || !Array.isArray(timeline.mahadashas)) {
    throw new TypeError('Valid VimshottariTimeline is required.');
  }

  validateTimelineStructure(timeline);

  if (!at) {
    throw new TypeError('at timestamp is required.');
  }

  const atDate = typeof at === 'string' ? new Date(at) : at;
  if (!(atDate instanceof Date) || isNaN(atDate.getTime())) {
    throw new TypeError('Invalid date for at parameter.');
  }

  const targetTime = atDate.getTime();

  for (const md of timeline.mahadashas) {
    const mdStart = new Date(md.start).getTime();
    const mdEnd = new Date(md.end).getTime();

    if (targetTime >= mdStart && targetTime < mdEnd) {
      for (const ad of md.antardashas) {
        const adStart = new Date(ad.start).getTime();
        const adEnd = new Date(ad.end).getTime();

        if (targetTime >= adStart && targetTime < adEnd) {
          for (const pd of ad.pratyantardashas) {
            const pdStart = new Date(pd.start).getTime();
            const pdEnd = new Date(pd.end).getTime();

            if (targetTime >= pdStart && targetTime < pdEnd) {
              return Object.freeze({
                mahadasha: md,
                antardasha: ad,
                pratyantardasha: pd
              });
            }
          }
        }
      }
    }
  }

  return null;
}

type TimelinePeriod = {
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
};

function validatePlanetaryOrder(
  periods: readonly TimelinePeriod[],
  canonicalRotation: readonly Planet[],
  label: string,
  cyclic: boolean
): void {
  if (periods.length === 0) {
    return;
  }

  const firstPlanetIndex = canonicalRotation.indexOf(periods[0].planet);
  if (firstPlanetIndex < 0) {
    throw new TypeError(`Invalid Vimshottari timeline: ${label}[0] is not in its canonical planetary rotation.`);
  }

  for (let index = 0; index < periods.length; index++) {
    const rotationIndex = cyclic
      ? (firstPlanetIndex + index) % canonicalRotation.length
      : firstPlanetIndex + index;
    if (
      rotationIndex >= canonicalRotation.length ||
      !canonicalRotation.includes(periods[index].planet) ||
      periods[index].planet !== canonicalRotation[rotationIndex]
    ) {
      throw new TypeError(`Invalid Vimshottari timeline: ${label} planets do not follow their canonical Vimshottari order.`);
    }
  }
}

function validateTimelineStructure(timeline: VimshottariTimeline): void {
  if (
    typeof timeline.birthDateTime !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(timeline.birthDateTime)
  ) {
    throw new TypeError('Invalid Vimshottari timeline: birthDateTime must be a parseable ISO instant.');
  }
  try {
    parseIsoDateTime(timeline.birthDateTime, 'birthDateTime');
  } catch {
    throw new TypeError('Invalid Vimshottari timeline: birthDateTime must be a parseable ISO instant.');
  }
  if (
    typeof timeline.moonSiderealLongitude !== 'number' ||
    !Number.isFinite(timeline.moonSiderealLongitude) ||
    timeline.moonSiderealLongitude < 0 ||
    timeline.moonSiderealLongitude >= 360
  ) {
    throw new TypeError('Invalid Vimshottari timeline: moonSiderealLongitude must be finite and within [0,360).');
  }
  if (
    typeof timeline.nakshatraProgress !== 'number' ||
    !Number.isFinite(timeline.nakshatraProgress) ||
    timeline.nakshatraProgress < 0 ||
    timeline.nakshatraProgress > 1
  ) {
    throw new TypeError('Invalid Vimshottari timeline: nakshatraProgress must be finite and within [0,1].');
  }
  if (
    typeof timeline.remainingFraction !== 'number' ||
    !Number.isFinite(timeline.remainingFraction) ||
    timeline.remainingFraction < 0 ||
    timeline.remainingFraction > 1
  ) {
    throw new TypeError('Invalid Vimshottari timeline: remainingFraction must be finite and within [0,1].');
  }
  if (!DASHA_SEQUENCE.includes(timeline.nakshatraLord)) {
    throw new TypeError('Invalid Vimshottari timeline: nakshatraLord is invalid.');
  }

  const validatePeriods = (
    periods: readonly TimelinePeriod[],
    label: string,
    parentWindow?: { start: number; end: number }
  ): void => {
    if (!Array.isArray(periods)) {
      throw new TypeError(`Invalid Vimshottari timeline: ${label} periods must be an array.`);
    }
    if (periods.length === 0) {
      return;
    }

    let previousEnd = Number.NEGATIVE_INFINITY;
    for (const [index, period] of periods.entries()) {
      const periodLabel = `${label}[${index}]`;
      if (!period || !DASHA_SEQUENCE.includes(period.planet)) {
        throw new TypeError(`Invalid Vimshottari timeline: ${periodLabel} has an invalid planet.`);
      }

      const start = typeof period.start === 'string' ? Date.parse(period.start) : NaN;
      const end = typeof period.end === 'string' ? Date.parse(period.end) : NaN;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new TypeError(`Invalid Vimshottari timeline: ${periodLabel} must have a positive-length [start,end) interval.`);
      }
      if (start < previousEnd) {
        throw new TypeError(`Invalid Vimshottari timeline: ${label} periods must be ordered and non-overlapping.`);
      }
      if (index > 0 && start !== previousEnd) {
        throw new TypeError(`Invalid Vimshottari timeline: ${label} periods must be contiguous except for the final horizon-clipped period.`);
      }
      if (parentWindow && (start < parentWindow.start || end > parentWindow.end)) {
        throw new TypeError(`Invalid Vimshottari timeline: ${periodLabel} must be contained within its parent period.`);
      }

      previousEnd = end;
    }
  };

  validatePeriods(timeline.mahadashas, 'mahadashas');
  validatePlanetaryOrder(
    timeline.mahadashas,
    rotateDashaSequence(timeline.nakshatraLord),
    'mahadashas',
    true
  );
  for (const [mdIndex, md] of timeline.mahadashas.entries()) {
    const mdWindow = { start: Date.parse(md.start), end: Date.parse(md.end) };
    if (!Array.isArray(md.antardashas)) {
      throw new TypeError(`Invalid Vimshottari timeline: mahadashas[${mdIndex}].antardashas periods must be an array.`);
    }
    if (mdWindow.end > mdWindow.start && md.antardashas.length === 0) {
      throw new TypeError(`Invalid Vimshottari timeline: mahadashas[${mdIndex}] must contain at least one Antardasha.`);
    }
    const adLabel = `mahadashas[${mdIndex}].antardashas`;
    validatePeriods(md.antardashas, adLabel, mdWindow);
    validatePlanetaryOrder(md.antardashas, rotateDashaSequence(md.planet), adLabel, false);
    for (const [adIndex, ad] of md.antardashas.entries()) {
      const adWindow = { start: Date.parse(ad.start), end: Date.parse(ad.end) };
      if (!Array.isArray(ad.pratyantardashas)) {
        throw new TypeError(`Invalid Vimshottari timeline: mahadashas[${mdIndex}].antardashas[${adIndex}].pratyantardashas periods must be an array.`);
      }
      if (adWindow.end > adWindow.start && ad.pratyantardashas.length === 0) {
        throw new TypeError(`Invalid Vimshottari timeline: mahadashas[${mdIndex}].antardashas[${adIndex}] must contain at least one Pratyantardasha.`);
      }
      const pdLabel = `mahadashas[${mdIndex}].antardashas[${adIndex}].pratyantardashas`;
      validatePeriods(ad.pratyantardashas, pdLabel, adWindow);
      validatePlanetaryOrder(ad.pratyantardashas, rotateDashaSequence(ad.planet), pdLabel, false);
    }
  }
}
