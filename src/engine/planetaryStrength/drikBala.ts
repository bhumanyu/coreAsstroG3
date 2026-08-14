import {
  Planet,
  PlanetFacts,
  StrengthComponentStatus,
  DrikAspectContribution
} from '../../types';
import { normalizeDegree } from '../nakshatraUtils';
import { calculateSphutaDrishti } from './sphutaDrishti';

export type { DrikAspectContribution };

export const CLASSICAL_PLANETS: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN
]);

export interface DrikBalaResult {
  readonly status: StrengthComponentStatus;
  readonly value?: number;
  readonly beneficTotal?: number;
  readonly maleficTotal?: number;
  readonly contributions: readonly DrikAspectContribution[];
  readonly ruleId?: string;
  readonly reason?: string;
}

/**
 * Determines whether a planet is a natural benefic or natural malefic
 * for Drik Bala rectification purposes.
 *
 * Rules:
 * - Jupiter and Venus are always natural benefics.
 * - Sun, Mars, and Saturn are always natural malefics.
 * - Moon is natural benefic if waxing (0 < phase < 180° elongation from Sun), otherwise malefic.
 * - Mercury is natural benefic unless whole-sign conjunct (same house) with any malefic
 *   (Sun, Mars, Saturn, Rahu, or Ketu).
 */
export function isNaturalBenefic(
  planet: Planet,
  planetFacts: PlanetFacts
): boolean {
  if (planet === Planet.JUPITER || planet === Planet.VENUS) {
    return true;
  }
  if (planet === Planet.SUN || planet === Planet.MARS || planet === Planet.SATURN) {
    return false;
  }
  if (planet === Planet.MOON) {
    const sunLong = planetFacts[Planet.SUN]?.position?.eclipticLongitude;
    const moonLong = planetFacts[Planet.MOON]?.position?.eclipticLongitude;
    if (typeof sunLong !== 'number' || typeof moonLong !== 'number') {
      throw new Error('Sun and Moon positions are required to determine lunar phase.');
    }
    const phase = normalizeDegree(moonLong - sunLong);
    return phase > 0 && phase < 180;
  }
  if (planet === Planet.MERCURY) {
    const mercuryHouse = planetFacts[Planet.MERCURY]?.house;
    if (typeof mercuryHouse !== 'number') {
      throw new Error('Mercury house is required to determine conjunctions.');
    }
    const malefics = [
      Planet.SUN,
      Planet.MARS,
      Planet.SATURN,
      Planet.RAHU,
      Planet.KETU
    ];
    const isAfflicted = malefics.some(
      (malefic) => planetFacts[malefic] && planetFacts[malefic].house === mercuryHouse
    );
    return !isAfflicted;
  }
  return false;
}

/**
 * Calculates Drik Bala (Aspectual Strength) for a target planet.
 *
 * Implements the canonical P-10 Shadbala Drik Bala specification:
 * 1. Computes directional Sphuta Drishti (aspect) from each of the other six classical planets.
 * 2. Rectifies aspect by natural classification (+25% / 1.25x for benefics, -25% / 0.75x for malefics).
 * 3. Net Drik Bala = Benefic Aspect Total - Malefic Aspect Total.
 * 4. Value is unbounded (can be negative if malefic aspects dominate; not clamped to 0 or ±60).
 * 5. Rahu and Ketu are outside the scope and returned as NOT_IMPLEMENTED.
 */
export function calculateDrikBala(
  targetPlanet: Planet,
  planetFacts: PlanetFacts
): DrikBalaResult {
  if (!planetFacts || typeof planetFacts !== 'object') {
    throw new TypeError('planetFacts must be a non-null object.');
  }

  if (targetPlanet === Planet.RAHU || targetPlanet === Planet.KETU) {
    return Object.freeze({
      status: StrengthComponentStatus.NOT_IMPLEMENTED,
      value: undefined,
      contributions: Object.freeze([]),
      ruleId: 'SHADBALA_DRIK_BALA_NOT_IMPLEMENTED',
      reason: 'Drik Bala is implemented for the seven classical Shadbala grahas; Rahu and Ketu are outside the current canonical calculation scope.'
    });
  }

  if (!CLASSICAL_PLANETS.includes(targetPlanet)) {
    throw new Error(`Unsupported target planet: ${targetPlanet}`);
  }

  const targetFact = planetFacts[targetPlanet];
  if (!targetFact || !targetFact.position || typeof targetFact.position.eclipticLongitude !== 'number') {
    throw new Error(`Missing position data for target planet ${targetPlanet}`);
  }
  const targetLong = targetFact.position.eclipticLongitude;

  const contributions: DrikAspectContribution[] = [];
  let rawBeneficTotal = 0;
  let rawMaleficTotal = 0;

  for (const source of CLASSICAL_PLANETS) {
    if (source === targetPlanet) {
      continue;
    }

    const sourceFact = planetFacts[source];
    const sourceLong = sourceFact?.position?.eclipticLongitude ?? sourceFact?.position?.longitude;
    if (typeof sourceLong !== 'number') {
      throw new Error(`Missing position data for source planet ${source}`);
    }
    const aspectAngle = normalizeDegree(targetLong - sourceLong);

    const sphuta = calculateSphutaDrishti(source, sourceLong, targetLong);
    if (sphuta.value === 0) {
      continue;
    }

    const isBenefic = isNaturalBenefic(source, planetFacts);
    const naturalClassification: 'BENEFIC' | 'MALEFIC' = isBenefic ? 'BENEFIC' : 'MALEFIC';
    const rectificationFactor = isBenefic ? 1.25 : 0.75;
    const rectifiedValue = sphuta.value * rectificationFactor;

    if (isBenefic) {
      rawBeneficTotal += rectifiedValue;
    } else {
      rawMaleficTotal += rectifiedValue;
    }

    contributions.push(Object.freeze({
      sourcePlanet: source,
      targetPlanet,
      sourceLongitude: sourceLong,
      targetLongitude: targetLong,
      aspectAngle,
      sphutaValue: sphuta.value,
      naturalClassification,
      rectificationFactor,
      rectifiedValue,
      ruleId: `DRIK_CONTRIBUTION_${source}`,
      reason: `${source} (${naturalClassification}) casts aspect of ${sphuta.value.toFixed(2)} at ${aspectAngle.toFixed(2)}°, rectified by ${rectificationFactor}x to ${rectifiedValue.toFixed(2)} Shastiamsas.`
    }));
  }

  const netValue = rawBeneficTotal - rawMaleficTotal;
  const value = Number(netValue.toFixed(2));
  const beneficTotal = Number(rawBeneficTotal.toFixed(2));
  const maleficTotal = Number(rawMaleficTotal.toFixed(2));

  return Object.freeze({
    status: StrengthComponentStatus.CALCULATED,
    value,
    beneficTotal,
    maleficTotal,
    contributions: Object.freeze(contributions),
    ruleId: 'SHADBALA_DRIK_BALA_001',
    reason: `Drik Bala is calculated from rectified Sphuta Drishti received from the other classical planets (benefic total: ${beneficTotal}, malefic total: ${maleficTotal}, net: ${value}).`
  });
}
