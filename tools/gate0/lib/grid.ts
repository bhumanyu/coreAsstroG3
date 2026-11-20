/**
 * Independent grid-semantics evaluator for Gate-0 constructed vectors.
 *
 * This module re-implements the DOCUMENTED deterministic grids used by the
 * boundary/house/varga/dasha fixture tracks. It is deliberately independent of
 * src/engine/*: expected values for constructed-longitude fixtures come from
 * this evaluator (sourceType INDEPENDENT_CALCULATION), never from engine
 * output. The rules implemented are the standard published conventions:
 *
 *  - Zodiac signs: 12 x 30 deg, half-open [start, start+30).
 *  - Nakshatras: 27 x 13 deg 20' (40/3 deg), half-open; an exact boundary
 *    belongs to the NEXT nakshatra (pada 1).
 *  - Padas: 4 x 3 deg 20' (10/3 deg) per nakshatra, half-open; an exact
 *    boundary belongs to the NEXT pada.
 *  - D9 (navamsa): 9 divisions of 3 deg 20' per sign; division m of a sign
 *    starts at sign-start + m*(10/3) deg. Start sign: movable -> same sign,
 *    fixed -> 9th sign, dual -> 5th sign. Exact division boundary belongs to
 *    the next navamsa (half-open).
 *  - D10 (dasamsa): 10 divisions of 3 deg per sign; odd signs start from
 *    themselves, even signs from the 9th sign. Exact boundary -> next dasa.
 *  - Whole-sign houses: house = ((targetNum - refNum) mod 12) + 1.
 *  - Vimshottari: canonical 9-planet sequence; year = 365.25 days (the
 *    year-length convention recorded in fixture conventions); first MD is
 *    the Moon's nakshatra lord running for the remaining nakshatra fraction.
 *
 * A 1e-12 deg epsilon is added before floor() purely to make exact-boundary
 * floating-point representations deterministic (the same FP-representation
 * tolerance the engine documents in calculateNakshatra); it is ~6 orders of
 * magnitude below the smallest policy epsilon (1e-6 deg) and never affects
 * EPSILON_BEFORE/AFTER vectors at 1e-5 deg.
 */
import { normDeg } from './util.ts';

export const GRID_EPSILON_DEG = 1e-12;
export const NAKSHATRA_SPAN_DEG = 360 / 27; // 13 deg 20'
export const PADA_SPAN_DEG = 360 / 108; // 3 deg 20'
export const SIGN_SPAN_DEG = 30;

export const SIGNS = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'
] as const;
export type SignName = (typeof SIGNS)[number];

export const NAKSHATRA_DEFS = [
  { name: 'ASHWINI', english: 'Ashwini', lord: 'KETU' },
  { name: 'BHARANI', english: 'Bharani', lord: 'VENUS' },
  { name: 'KRITTIKA', english: 'Krittika', lord: 'SUN' },
  { name: 'ROHINI', english: 'Rohini', lord: 'MOON' },
  { name: 'MRIGASHIRA', english: 'Mrigashira', lord: 'MARS' },
  { name: 'ARDRA', english: 'Ardra', lord: 'RAHU' },
  { name: 'PUNARVASU', english: 'Punarvasu', lord: 'JUPITER' },
  { name: 'PUSHYA', english: 'Pushya', lord: 'SATURN' },
  { name: 'ASHLESHA', english: 'Ashlesha', lord: 'MERCURY' },
  { name: 'MAGHA', english: 'Magha', lord: 'KETU' },
  { name: 'PURVA_PHALGUNI', english: 'Purva Phalguni', lord: 'VENUS' },
  { name: 'UTTARA_PHALGUNI', english: 'Uttara Phalguni', lord: 'SUN' },
  { name: 'HASTA', english: 'Hasta', lord: 'MOON' },
  { name: 'CHITRA', english: 'Chitra', lord: 'MARS' },
  { name: 'SWATI', english: 'Swati', lord: 'RAHU' },
  { name: 'VISHAKHA', english: 'Vishakha', lord: 'JUPITER' },
  { name: 'ANURADHA', english: 'Anuradha', lord: 'SATURN' },
  { name: 'JYESHTHA', english: 'Jyeshtha', lord: 'MERCURY' },
  { name: 'MULA', english: 'Mula', lord: 'KETU' },
  { name: 'PURVA_ASHADHA', english: 'Purva Ashadha', lord: 'VENUS' },
  { name: 'UTTARA_ASHADHA', english: 'Uttara Ashadha', lord: 'SUN' },
  { name: 'SHRAVANA', english: 'Shravana', lord: 'MOON' },
  { name: 'DHANISHTA', english: 'Dhanishta', lord: 'MARS' },
  { name: 'SHATABHISHA', english: 'Shatabhisha', lord: 'RAHU' },
  { name: 'PURVA_BHADRAPADA', english: 'Purva Bhadrapada', lord: 'JUPITER' },
  { name: 'UTTARA_BHADRAPADA', english: 'Uttara Bhadrapada', lord: 'SATURN' },
  { name: 'REVATI', english: 'Revati', lord: 'MERCURY' }
] as const;
export type NakName = (typeof NAKSHATRA_DEFS)[number]['name'];
export type PlanetName = (typeof NAKSHATRA_DEFS)[number]['lord'];

export function signAt(longitudeDeg: number): SignName {
  return SIGNS[Math.floor(normDeg(longitudeDeg) / SIGN_SPAN_DEG) % 12];
}

export function signIndexAt(longitudeDeg: number): number {
  return Math.floor(normDeg(longitudeDeg) / SIGN_SPAN_DEG) % 12;
}

