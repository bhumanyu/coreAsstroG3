import {
  Planet,
  Sign,
  AspectType,
  TransitAspect,
  TransitInput,
  TransitPosition,
  TransitHousePosition,
  TransitResult,
  TransitAnalysis
} from '../types';
import {
  calculateSign,
  calculateNakshatra,
  normalizeDegree
} from './astroEngine';
import { SIGNS_METADATA, SIGNS_ORDER } from '../data/astroData';

export interface DrishtiRule {
  offset: number; // 0..11 house offset
  type: AspectType;
  label: string;
}

/**
 * Returns the Graha Drishti aspect rules (0-indexed house offsets and aspect types) for a planet.
 * - Mars: 4th (offset 3), 7th (offset 6), 8th (offset 7)
 * - Jupiter: 5th (offset 4), 7th (offset 6), 9th (offset 8)
 * - Saturn: 3rd (offset 2), 7th (offset 6), 10th (offset 9)
 * - All other planets (Sun, Moon, Mercury, Venus, Rahu, Ketu): 7th full direct aspect (offset 6) only.
 */
export function getGrahaDrishtiOffsets(sourcePlanet: Planet): DrishtiRule[] {
  const full7th: DrishtiRule = { offset: 6, type: AspectType.FULL_7TH, label: '7th Full Direct Aspect' };

  if (sourcePlanet === Planet.MARS) {
    return [
      { offset: 3, type: AspectType.SPECIAL_4TH, label: '4th Special Drishti' },
      full7th,
      { offset: 7, type: AspectType.SPECIAL_8TH, label: '8th Special Drishti' }
    ];
  } else if (sourcePlanet === Planet.JUPITER) {
    return [
      { offset: 4, type: AspectType.SPECIAL_5TH, label: '5th Special Drishti' },
      full7th,
      { offset: 8, type: AspectType.SPECIAL_9TH, label: '9th Special Drishti' }
    ];
  } else if (sourcePlanet === Planet.SATURN) {
    return [
      { offset: 2, type: AspectType.SPECIAL_3RD, label: '3rd Special Drishti' },
      full7th,
      { offset: 9, type: AspectType.SPECIAL_10TH, label: '10th Special Drishti' }
    ];
  }

  return [full7th];
}

import { calculateWholeSignHouse } from './chartMath';
export { calculateWholeSignHouse };

/**
 * Derives target sign from a starting sign and house offset (0-indexed offset).
 */
export function getTargetSign(startSign: Sign, houseOffset: number): Sign {
  const startNum = (SIGNS_METADATA[startSign].number ?? 1) - 1; // 0..11
  const targetNum = (startNum + houseOffset) % 12;
  return SIGNS_ORDER[targetNum];
}

/**
 * Calculates Graha Drishti (aspects) cast by a transit planet from its current transit position.
 */
export function calculateTransitAspects(
  sourcePlanet: Planet,
  transitSign: Sign,
  fromMoonHouse: number,
  fromAscendantHouse: number
): TransitAspect[] {
  const rules = getGrahaDrishtiOffsets(sourcePlanet);

  const aspects: TransitAspect[] = [];
  const visitedOffsets = new Set<number>();

  for (const rule of rules) {
    if (visitedOffsets.has(rule.offset)) continue;
    visitedOffsets.add(rule.offset);

    const targetHouseFromMoon = ((fromMoonHouse - 1 + rule.offset) % 12) + 1;
    const targetHouseFromAscendant = ((fromAscendantHouse - 1 + rule.offset) % 12) + 1;
    const targetSign = getTargetSign(transitSign, rule.offset);

    aspects.push(Object.freeze({
      sourcePlanet,
      targetHouseFromMoon,
      targetHouseFromAscendant,
      targetSign,
      aspectType: rule.type,
      description: `${sourcePlanet} casts ${rule.label} on ${targetSign} (${targetHouseFromMoon}H from Moon / ${targetHouseFromAscendant}H from Ascendant)`
    }));
  }

  return Object.freeze(aspects) as TransitAspect[];
}

/**
 * Calculates deterministic Gochara (Transit) facts given a TransitInput.
 * 
 * Pure, deterministic, and immutable function following PR-037 specification.
 */
export function calculateTransit(input: TransitInput): TransitAnalysis {
  if (!input) {
    throw new Error('TransitInput must not be null or undefined.');
  }

  const { at, natalMoonLongitude, natalAscendantLongitude, transitLongitudes } = input;

  if (at === undefined || at === null) {
    throw new Error('at must be a valid date/time.');
  }
  const dateObj = typeof at === 'string' || typeof at === 'number' ? new Date(at) : at;
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    throw new Error('at must be a valid date/time.');
  }
  const atIsoString = dateObj.toISOString();

  if (!Number.isFinite(natalMoonLongitude)) {
    throw new Error('natalMoonLongitude is required and must be a finite number.');
  }
  if (!Number.isFinite(natalAscendantLongitude)) {
    throw new Error('natalAscendantLongitude is required and must be a finite number.');
  }
  if (!transitLongitudes || Object.keys(transitLongitudes).length === 0) {
    throw new Error('transitLongitudes must not be empty.');
  }

  const VALID_PLANETS = new Set<string>(Object.values(Planet));
  for (const key of Object.keys(transitLongitudes)) {
    if (!VALID_PLANETS.has(key)) {
      throw new Error('Unknown transit planet: ' + key);
    }
  }

  const natalMoonSign = calculateSign(natalMoonLongitude!);
  const natalAscendantSign = calculateSign(natalAscendantLongitude!);

  const results: Partial<Record<Planet, TransitResult>> = {};

  for (const [planetKey, rawLong] of Object.entries(transitLongitudes)) {
    if (rawLong === undefined || rawLong === null || typeof rawLong !== 'number' || !Number.isFinite(rawLong)) {
      throw new Error('Transit longitude for planet ' + planetKey + ' must be a finite number.');
    }
    const planet = planetKey as Planet;
    const longitude = normalizeDegree(rawLong);
    const sign = calculateSign(longitude);
    const signMeta = SIGNS_METADATA[sign];
    const nakshatraRes = calculateNakshatra(longitude);

    const position: TransitPosition = Object.freeze({
      planet,
      longitude,
      sign,
      signNumber: signMeta.number,
      nakshatraResult: Object.freeze(nakshatraRes)
    });

    const fromMoon = calculateWholeSignHouse(natalMoonSign, sign);
    const fromAscendant = calculateWholeSignHouse(natalAscendantSign, sign);

    const housePosition: TransitHousePosition = Object.freeze({
      planet,
      fromMoon,
      fromAscendant
    });

    const aspects = calculateTransitAspects(planet, sign, fromMoon, fromAscendant);

    results[planet] = Object.freeze({
      planet,
      position,
      housePosition,
      aspects
    });
  }

  return Object.freeze({
    at: atIsoString,
    natalMoonSign,
    natalAscendantSign,
    results: Object.freeze(results) as Partial<Record<Planet, TransitResult>>
  });
}
