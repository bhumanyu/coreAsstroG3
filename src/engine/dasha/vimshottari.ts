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
 * 1 Vimshottari year = 365.25 days; this materially affects MD/AD/PD boundaries and must match the chosen reference software/source.
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
 */
export function normalizeDegrees(degree: number): number {
  if (typeof degree !== 'number' || isNaN(degree) || !isFinite(degree)) {
    throw new TypeError('Longitude must be a finite number.');
  }
  let norm = degree % 360;
  if (norm < 0) {
    norm += 360;
  }
  if (Math.abs(norm - 360) < 1e-9) {
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
  return new Date(date.getTime() + ms);
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

/**
 * Calculates birth-anchored Vimshottari Dasha timeline.
 */
export function calculateVimshottari(input: VimshottariInput): VimshottariTimeline {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Input is required and must be an object.');
  }

  if (!input.birthDateTime || typeof input.birthDateTime !== 'string') {
    throw new TypeError('birthDateTime must be a valid ISO date string.');
  }

  const birthDate = new Date(input.birthDateTime);
  if (isNaN(birthDate.getTime())) {
    throw new TypeError('birthDateTime must be a valid ISO date string.');
  }

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
      throw new TypeError('until must be an ISO date string when provided.');
    }
    untilDate = new Date(input.until);
    if (isNaN(untilDate.getTime())) {
      throw new TypeError('until must be a valid ISO date string when provided.');
    }
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
  const offset = normLong - (nakMeta.startDegree ?? 0);

  let nakshatraProgress = offset / nakSpan;
  if (nakshatraProgress < 0 || Math.abs(nakshatraProgress) < 1e-9) {
    nakshatraProgress = 0;
  } else if (nakshatraProgress > 1 || Math.abs(nakshatraProgress - 1) < 1e-9) {
    nakshatraProgress = 1;
  }

  let remainingFraction = 1 - nakshatraProgress;
  if (remainingFraction < 0 || Math.abs(remainingFraction) < 1e-9) {
    remainingFraction = 0;
  } else if (remainingFraction > 1 || Math.abs(remainingFraction - 1) < 1e-9) {
    remainingFraction = 1;
  }

  const mahadashas: MahadashaPeriod[] = [];
  const rotatedSeq = rotateDashaSequence(nakshatraLord);

  let currentStart = new Date(birthDate.getTime());
  let isFirstMd = true;

  while (currentStart.getTime() < untilDate.getTime()) {
    for (const mdPlanet of rotatedSeq) {
      if (currentStart.getTime() >= untilDate.getTime()) break;

      const fraction = isFirstMd ? remainingFraction : 1.0;
      isFirstMd = false;

      const fullYears = DASHA_YEARS[mdPlanet] * fraction;
      let mdEnd = addFractionalYears(currentStart, fullYears);

      if (mdEnd.getTime() > untilDate.getTime()) {
        mdEnd = new Date(untilDate.getTime());
      }

      const antardashas = buildAntardashas(mdPlanet, currentStart, mdEnd);

      const mdPeriod: MahadashaPeriod = Object.freeze({
        planet: mdPlanet,
        start: currentStart.toISOString(),
        end: mdEnd.toISOString(),
        antardashas
      });

      mahadashas.push(mdPeriod);
      currentStart = mdEnd;
    }
  }

  const timeline: VimshottariTimeline = Object.freeze({
    birthDateTime: birthDate.toISOString(),
    moonSiderealLongitude: normLong,
    nakshatra: nakshatraName,
    nakshatraLord,
    nakshatraProgress: Number(nakshatraProgress.toFixed(10)),
    remainingFraction: Number(remainingFraction.toFixed(10)),
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
