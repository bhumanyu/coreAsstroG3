import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPatternClassification, CareerPatternHouseRole } from './careerPatternTypes';

/**
 * P2-03 Career Pattern Classification Rules
 *
 * This module provides classification rules for Career patterns.
 *
 * This layer is pure structural pattern-identity/classification only - it does NOT calculate
 * strength, confidence, scores, qualification, activation, Dasha, D10, transit, mechanism,
 * or prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Career-relevant houses.
 */
export const CAREER_HOUSES = [2, 6, 10, 11] as const;

/**
 * Upachaya houses (houses of growth and improvement).
 */
export const UPACHAYA_HOUSES = [3, 6, 10, 11] as const;

/**
 * Type-safe helper to check if a house is a career house.
 */
export function isCareerHouse(house: number): boolean {
  return (CAREER_HOUSES as readonly number[]).includes(house);
}

/**
 * Frozen house-role map for 2-6-10-11 pattern.
 */
export const HOUSE_ROLES_2_6_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  2: 'WEALTH_HOUSE',
  6: 'SERVICE_HOUSE',
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Frozen house-role map for 3-6-10-11 pattern.
 */
export const HOUSE_ROLES_3_6_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  3: 'EFFORT_HOUSE',
  6: 'SERVICE_HOUSE',
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Frozen house-role map for 5-9-10 pattern.
 */
export const HOUSE_ROLES_5_9_10: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  5: 'CREATIVE_HOUSE',
  9: 'DHARMA_HOUSE',
  10: 'CAREER_HOUSE'
});

/**
 * Frozen house-role map for 9-10-11 pattern.
 */
export const HOUSE_ROLES_9_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  9: 'DHARMA_HOUSE',
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Frozen house-role map for 6-10-11 pattern.
 */
export const HOUSE_ROLES_6_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  6: 'SERVICE_HOUSE',
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Frozen house-role map for 2-3-6-10-11 pattern.
 */
export const HOUSE_ROLES_2_3_6_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  2: 'WEALTH_HOUSE',
  3: 'COMMUNICATION_HOUSE',
  6: 'SERVICE_HOUSE',
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Frozen house-role map for 10-11 pattern.
 */
export const HOUSE_ROLES_10_11: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  10: 'CAREER_HOUSE',
  11: 'GAINS_HOUSE'
});

/**
 * Result of a pattern classification rule match.
 */
export interface CareerPatternRuleMatch {
  readonly ruleId: string;
  readonly classification: CareerPatternClassification;
  readonly family: 'CAREER_HOUSE_NETWORK' | 'KENDRA_TRIKONA' | 'UPACHAYA' | 'PARIVARTANA';
  readonly houseRoles: Readonly<Record<number, CareerPatternHouseRole>>;
}

/**
 * Classifies a 2-6-10-11 network as WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS.
 */
export function classifyTwoSixTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '2,6,10,11') {
    return [{
      ruleId: 'RULE_2_6_10_11',
      classification: 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS',
      family: 'CAREER_HOUSE_NETWORK',
      houseRoles: HOUSE_ROLES_2_6_10_11
    }];
  }

  return [];
}

/**
 * Classifies a 3-6-10-11 network as UPACHAYA progression.
 */
export function classifyThreeSixTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === UPACHAYA_HOUSES.join(',')) {
    return [{
      ruleId: 'RULE_3_6_10_11',
      classification: 'UPACHAYA_PROGRESSION',
      family: 'UPACHAYA',
      houseRoles: HOUSE_ROLES_3_6_10_11
    }];
  }

  return [];
}

/**
 * Classifies a 5-9-10 network as CREATIVE_DHARMA_TO_PROFESSION.
 * NOT Raja Yoga - no lordship/functional info yet.
 */
export function classifyFiveNineTen(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '5,9,10') {
    return [{
      ruleId: 'RULE_5_9_10',
      classification: 'CREATIVE_DHARMA_TO_PROFESSION',
      family: 'KENDRA_TRIKONA',
      houseRoles: HOUSE_ROLES_5_9_10
    }];
  }

  return [];
}

/**
 * Classifies a 9-10-11 network as DHARMA_KARMA_ALIGNMENT.
 */
export function classifyNineTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '9,10,11') {
    return [{
      ruleId: 'RULE_9_10_11',
      classification: 'DHARMA_KARMA_ALIGNMENT',
      family: 'CAREER_HOUSE_NETWORK',
      houseRoles: HOUSE_ROLES_9_10_11
    }];
  }

  return [];
}

/**
 * Classifies a 6-10-11 network as SERVICE_TO_PROFESSION_TO_GAINS.
 */
export function classifySixTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '6,10,11') {
    return [{
      ruleId: 'RULE_6_10_11',
      classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
      family: 'CAREER_HOUSE_NETWORK',
      houseRoles: HOUSE_ROLES_6_10_11
    }];
  }

  return [];
}

