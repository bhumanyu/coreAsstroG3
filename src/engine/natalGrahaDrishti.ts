import {
  Planet,
  NatalGrahaDrishti,
  NatalGrahaDrishtiReport,
  PlanetFact,
  PlanetFacts
} from '../types';
import { getGrahaDrishtiOffsets, DrishtiRule } from './transitEngine';

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
): NatalGrahaDrishtiReport {
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
    planetToPlanetAspects: [] as any,
    planetToHouseAspects: [] as any,
    aspectsReceivedByPlanet: {} as any,
    aspectsReceivedByHouse: {} as any,
    summary: []
  }) as any;
}
