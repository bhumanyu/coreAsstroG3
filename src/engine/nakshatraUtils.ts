import { Nakshatra, Pada, NakshatraResult } from '../types';
import { NAKSHATRAS_METADATA } from '../data/astroData';

/**
 * Normalizes an angular degree into the range [0°, 360°).
 * Boundary convention: exact 360° wraps to 0° (circular equivalence).
 * Does NOT snap near-boundary values to 0 - Nakshatra boundaries are handled separately.
 */
export function normalizeDegree(degree: number): number {
  let normalized = degree % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  if (normalized === 0) {
    return 0;
  }
  return normalized;
}

/**
 * Calculates the Nakshatra and Pada for a given ecliptic longitude.
 * Boundary convention: an exact Nakshatra boundary belongs to the NEXT Nakshatra.
 */
export function calculateNakshatra(longitude: number): NakshatraResult {
  const norm = normalizeDegree(longitude);
  const span = 40 / 3; // 13.333333333333334 degrees per nakshatra

  // The 1e-12° epsilon is a floating-point boundary-representation tolerance, not astronomical uncertainty.
  // Values within epsilon immediately below a boundary are intentionally assigned to the next Nakshatra.
  let nakshatraIndex = Math.floor((norm + 1e-12) / span);
  if (nakshatraIndex >= 27) nakshatraIndex = 26;

  const nakshatraMeta = NAKSHATRAS_METADATA[nakshatraIndex] as any;
  const startDegree = nakshatraMeta?.startDegree ?? (nakshatraIndex * span);
  const offset = norm - startDegree;
  const padaLength = span / 4;

  let padaIndex = Math.floor((offset + 1e-12) / padaLength);
  if (padaIndex < 0) padaIndex = 0;
  if (padaIndex >= 4) padaIndex = 3;

  const padas = [Pada.FIRST, Pada.SECOND, Pada.THIRD, Pada.FOURTH];
  return {
    nakshatra: nakshatraMeta?.nakshatra ?? nakshatraMeta?.name ?? nakshatraMeta,
    pada: padas[padaIndex],
    padaNumber: padaIndex + 1
  } as any;
}
