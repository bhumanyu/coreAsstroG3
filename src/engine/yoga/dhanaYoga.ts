import { Planet } from '../../types';
import { House } from '../houseLordship/houseGroups';
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

interface DhanaHousePairConfig {
  readonly ruleId: string;
  readonly houseA: House;
  readonly houseB: House;
}

// These five house-pair combinations (2+11, 2+5, 2+9, 5+11, 9+11) represent the project's
// validated Dhana Yoga rule family for PR-046, NOT the complete classical definition of Dhana Yoga
// (different classical sources define additional variants, to be added later with source-level validation).
const DHANA_HOUSE_PAIRS: readonly DhanaHousePairConfig[] = Object.freeze([
  { ruleId: 'YOGA_DHANA_001', houseA: House.SECOND, houseB: House.ELEVENTH },
  { ruleId: 'YOGA_DHANA_002', houseA: House.SECOND, houseB: House.FIFTH },
  { ruleId: 'YOGA_DHANA_003', houseA: House.SECOND, houseB: House.NINTH },
  { ruleId: 'YOGA_DHANA_004', houseA: House.FIFTH, houseB: House.ELEVENTH },
  { ruleId: 'YOGA_DHANA_005', houseA: House.NINTH, houseB: House.ELEVENTH }
]);

export const dhanaConjunctionRule: YogaRule = Object.freeze({
  id: 'YOGA_DHANA_CONJUNCTION',
  type: YogaType.DHANA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (const config of DHANA_HOUSE_PAIRS) {
      const pA = input.houseLordship.houseLords[config.houseA];
      const pB = input.houseLordship.houseLords[config.houseB];

      if (!pA || !pB || pA === pB) continue;

      const factA = input.planetFacts[pA];
      const factB = input.planetFacts[pB];
      if (!factA || !factB) continue;

      const houseA = factA.house ?? factA.position.house;
      const houseB = factB.house ?? factB.position.house;

      if (houseA !== undefined && houseA === houseB) {
        const planets = Object.freeze([pA, pB]);
        const houses = Object.freeze([houseA, houseB]);
        const lordshipHouses = Object.freeze([config.houseA as number, config.houseB as number]);

        const pAStr = `${getOrdinal(config.houseA)} lord ${pA}`;
        const pBStr = `${getOrdinal(config.houseB)} lord ${pB}`;

        const evidence: YogaEvidence = Object.freeze({
          ruleId: config.ruleId,
          reason: `The ${pAStr} and ${pBStr} are conjunct in House ${houseA}.`,
          planets,
          houses,
          relationship: 'CONJUNCTION',
          lordshipHouses
        });

        results.push(Object.freeze({
          type: YogaType.DHANA_YOGA,
          category: YogaCategory.DHANA,
          strength: YogaStrength.STRONG,
          planets,
          houses,
          evidence: Object.freeze([evidence])
        }));
      }
    }

    return Object.freeze(results);
  }
});

export const dhanaMutualAspectRule: YogaRule = Object.freeze({
  id: 'YOGA_DHANA_MUTUAL_ASPECT',
  type: YogaType.DHANA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (const config of DHANA_HOUSE_PAIRS) {
      const pA = input.houseLordship.houseLords[config.houseA];
      const pB = input.houseLordship.houseLords[config.houseB];

      if (!pA || !pB || pA === pB) continue;

      const factA = input.planetFacts[pA];
      const factB = input.planetFacts[pB];
      if (!factA || !factB) continue;

      const houseA = factA.house ?? factA.position.house;
      const houseB = factB.house ?? factB.position.house;

      if (houseA === undefined || houseB === undefined || houseA === houseB) continue;

      const offsetAtoB = ((houseB - houseA) % 12 + 12) % 12;
      const offsetBtoA = ((houseA - houseB) % 12 + 12) % 12;

      const drishtiA = getGrahaDrishtiOffsets(pA);
      const drishtiB = getGrahaDrishtiOffsets(pB);

      const aAspectsB = drishtiA.some(r => r.offset === offsetAtoB);
      const bAspectsA = drishtiB.some(r => r.offset === offsetBtoA);

      if (aAspectsB && bAspectsA) {
        const planets = Object.freeze([pA, pB]);
        const houses = Object.freeze([houseA, houseB]);
        const lordshipHouses = Object.freeze([config.houseA as number, config.houseB as number]);

        const pAStr = `${getOrdinal(config.houseA)} lord ${pA}`;
        const pBStr = `${getOrdinal(config.houseB)} lord ${pB}`;

        const evidence: YogaEvidence = Object.freeze({
          ruleId: config.ruleId,
          reason: `The ${pAStr} in House ${houseA} and ${pBStr} in House ${houseB} mutually aspect each other.`,
          planets,
          houses,
          relationship: 'MUTUAL_ASPECT',
          lordshipHouses
        });

        results.push(Object.freeze({
          type: YogaType.DHANA_YOGA,
          category: YogaCategory.DHANA,
          strength: YogaStrength.STRONG,
          planets,
          houses,
          evidence: Object.freeze([evidence])
        }));
      }
    }

    return Object.freeze(results);
  }
});

export const dhanaExchangeRule: YogaRule = Object.freeze({
  id: 'YOGA_DHANA_EXCHANGE',
  type: YogaType.DHANA_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): readonly YogaResult[] {
    if (!input.houseLordship) return Object.freeze([]);

    const results: YogaResult[] = [];

    for (const config of DHANA_HOUSE_PAIRS) {
      const pA = input.houseLordship.houseLords[config.houseA];
      const pB = input.houseLordship.houseLords[config.houseB];

      if (!pA || !pB || pA === pB) continue;

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
        const lordshipHouses = Object.freeze([config.houseA as number, config.houseB as number]);

        const pAStr = `${getOrdinal(config.houseA)} lord ${pA}`;
        const pBStr = `${getOrdinal(config.houseB)} lord ${pB}`;

        const evidence: YogaEvidence = Object.freeze({
          ruleId: config.ruleId,
          reason: `The ${pAStr} in House ${houseA} and ${pBStr} in House ${houseB} exchange signs.`,
          planets,
          houses,
          relationship: 'EXCHANGE',
          lordshipHouses
        });

        results.push(Object.freeze({
          type: YogaType.DHANA_YOGA,
          category: YogaCategory.DHANA,
          strength: YogaStrength.STRONG,
          planets,
          houses,
          evidence: Object.freeze([evidence])
        }));
      }
    }

    return Object.freeze(results);
  }
});

export const dhanaYogaRules: readonly YogaRule[] = Object.freeze([
  dhanaConjunctionRule,
  dhanaMutualAspectRule,
  dhanaExchangeRule
]);
