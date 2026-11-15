import {
  Planet,
  NatalGrahaDrishtiComputed,
  PlanetFact,
  PlanetFacts
} from '../types';
import { getGrahaDrishtiOffsets, DrishtiRule } from './transitEngine';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNatalGrahaDrishtiComputed(
  value: Record<string, unknown>
): value is Record<string, unknown> & NatalGrahaDrishtiComputed {
  const validStatus = value.computationStatus === 'COMPLETE' ||
    value.computationStatus === 'PARTIAL' ||
    value.computationStatus === 'UNAVAILABLE';
  const validDiagnostics = Array.isArray(value.diagnostics) &&
    value.diagnostics.every(diagnostic => isRecord(diagnostic) &&
      typeof diagnostic.code === 'string' &&
      (diagnostic.message === undefined || typeof diagnostic.message === 'string'));
  const validMethod = value.computationMethod === 'GRAHA_DRISHTI_HOUSE_BASED_V1' ||
    value.computationMethod === 'UNKNOWN';
  return Array.isArray(value.aspects) && validStatus && validDiagnostics && validMethod;
}

/**
 * Returns the DrishtiRule if targetHouse receives a Graha Drishti aspect from sourceHouse for sourcePlanet.
 * Returns undefined if targetHouse is not aspected by sourcePlanet or if targetHouse === sourceHouse (conjunction).
 */
function isAspecting(
  sourceHouse: number,
  targetHouse: number,
  sourcePlanet: Planet
): DrishtiRule | undefined {
  const offset = ((targetHouse - sourceHouse) + 12) % 12;
  if (offset === 0) return undefined;
  return getGrahaDrishtiOffsets(sourcePlanet).find((rule) => rule.offset === offset);
}

function getOrdinal(n: number): string {
  switch (n) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    case 5: return '5th';
    case 6: return '6th';
    case 7: return '7th';
    case 8: return '8th';
    case 9: return '9th';
    case 10: return '10th';
    case 11: return '11th';
    case 12: return '12th';
    default: return `${n}th`;
  }
}

function formatPlanetName(p: Planet): string {
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/**
 * Performs a deterministic Natal Graha Drishti (planetary aspect) analysis on D1 Rasi planetFacts.
 */
export function analyzeNatalGrahaDrishti(
  planetFacts: Readonly<Record<Planet, PlanetFact>> | Readonly<Record<Planet, PlanetFacts>> | any
): NatalGrahaDrishtiComputed {
  if (!planetFacts) {
    throw new Error('planetFacts must not be null or undefined.');
  }

  const allPlanets = Object.values(Planet);

  for (const planet of allPlanets) {
    const pf = planetFacts[planet];
    if (!pf) {
      throw new Error(`planetFacts is missing required planet: ${planet}.`);
    }
    const house = pf.house ?? pf.position?.house;
    if (typeof house !== 'number' || !Number.isInteger(house) || house < 1 || house > 12) {
      throw new Error(`Invalid house ${house} for planet ${planet}. House must be an integer between 1 and 12.`);
    }
  }

  const aspects: any[] = [];

  for (const sourcePlanet of allPlanets) {
    const sourceFacts = planetFacts[sourcePlanet];
    const sourceHouse = sourceFacts.house ?? sourceFacts.position?.house;
    const sourceSign = sourceFacts.sign ?? sourceFacts.position?.sign;

    for (const targetPlanet of allPlanets) {
      if (sourcePlanet === targetPlanet) continue;

      const targetFacts = planetFacts[targetPlanet];
      const targetHouse = targetFacts.house ?? targetFacts.position?.house;
      const targetSign = targetFacts.sign ?? targetFacts.position?.sign;

      const rule = isAspecting(sourceHouse, targetHouse, sourcePlanet);
      if (!rule) continue;

      const offset = ((targetHouse - sourceHouse) + 12) % 12;
      const ordinal = getOrdinal(offset + 1);
      const srcName = formatPlanetName(sourcePlanet);
      const tgtName = formatPlanetName(targetPlanet);
      const description = `${srcName} in House ${sourceHouse} casts ${ordinal} aspect on ${tgtName} in House ${targetHouse}.`;
      const reason = `${srcName} occupies House ${sourceHouse} and its ${ordinal} Graha Drishti falls on House ${targetHouse}.`;

      aspects.push(
        Object.freeze({
          sourcePlanet,
          targetPlanet,
          sourceHouse,
          targetHouse,
          sourceSign,
          targetSign,
          houseOffset: offset,
          aspectType: rule.type,
          description,
          reason
        })
      );
    }
  }

  return Object.freeze({
    aspects: Object.freeze(aspects),
    computationStatus: 'COMPLETE',
    diagnostics: Object.freeze([]),
    computationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1',
    planetToPlanetAspects: [] as any,
    planetToHouseAspects: [] as any,
    aspectsReceivedByPlanet: {} as any,
    aspectsReceivedByHouse: {} as any,
    summary: []
  }) as any;
}

/**
 * Validates and normalizes natal graha drishti input.
 * Returns a computed contract or normalizes a present but legacy/malformed report
 * to explicit UNAVAILABLE status. Missing input remains undefined.
 * Missing evidence is preserved as undefined and must not be synthesized as empty aspects.
 */
export function normalizeNatalGrahaDrishti(
  input: unknown
): NatalGrahaDrishtiComputed | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  if (isNatalGrahaDrishtiComputed(input)) {
    return input;
  }
  return Object.freeze({
    aspects: [],
    computationStatus: 'UNAVAILABLE',
    computationMethod: 'UNKNOWN',
    diagnostics: Object.freeze([{ code: 'INVALID_OR_LEGACY_COMPUTATION_REPORT' }])
  });
}

