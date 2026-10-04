import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPattern, CareerPatternClassification, CareerPatternClassificationEvidence, CareerPatternClassificationProvenance, CareerMechanism } from './careerPatternTypes';
import type { CareerPatternHouseRole } from './careerPatternTypes';
import { buildCareerPatternIdentityKey, buildCareerPatternId } from './careerPatternIdentity';
import { Planet } from '../../../types';

/**
 * P2-06D Kendra-Trikona Detector
 *
 * This module detects Kendra-Trikona structural patterns with real lord relationship verification.
 * Per spec §9: DHARMA_KARMA_ALIGNMENT and related classifications require a real lord relationship
 * between a kendra house and a trikona house via LORD_OF/EXCHANGES/CONJUNCT/ASPECTS edges.
 *
 * Kendra houses: 1, 4, 7, 10 (angular houses)
 * Trikona houses: 1, 5, 9 (trine houses)
 *
 * This detector replaces the weak structural-only classifications in P2-03 with semantically
 * correct edge-based verification. P2-03 remains frozen with its structural carrier classifications.
 *
 * DESIGN CHOICE: Dedicated detector consuming graph edges (preferred approach).
 * This keeps P2-03 frozen and allows proper semantic verification of lord relationships.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Kendra houses (angular houses).
 */
const KENDRA_HOUSES = [1, 4, 7, 10] as const;

/**
 * Trikona houses (trine houses).
 */
const TRIKONA_HOUSES = [1, 5, 9] as const;

/**
 * House role mapping for Kendra-Trikona patterns.
 */
const KENDRA_TRIKONA_HOUSE_ROLES: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  1: 'UNKNOWN',
  4: 'UNKNOWN',
  5: 'CREATIVE_HOUSE',
  7: 'UNKNOWN',
  9: 'DHARMA_HOUSE',
  10: 'CAREER_HOUSE'
});

/**
 * Checks if a house is a kendra house.
 */
function isKendraHouse(house: number): house is 1 | 4 | 7 | 10 {
  return KENDRA_HOUSES.includes(house as 1 | 4 | 7 | 10);
}

/**
 * Checks if a house is a trikona house.
 */
function isTrikonaHouse(house: number): house is 1 | 5 | 9 {
  return TRIKONA_HOUSES.includes(house as 1 | 5 | 9);
}

/**
 * Type guard to check if a string is a valid Planet enum value.
 */
function isPlanet(value: string): value is Planet {
  return Object.values(Planet).includes(value as Planet);
}

/**
 * Extracts the lord of a house from LORD_OF edges (PLANET → HOUSE).
 * Returns null if no lord is found or if the edge is not valid.
 */
function getLordOfHouse(
  network: CareerHouseNetwork,
  house: number
): Planet | null {
  const houseNodeId = `HOUSE:${house}`;

  for (const edge of network.relationships) {
    // Only process LORD_OF edges from planet to house
    if (edge.type !== 'LORD_OF') {
      continue;
    }

    const sourceIsPlanet = edge.sourceNodeId.startsWith('PLANET:');
    const targetIsHouse = edge.targetNodeId === houseNodeId;

    if (sourceIsPlanet && targetIsHouse) {
      const planetKey = edge.sourceNodeId.replace('PLANET:', '');
      if (isPlanet(planetKey)) {
        return planetKey;
      }
    }
  }

  return null;
}

/**
 * Verifies if there is a real relationship edge between two planets.
 * Accepts only when:
 * (a) An EXCHANGES/CONJUNCT/ASPECTS edge connects PLANET:lordA ↔ PLANET:lordB, OR
 * (b) A LORD_OF edge lordA → HOUSE:houseB or lordB → HOUSE:houseA exists (cross-house lordship).
 *
 * DESIGN DECISION: Shared-house lordship (both planets lord the same house) is NOT accepted
 * as a relationship. This prevents false positives from co-lordship scenarios without real
 * planetary connections.
 */
