import {
  Planet,
  Sign,
  ChartType,
  Relationship,
  Modality
} from '../types';
import {
  SIGNS_METADATA,
  SIGNS_ORDER,
  NATURAL_FRIENDS,
  NATURAL_ENEMIES
} from '../data/astroData';
import { normalizeDegree } from './nakshatraUtils';

/**
 * Calculates the Zodiac Sign for a given ecliptic longitude.
 */
export function calculateSign(longitude: number): Sign {
  const norm = normalizeDegree(longitude);
  const index = Math.floor(norm / 30) % 12;
  return SIGNS_ORDER[index];
}

/**
 * Calculates natural relationship between two planets.
 */
export function calculateNaturalRelationship(planet: Planet, towards: Planet): Relationship {
  if (planet === towards) return Relationship.FRIEND;

  const friends = NATURAL_FRIENDS[planet] || [];
  if (friends.includes(towards)) return Relationship.FRIEND;

  const enemies = NATURAL_ENEMIES[planet] || [];
  if (enemies.includes(towards)) return Relationship.ENEMY;

  return Relationship.NEUTRAL;
}

/**
 * Divisional Chart (Varga) Longitude Generators
 */
export function getDivisionalLongitude(longitude: number, chartType: ChartType): number {
  const norm = normalizeDegree(longitude);
  const signIndex = Math.floor(norm / 30); // 0..11
  const posInSign = norm % 30; // 0..30

  if (chartType === ChartType.RASI) {
    return norm;
  }

  if (chartType === ChartType.DREKKANA) {
    // D3: 10° divisions (3 per sign)
    const drekkanaPart = Math.floor(posInSign / 10); // 0, 1, or 2
    let targetSignIndex = signIndex;
    if (drekkanaPart === 1) targetSignIndex = (signIndex + 4) % 12; // 5th sign
    if (drekkanaPart === 2) targetSignIndex = (signIndex + 8) % 12; // 9th sign
    const innerDegree = (posInSign % 10) * 3;
    return normalizeDegree(targetSignIndex * 30 + innerDegree);
  }

  if (chartType === ChartType.NAVAMSA) {
    // D9: 3°20' divisions (9 per sign)
    const navamsaSpan = 10 / 3;
    const navPart = Math.floor(posInSign / navamsaSpan); // 0..8
    let startSignIndex = 0;
    const modality = SIGNS_METADATA[SIGNS_ORDER[signIndex]].modality;

    if (modality === Modality.MOVABLE) {
      startSignIndex = signIndex; // Movable sign: starts from itself
    } else if (modality === Modality.FIXED) {
      startSignIndex = (signIndex + 8) % 12; // Fixed sign: starts from 9th sign
    } else {
      startSignIndex = (signIndex + 4) % 12; // Dual sign: starts from 5th sign
    }

    const targetSignIndex = (startSignIndex + navPart) % 12;
    const innerDegree = (posInSign % navamsaSpan) * 9;
    return normalizeDegree(targetSignIndex * 30 + innerDegree);
  }

  if (chartType === ChartType.DASAMSA) {
    // D10: 3° divisions (10 per sign)
    const dasPart = Math.floor(posInSign / 3); // 0..9
    let startSignIndex = 0;
    const isOddSign = (signIndex % 2) === 0; // 0 = Aries (odd sign 1st)

    if (isOddSign) {
      startSignIndex = signIndex; // Odd sign starts from itself
    } else {
      startSignIndex = (signIndex + 8) % 12; // Even sign starts from 9th sign
    }

    const targetSignIndex = (startSignIndex + dasPart) % 12;
    const innerDegree = (posInSign % 3) * 10;
    return normalizeDegree(targetSignIndex * 30 + innerDegree);
  }

  return norm;
}

/**
 * Calculates whole-sign house position (1..12) for a target sign relative to a reference sign.
 * 
 * Modular 12-house arithmetic:
 * offset = floorMod(targetSignNumber - referenceSignNumber, 12)
 * house = offset + 1
 */
export function calculateWholeSignHouse(referenceSign: Sign, transitSign: Sign): number {
  const refNum = SIGNS_METADATA[referenceSign]?.number ?? 1;
  const transitNum = SIGNS_METADATA[transitSign]?.number ?? 1;

  const offset = ((transitNum - refNum) % 12 + 12) % 12;
  return offset + 1;
}
