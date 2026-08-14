import {
  Planet,
  PlanetFacts,
  AyanamsaType,
  StrengthComponentStatus
} from '../../types';
import { normalizeDegree } from '../nakshatraUtils';
import { calculateAyanaBala, calculatePakshaBala } from './kalaBala';
import { calculateCheshtaAstronomy } from './cheshtaAstronomy';

export enum CheshtaMotionState {
  RETROGRADE = 'RETROGRADE',
  STATIONARY = 'STATIONARY',
  DIRECT = 'DIRECT',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export interface CheshtaBalaResult {
  readonly planet: Planet;
  readonly status: StrengthComponentStatus;
  readonly value?: number;
  readonly motionState: CheshtaMotionState;
  readonly details?: {
    readonly trueLongitude?: number;
    readonly meanLongitude?: number;
    readonly sheeghrochha?: number;
    readonly averageLongitude?: number;
    readonly cheshtaKendra?: number;
    readonly reducedCheshtaKendra?: number;
    readonly separation?: number;
    readonly ayanaBala?: number;
    readonly pakshaBala?: number;
  };
  readonly reason?: string;
}

export interface CheshtaKendraCalculation {
  readonly averageLongitude: number;
  readonly cheshtaKendra: number;
  readonly reducedCheshtaKendra: number;
  readonly value: number;
}

/**
 * Calculates Cheshta Kendra and base Cheshta Bala value directly from longitudes.
 * 
 * Formulas:
 * - Average Longitude = normalizeDegree((meanLongitude + trueLongitude) / 2)
 * - Cheshta Kendra = normalizeDegree(sheeghrochha - averageLongitude)
 * - Reduced Cheshta Kendra = cheshtaKendra > 180 ? 360 - cheshtaKendra : cheshtaKendra
 * - Value = reducedCheshtaKendra / 3
 */
export function calculateCheshtaBalaFromLongitudes(
  trueLongitude: number,
  meanLongitude: number,
  sheeghrochha: number
): CheshtaKendraCalculation {
  const averageLongitude = normalizeDegree((meanLongitude + trueLongitude) / 2);
  const cheshtaKendra = normalizeDegree(sheeghrochha - averageLongitude);
  const reducedCheshtaKendra = cheshtaKendra > 180 ? 360 - cheshtaKendra : cheshtaKendra;
  const value = reducedCheshtaKendra / 3;

  return Object.freeze({
    averageLongitude,
    cheshtaKendra,
    reducedCheshtaKendra,
    value
  });
}

/**
 * Calculates Cheshta Bala (Motional Strength) for a planet.
 * 
 * Rules:
 * - Sun: Uses Ayana Bala (Ayana Bala of Sun).
 * - Moon: Uses Paksha Bala (Paksha Bala of Moon).
 * - Mars, Mercury, Jupiter, Venus, Saturn:
 *   Average Longitude = (Mean Longitude + True Longitude) / 2
 *   Cheshta Kendra = Sheeghrochcha - Average Longitude
 *   Reduced Cheshta Kendra = Kendra > 180 ? 360 - Kendra : Kendra
 *   Cheshta Bala = Reduced Cheshta Kendra / 3
 * - Rahu & Ketu: NOT_IMPLEMENTED (Nodes do not have Cheshta Bala).
 */
export function calculateCheshtaBala(
  planet: Planet,
  planetFacts: PlanetFacts,
  birthInstant: Date,
  ayanamsa: AyanamsaType
): CheshtaBalaResult {
  if (!planetFacts || typeof planetFacts !== 'object') {
    throw new Error('planetFacts must not be null or undefined.');
  }

  if (!birthInstant || !(birthInstant instanceof Date) || Number.isNaN(birthInstant.getTime())) {
    throw new TypeError('birthInstant must be a valid Date object.');
  }

  if (planet === Planet.RAHU || planet === Planet.KETU) {
    return Object.freeze({
      planet,
      status: StrengthComponentStatus.NOT_IMPLEMENTED,
      motionState: CheshtaMotionState.NOT_APPLICABLE,
      reason: 'Nodes (Rahu and Ketu) do not have Cheshta Bala in standard Shadbala calculations.'
    });
  }

  const pf = planetFacts[planet];
  if (!pf || !pf.position) {
    throw new Error(`planetFacts missing required planet entry: ${planet}`);
  }

  const trueLongitude = pf.position.eclipticLongitude;
  if (typeof trueLongitude !== 'number' || !Number.isFinite(trueLongitude)) {
    throw new Error(`Invalid longitude for planet ${planet}: ${trueLongitude}`);
  }

  if (planet === Planet.SUN) {
    const ayanaRes = calculateAyanaBala(Planet.SUN, trueLongitude, birthInstant, ayanamsa);
    const value = Number(ayanaRes.value.toFixed(2));
    const details = Object.freeze({ ayanaBala: value });

    return Object.freeze({
      planet: Planet.SUN,
      status: StrengthComponentStatus.CALCULATED,
      value,
      motionState: CheshtaMotionState.NOT_APPLICABLE,
      details
    });
  }

  if (planet === Planet.MOON) {
    const sunFacts = planetFacts[Planet.SUN];
    const sunLong = sunFacts?.position?.eclipticLongitude ?? sunFacts?.position?.longitude;
    if (typeof sunLong !== 'number' || !Number.isFinite(sunLong)) {
      throw new Error('Sun facts missing or invalid for Moon Cheshta Bala calculation.');
    }
    const pakshaRes = calculatePakshaBala(Planet.MOON, sunLong, trueLongitude);
    const value = Number(pakshaRes.value.toFixed(2));
    const details = Object.freeze({
      pakshaBala: value,
      separation: Number(pakshaRes.separation.toFixed(2))
    });

    return Object.freeze({
      planet: Planet.MOON,
      status: StrengthComponentStatus.CALCULATED,
      value,
      motionState: CheshtaMotionState.NOT_APPLICABLE,
      details
    });
  }

  // Classical 5 star planets: MARS, MERCURY, JUPITER, VENUS, SATURN
  const astronomy = calculateCheshtaAstronomy(planet, birthInstant);
  const meanLongitude = astronomy.meanLongitude;
  const sheeghrochha = astronomy.sheeghrochha;

  const kendraCalc = calculateCheshtaBalaFromLongitudes(trueLongitude, meanLongitude, sheeghrochha);
  const value = Number(kendraCalc.value.toFixed(2));

  if (value < 0 || value > 60) {
    throw new Error(`Cheshta Bala value out of range [0, 60]: ${value}`);
  }

  const motion = pf.state?.motion;
  let motionState = CheshtaMotionState.DIRECT;
  if (motion?.stationary) {
    motionState = CheshtaMotionState.STATIONARY;
  } else if (motion?.retrograde) {
    motionState = CheshtaMotionState.RETROGRADE;
  }

  const details = Object.freeze({
    trueLongitude: Number(trueLongitude.toFixed(2)),
    meanLongitude: Number(meanLongitude.toFixed(2)),
    sheeghrochha: Number(sheeghrochha.toFixed(2)),
    averageLongitude: Number(kendraCalc.averageLongitude.toFixed(2)),
    cheshtaKendra: Number(kendraCalc.cheshtaKendra.toFixed(2)),
    reducedCheshtaKendra: Number(kendraCalc.reducedCheshtaKendra.toFixed(2))
  });

  return Object.freeze({
    planet,
    status: StrengthComponentStatus.CALCULATED,
    value,
    motionState,
    details
  });
}