function hasPlanetRelationship(
  network: CareerHouseNetwork,
  planetA: Planet,
  planetB: Planet
): boolean {
  const nodeA = `PLANET:${planetA}`;
  const nodeB = `PLANET:${planetB}`;

  for (const edge of network.relationships) {
    // Check for direct planet-planet relationship edges
    const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
    const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;

    if ((connectsAToB || connectsBToA) &&
      (edge.type === 'EXCHANGES' || edge.type === 'CONJUNCT' || edge.type === 'ASPECTS')) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies if there is a real lord relationship between two houses via their lords.
 * Resolves each house's lord from LORD_OF edges (PLANET → HOUSE), then accepts only when:
 * (a) An EXCHANGES/CONJUNCT/ASPECTS edge connects PLANET:lordA ↔ PLANET:lordB, OR
 * (b) A LORD_OF edge lordA → HOUSE:houseB or lordB → HOUSE:houseA exists (cross-house lordship).
 *
 * CONJUNCT/ASPECTS on HOUSE nodes alone must not qualify.
 */
function hasLordRelationship(
  network: CareerHouseNetwork,
  houseA: number,
  houseB: number
): boolean {
  const lordA = getLordOfHouse(network, houseA);
  const lordB = getLordOfHouse(network, houseB);

  // If either house has no lord, no relationship exists
  if (!lordA || !lordB) {
    return false;
  }

  // Check (a): direct planet-planet relationship edges
  if (hasPlanetRelationship(network, lordA, lordB)) {
    return true;
  }

  // Check (b): cross-house lordship (lordA lords houseB or lordB lords houseA)
  // P2-06A freeze: Shared lordship (lordA === lordB) does NOT qualify as a relationship
  if (lordA === lordB) {
    return false;
  }

  const nodeHouseB = `HOUSE:${houseB}`;
  const nodeHouseA = `HOUSE:${houseA}`;

  for (const edge of network.relationships) {
    if (edge.type !== 'LORD_OF') {
      continue;
    }

    // Check if lordA lords houseB
    if (edge.sourceNodeId === `PLANET:${lordA}` && edge.targetNodeId === nodeHouseB) {
      return true;
    }

    // Check if lordB lords houseA
    if (edge.sourceNodeId === `PLANET:${lordB}` && edge.targetNodeId === nodeHouseA) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies if there is a real lord relationship between any kendra and trikona house in the network.
 * This is the semantic verification requirement for DHARMA_KARMA_ALIGNMENT classification.
 * Uses planet-level verification: resolves lords from LORD_OF edges, then checks for
 * real relationship edges between the lords.
 *
 * DESIGN DECISION: Skips kendra === trikona (1↔1 self-pairing) unless methodology explicitly
 * defines it. House 1 is both kendra and trikona, but self-relationships should not qualify
 * as kendra-trikona lord relationships without explicit methodological justification.
 */
function hasKendraTrikonaLordRelationship(network: CareerHouseNetwork): boolean {
  const kendraHousesInNetwork = network.houses.filter(isKendraHouse);
  const trikonaHousesInNetwork = network.houses.filter(isTrikonaHouse);

  // Check each kendra-trikona pair for a lord relationship
  for (const kendra of kendraHousesInNetwork) {
    for (const trikona of trikonaHousesInNetwork) {
      // Skip self-pairing (kendra === trikona, e.g., house 1)
      if (kendra === trikona) {
        continue;
      }

      if (hasLordRelationship(network, kendra, trikona)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines the Kendra-Trikona classification based on house composition and lord relationships.
 * Returns null if the network doesn't qualify for Kendra-Trikona classification.
 */
function classifyKendraTrikona(network: CareerHouseNetwork): {
  classification: CareerPatternClassification;
  ruleId: string;
} | null {
  const houses = network.houses;
  const houseSet = new Set(houses);

  // Must have at least one kendra and one trikona house
  const hasKendra = houses.some(isKendraHouse);
  const hasTrikona = houses.some(isTrikonaHouse);

  if (!hasKendra || !hasTrikona) {
    return null;
  }

  // Verify real lord relationship exists
  if (!hasKendraTrikonaLordRelationship(network)) {
    return null;
  }

  // 9↔10 with lord relationship → DHARMA_KARMA_ALIGNMENT
  if (houseSet.has(9) && houseSet.has(10)) {
    return {
      classification: 'DHARMA_KARMA_ALIGNMENT',
      ruleId: 'RULE_KENDRA_TRIKONA_DHARMA_KARMA_VERIFIED'
    };
  }

  // Kendra house is 10 with lord relationship to trikona → AUTHORITY_PATTERN
  if (houseSet.has(10) && hasKendraTrikonaLordRelationship(network)) {
    return {
      classification: 'AUTHORITY_PATTERN',
      ruleId: 'RULE_KENDRA_TRIKONA_AUTHORITY_VERIFIED'
    };
  }

  // Default: PROFESSIONAL_RISE_PATTERN with verified lord relationship
  return {
    classification: 'PROFESSIONAL_RISE_PATTERN',
    ruleId: 'RULE_KENDRA_TRIKONA_RISE_VERIFIED'
  };
}

/**
 * Builds a Kendra-Trikona pattern from a network.
 */
function buildKendraTrikonaPattern(
  network: CareerHouseNetwork,
  classification: CareerPatternClassification,
  ruleId: string
): CareerPattern {
  const family = 'KENDRA_TRIKONA';
  const topology = network.topology;
  const direction = network.direction;

  const identityKey = buildCareerPatternIdentityKey(
    family,
    classification,
    network.houses,
    topology,
    network.relationships.map(r => r.identityKey)
  );

  const patternId = buildCareerPatternId(identityKey);
  const name = 'Kendra-Trikona Alignment';

  // Kendra-Trikona patterns don't have specific mechanisms at this layer
  // Mechanisms are inferred in the qualification layer
  const mechanisms: readonly CareerMechanism[] = [];

  const relationshipIds = network.relationships.map(r => r.identityKey).sort();

  const evidence: readonly CareerPatternClassificationEvidence[] = Object.freeze([{
    evidenceId: `P2-06D-EVIDENCE:KENDRA_TRIKONA:${ruleId}:${network.identityKey}`,
    ruleId,
    sourceNetworkId: network.networkId,
    sourceNetworkIdentityKey: network.identityKey
  }]);

  const provenance: CareerPatternClassificationProvenance = {
    sourceNetworkIds: [network.networkId],
    relationshipIds,
    ruleIds: [ruleId],
    establishingRelationshipIds: relationshipIds,
    supportingRelationshipIds: []
  };

  return Object.freeze({
    patternId,
    identityKey,
    family,
    level: 'HOUSE_NETWORK',
    classification,
    name,
    topology,
    direction,
    houses: network.houses,
    houseRoles: KENDRA_TRIKONA_HOUSE_ROLES,
    planets: network.lords,
    networkIds: [network.networkId],
    relationshipIds,
    mechanisms,
    relationships: [],
    evidence,
    provenance
  });
}

/**
 * Detects Kendra-Trikona patterns from career house networks.
 * Per spec §9: requires real lord relationships between kendra and trikona houses.
 *
 * SEMANTIC VERIFICATION:
 * - DHARMA_KARMA_ALIGNMENT: requires 9↔10 relationship with verified lord edge
 * - AUTHORITY_PATTERN: requires kendra house 10 with verified lord edge to trikona
 * - PROFESSIONAL_RISE_PATTERN: requires verified lord edge between any kendra and trikona
 *
 * Networks without verified lord relationships are not classified as Kendra-Trikona patterns.
 * They remain as generic CAREER_HOUSE_NETWORK in P2-03.
 *
 * @param networks - The career house networks to analyze
 * @returns Array of Kendra-Trikona patterns
 */
export function detectKendraTrikonaPatterns(
  networks: readonly CareerHouseNetwork[]
): readonly CareerPattern[] {
  const patterns: CareerPattern[] = [];

  for (const network of networks) {
    const classification = classifyKendraTrikona(network);

    if (classification) {
      const pattern = buildKendraTrikonaPattern(
        network,
        classification.classification,
        classification.ruleId
      );
      patterns.push(pattern);
    }
  }

  // Sort by identityKey for deterministic output
  return patterns.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}
