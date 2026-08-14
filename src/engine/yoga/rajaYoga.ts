import { Planet } from '../../types';
import { OWNERSHIP_PLANETS, HouseGroups, House } from '../houseLordship/houseGroups';
import { getGrahaDrishtiOffsets } from '../transitEngine';
import {
  YogaType,
  YogaCategory,
  YogaStrength,
  YogaAnalysisInput,
  YogaResult,
  YogaRule,
  YogaEvidence
} from './yogaTypes';

function getOrdinal(house: number): string {
  const ordinals: Record<number, string> = {
    1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th',
    7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th'
  };
  return ordinals[house] ?? `${house}th`;
}

function formatPlanetLordship(planet: Planet, input: YogaAnalysisInput): string {
  const ownedHouses = input.houseLordship?.planetLordships[planet]?.ownedHouses ?? [];
  if (ownedHouses.length === 0) {
    return planet;
  }
  const houseStr = ownedHouses.map(getOrdinal).join(' and ');
  return `${houseStr} lord ${planet}`;
}

export function getKendraTrikonaHousesForPair(
  planetA: Planet,
  planetB: Planet,
  input: YogaAnalysisInput
): { kendraHouses: readonly number[]; trikonaHouses: readonly number[] } | null {
  if (!input.houseLordship) return null;

  const lordshipA = input.houseLordship.planetLordships[planetA];
  const lordshipB = input.houseLordship.planetLordships[planetB];

  if (!lordshipA || !lordshipB) return null;

  const kendraHousesList = HouseGroups.KENDRA as readonly number[];
  const trikonaHousesList = HouseGroups.TRIKONA as readonly number[];

  const kA = lordshipA.ownedHouses.filter(h => kendraHousesList.includes(h));
  const tA = lordshipA.ownedHouses.filter(h => trikonaHousesList.includes(h));
  const kB = lordshipB.ownedHouses.filter(h => kendraHousesList.includes(h));
  const tB = lordshipB.ownedHouses.filter(h => trikonaHousesList.includes(h));

  const hasA_Kendra_B_Trikona = kA.length > 0 && tB.length > 0;
  const hasA_Trikona_B_Kendra = tA.length > 0 && kB.length > 0;

  if (!hasA_Kendra_B_Trikona && !hasA_Trikona_B_Kendra) {
    return null;
  }

  const kendraSet = new Set<number>();
  const trikonaSet = new Set<number>();

  if (hasA_Kendra_B_Trikona) {
    kA.forEach(h => kendraSet.add(h));
    tB.forEach(h => trikonaSet.add(h));
  }
  if (hasA_Trikona_B_Kendra) {
    tA.forEach(h => trikonaSet.add(h));
    kB.forEach(h => kendraSet.add(h));
  }

  const kendraHouses = Object.freeze(Array.from(kendraSet).sort((a, b) => a - b));
  const trikonaHouses = Object.freeze(Array.from(trikonaSet).sort((a, b) => a - b));

  return { kendraHouses, trikonaHouses };
}

export const rajaYogaConjunctionRule: YogaRule = Object.freeze({
  id: 'YOGA_RAJA_KENDRA_TRIKONA_001',
  type: YogaType.RAJA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (let i = 0; i < OWNERSHIP_PLANETS.length; i++) {
      for (let j = i + 1; j < OWNERSHIP_PLANETS.length; j++) {
        const pA = OWNERSHIP_PLANETS[i];
        const pB = OWNERSHIP_PLANETS[j];

        const ktInfo = getKendraTrikonaHousesForPair(pA, pB, input);
        if (!ktInfo) continue;

        const factA = input.planetFacts[pA];
        const factB = input.planetFacts[pB];
        if (!factA || !factB) continue;

        const houseA = factA.house ?? factA.position.house;
        const houseB = factB.house ?? factB.position.house;

        if (houseA !== undefined && houseA === houseB) {
          const planets = Object.freeze([pA, pB]);
          const houses = Object.freeze([houseA, houseB]);

          const pAStr = formatPlanetLordship(pA, input);
          const pBStr = formatPlanetLordship(pB, input);

          const evidence: YogaEvidence = Object.freeze({
            ruleId: 'YOGA_RAJA_KENDRA_TRIKONA_001',
            reason: `The ${pAStr} and ${pBStr} are conjunct in House ${houseA}.`,
            planets,
            houses,
            relationship: 'CONJUNCTION',
            kendraHouses: ktInfo.kendraHouses,
            trikonaHouses: ktInfo.trikonaHouses
          });

          results.push(Object.freeze({
            type: YogaType.RAJA_YOGA,
            category: YogaCategory.RAJA,
            strength: YogaStrength.STRONG,
            planets,
            houses,
            evidence: Object.freeze([evidence])
          }));
        }
      }
    }

    return Object.freeze(results);
  }
});