/**
 * Classifies a 2-3-6-10-11 network as COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS.
 */
export function classifyTwoThreeSixTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '2,3,6,10,11') {
    return [{
      ruleId: 'RULE_2_3_6_10_11',
      classification: 'COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS',
      family: 'CAREER_HOUSE_NETWORK',
      houseRoles: HOUSE_ROLES_2_3_6_10_11
    }];
  }

  return [];
}

/**
 * Classifies a 10-11 network as PROFESSION_TO_GAINS.
 */
export function classifyTenEleven(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houses = network.houses;
  const sortedHouses = [...houses].sort((a, b) => a - b);

  if (sortedHouses.join(',') === '10,11') {
    return [{
      ruleId: 'RULE_10_11',
      classification: 'PROFESSION_TO_GAINS',
      family: 'CAREER_HOUSE_NETWORK',
      houseRoles: HOUSE_ROLES_10_11
    }];
  }

  return [];
}

/**
 * Classifies a Parivartana (exchange) network.
 * Requires BOTH an EXCHANGES edge AND a career-relevant house in {2,6,10,11}.
 */
export function classifyParivartana(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const hasExchange = network.relationships.some(r => r.type === 'EXCHANGES');
  const hasCareerHouse = network.houses.some(isCareerHouse);

  if (hasExchange && hasCareerHouse) {
    const houseRoles: Record<number, CareerPatternHouseRole> = {};
    for (const house of network.houses) {
      if (house === 2) houseRoles[house] = 'WEALTH_HOUSE';
      else if (house === 6) houseRoles[house] = 'SERVICE_HOUSE';
      else if (house === 10) houseRoles[house] = 'CAREER_HOUSE';
      else if (house === 11) houseRoles[house] = 'GAINS_HOUSE';
      else houseRoles[house] = 'UNKNOWN';
    }

    return [{
      ruleId: 'RULE_PARIVARTANA',
      classification: 'PARIVARTANA_YOGA',
      family: 'PARIVARTANA',
      houseRoles: Object.freeze(houseRoles)
    }];
  }

  return [];
}

/**
 * Generic fallback classification for networks that don't match specialized rules.
 * Never discard an unclassified network - always return at least CAREER_HOUSE_NETWORK.
 *
 * SEMANTIC NOTE: CAREER_HOUSE_NETWORK is a structural carrier classification — not a claim
 * of career significance, strength, qualification, or positive outcome. This classification
 * is structural only. Qualification (strength, relevance, coherence, activation potential)
 * is a separate layer (P2-04, future).
 */
export function classifyGenericCareerNetwork(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const houseRoles: Record<number, CareerPatternHouseRole> = {};
  for (const house of network.houses) {
    if (house === 2) houseRoles[house] = 'WEALTH_HOUSE';
    else if (house === 3) houseRoles[house] = 'EFFORT_HOUSE';
    else if (house === 5) houseRoles[house] = 'CREATIVE_HOUSE';
    else if (house === 6) houseRoles[house] = 'SERVICE_HOUSE';
    else if (house === 9) houseRoles[house] = 'DHARMA_HOUSE';
    else if (house === 10) houseRoles[house] = 'CAREER_HOUSE';
    else if (house === 11) houseRoles[house] = 'GAINS_HOUSE';
    else houseRoles[house] = 'UNKNOWN';
  }

  return [{
    ruleId: 'RULE_GENERIC',
    classification: 'CAREER_HOUSE_NETWORK',
    family: 'CAREER_HOUSE_NETWORK',
    houseRoles: Object.freeze(houseRoles)
  }];
}

/**
 * Classifies a CareerHouseNetwork using all applicable rules.
 * A network may produce multiple patterns (Option B: generic + specialized both retained).
 * Always includes generic CAREER_HOUSE_NETWORK pattern plus any specialized rule matches.
 * Sorts matches by ruleId.
 */
export function classifyCareerHouseNetwork(network: CareerHouseNetwork): readonly CareerPatternRuleMatch[] {
  const matches: CareerPatternRuleMatch[] = [];

  // Try specialized rules
  matches.push(...classifyTwoSixTenEleven(network));
  matches.push(...classifyThreeSixTenEleven(network));
  matches.push(...classifyFiveNineTen(network));
  matches.push(...classifyNineTenEleven(network));
  matches.push(...classifySixTenEleven(network));
  matches.push(...classifyTwoThreeSixTenEleven(network));
  matches.push(...classifyTenEleven(network));
  matches.push(...classifyParivartana(network));

  // Option B: Always include generic pattern (ensures every network produces at least CAREER_HOUSE_NETWORK)
  matches.push(...classifyGenericCareerNetwork(network));

  // Sort by ruleId for deterministic output
  return matches.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
}