/** Global pada index 0..107; nakshatra = floor(padaIndex/4), pada = mod+1. */
export function padaIndexAt(longitudeDeg: number): number {
  const norm = normDeg(longitudeDeg);
  const idx = Math.floor((norm + GRID_EPSILON_DEG) / PADA_SPAN_DEG);
  return idx >= 108 ? 0 : idx;
}

export function nakshatraAt(longitudeDeg: number): { index: number; def: (typeof NAKSHATRA_DEFS)[number] } {
  const p = padaIndexAt(longitudeDeg);
  const index = Math.floor(p / 4);
  return { index, def: NAKSHATRA_DEFS[index] };
}

export function padaAt(longitudeDeg: number): { nakIndex: number; nak: NakName; pada: 1 | 2 | 3 | 4 } {
  const p = padaIndexAt(longitudeDeg);
  const nakIndex = Math.floor(p / 4);
  const pada = ((p % 4) + 1) as 1 | 2 | 3 | 4;
  return { nakIndex, nak: NAKSHATRA_DEFS[nakIndex].name, pada };
}

const MODALITY = ['MOVABLE', 'FIXED', 'DUAL'] as const; // Aries movable, Taurus fixed, Gemini dual, ...

/** D9 divisional longitude per documented navamsa grid semantics. */
export function vargaD9(longitudeDeg: number): number {
  const norm = normDeg(longitudeDeg);
  const signIndex = Math.floor(norm / SIGN_SPAN_DEG);
  const posInSign = norm % SIGN_SPAN_DEG;
  const navPos = posInSign * 3 / 10; // 0..9 navamsa units
  const navPart = Math.floor(navPos + GRID_EPSILON_DEG); // 0..8
  const modality = MODALITY[signIndex % 3];
  const startSign = modality === 'MOVABLE' ? signIndex
    : modality === 'FIXED' ? (signIndex + 8) % 12
    : (signIndex + 4) % 12;
  const targetSign = (startSign + navPart) % 12;
  const inner = (navPos - navPart) * 30;
  return normDeg(targetSign * 30 + inner);
}

/** D10 divisional longitude per documented dasamsa grid semantics. */
export function vargaD10(longitudeDeg: number): number {
  const norm = normDeg(longitudeDeg);
  const signIndex = Math.floor(norm / SIGN_SPAN_DEG);
  const posInSign = norm % SIGN_SPAN_DEG;
  const dasPart = Math.floor(posInSign / 3 + GRID_EPSILON_DEG); // 0..9
  const isOddSign = signIndex % 2 === 0; // Aries(0) is the 1st, odd, sign
  const startSign = isOddSign ? signIndex : (signIndex + 8) % 12;
  const targetSign = (startSign + dasPart) % 12;
  const inner = (posInSign % 3) * 10;
  return normDeg(targetSign * 30 + inner);
}

export function wholeSignHouse(referenceSign: SignName, targetSign: SignName): number {
  const refNum = SIGNS.indexOf(referenceSign) + 1;
  const tgtNum = SIGNS.indexOf(targetSign) + 1;
  return (((tgtNum - refNum) % 12) + 12) % 12 + 1;
}

/* ------------------------------------------------------------------ */
/* Vimshottari (independent implementation of the standard rules)     */
/* ------------------------------------------------------------------ */

export const VIMSHOTTARI_YEAR_DAYS = 365.25;
export const MS_PER_DAY = 86_400_000;
export const DASHA_YEARS: Readonly<Record<PlanetName, number>> = {
  KETU: 7, VENUS: 20, SUN: 6, MOON: 10, MARS: 7,
  RAHU: 18, JUPITER: 16, SATURN: 19, MERCURY: 17
};
/** Canonical Vimshottari Mahadasha sequence. */
export const DASHA_SEQUENCE: readonly PlanetName[] = [
  'KETU', 'VENUS', 'SUN', 'MOON', 'MARS', 'RAHU', 'JUPITER', 'SATURN', 'MERCURY'
];

export interface VimshottariAnchor {
  readonly nakshatra: NakName;
  readonly nakshatraEnglish: string;
  readonly nakshatraLord: PlanetName;
  readonly nakshatraProgress: number;
  readonly remainingFraction: number;
  readonly firstMahadashaLord: PlanetName;
  readonly firstMahadashaStartMs: number;
  readonly firstMahadashaEndMs: number;
}

/**
 * Compute the birth-anchored first-Mahadasha anchor for a locked Moon
 * sidereal longitude. `birthMs` is the UTC epoch-ms of the birth instant.
 */
export function vimshottariAnchor(moonSiderealLongitudeDeg: number, birthMs: number): VimshottariAnchor {
  const norm = normDeg(moonSiderealLongitudeDeg);
  const { def } = nakshatraAt(norm);
  const nakStart = NAKSHATRA_DEFS.indexOf(def) * NAKSHATRA_SPAN_DEG;
  let progress = (norm - nakStart) / NAKSHATRA_SPAN_DEG;
  if (progress < 0) progress = 0;
  if (progress > 1) progress = 1;
  const remaining = 1 - progress;
  const lord = def.lord;
  const balanceYears = DASHA_YEARS[lord] * remaining;
  const startMs = birthMs;
  const endMs = birthMs + balanceYears * VIMSHOTTARI_YEAR_DAYS * MS_PER_DAY;
  return {
    nakshatra: def.name,
    nakshatraEnglish: def.english,
    nakshatraLord: lord,
    nakshatraProgress: progress,
    remainingFraction: remaining,
    firstMahadashaLord: lord,
    firstMahadashaStartMs: startMs,
    firstMahadashaEndMs: endMs
  };
}