export const rajaYogaMutualAspectRule: YogaRule = Object.freeze({
  id: 'YOGA_RAJA_KENDRA_TRIKONA_002',
  type: YogaType.RAJA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (let i = 0; i < OWNERSHIP_PLANETS.length; i++) {
      for (let j = i + 1; j < OWNERSHIP_PLANETS.length; j++) {
        const pA = OWNERSHIP_PLANETS[i];
        const pB = OWNERSHIP_PLANETS[j];

        const ktInfo = getKendraTrikonaHousesForPair(pA, pB, input);
        if (!ktInfo) continue;

        const factA = input.planetFacts[pA];
        const factB = input.planetFacts[pB];
        if (!factA || !factB) continue;

        const houseA = factA.house ?? factA.position.house;
        const houseB = factB.house ?? factB.position.house;

        if (houseA === undefined || houseB === undefined || houseA === houseB) continue; // Exclude conjunction

        const offsetAtoB = ((houseB - houseA) % 12 + 12) % 12;
        const offsetBtoA = ((houseA - houseB) % 12 + 12) % 12;

        const drishtiA = getGrahaDrishtiOffsets(pA);
        const drishtiB = getGrahaDrishtiOffsets(pB);

        const aAspectsB = drishtiA.some(r => r.offset === offsetAtoB);
        const bAspectsA = drishtiB.some(r => r.offset === offsetBtoA);

        if (aAspectsB && bAspectsA) {
          const planets = Object.freeze([pA, pB]);
          const houses = Object.freeze([houseA, houseB]);

          const pAStr = formatPlanetLordship(pA, input);
          const pBStr = formatPlanetLordship(pB, input);

          const evidence: YogaEvidence = Object.freeze({
            ruleId: 'YOGA_RAJA_KENDRA_TRIKONA_002',
            reason: `The ${pAStr} in House ${houseA} and ${pBStr} in House ${houseB} mutually aspect each other.`,
            planets,
            houses,
            relationship: 'MUTUAL_ASPECT',
            kendraHouses: ktInfo.kendraHouses,
            trikonaHouses: ktInfo.trikonaHouses
          });

          results.push(Object.freeze({
            type: YogaType.RAJA_YOGA,
            category: YogaCategory.RAJA,
            strength: YogaStrength.STRONG,
            planets,
            houses,
            evidence: Object.freeze([evidence])
          }));
        }
      }
    }

    return Object.freeze(results);
  }
});

export const rajaYogaExchangeRule: YogaRule = Object.freeze({
  id: 'YOGA_RAJA_KENDRA_TRIKONA_003',
  type: YogaType.RAJA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (let i = 0; i < OWNERSHIP_PLANETS.length; i++) {
      for (let j = i + 1; j < OWNERSHIP_PLANETS.length; j++) {
        const pA = OWNERSHIP_PLANETS[i];
        const pB = OWNERSHIP_PLANETS[j];

        const ktInfo = getKendraTrikonaHousesForPair(pA, pB, input);
        if (!ktInfo) continue;

        const factA = input.planetFacts[pA];
        const factB = input.planetFacts[pB];
        if (!factA || !factB) continue;

        const houseA = factA.house ?? factA.position.house;
        const houseB = factB.house ?? factB.position.house;

        if (houseA === undefined || houseB === undefined) continue;

        const aHouseLord = input.houseLordship.houseLords[houseA as House];
        const bHouseLord = input.houseLordship.houseLords[houseB as House];

        if (bHouseLord === pA && aHouseLord === pB) {
          const planets = Object.freeze([pA, pB]);
          const houses = Object.freeze([houseA, houseB]);

          const pAStr = formatPlanetLordship(pA, input);
          const pBStr = formatPlanetLordship(pB, input);

          const evidence: YogaEvidence = Object.freeze({
            ruleId: 'YOGA_RAJA_KENDRA_TRIKONA_003',
            reason: `The ${pAStr} in House ${houseA} and ${pBStr} in House ${houseB} exchange signs.`,
            planets,
            houses,
            relationship: 'EXCHANGE',
            kendraHouses: ktInfo.kendraHouses,
            trikonaHouses: ktInfo.trikonaHouses
          });

          results.push(Object.freeze({
            type: YogaType.RAJA_YOGA,
            category: YogaCategory.RAJA,
            strength: YogaStrength.STRONG,
            planets,
            houses,
            evidence: Object.freeze([evidence])
          }));
        }
      }
    }

    return Object.freeze(results);
  }
});

export const rajaYogaRules: readonly YogaRule[] = Object.freeze([
  rajaYogaConjunctionRule,
  rajaYogaMutualAspectRule,
  rajaYogaExchangeRule
]);
