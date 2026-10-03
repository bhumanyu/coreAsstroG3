import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerYogaPattern } from './careerPatternTypes';
import { Planet } from '../../../types';
import type { CareerGraphEdgeType } from '../careerGraph/careerAstroGraphTypes';

/**
 * P2-06C Career Yoga Detector
 *
 * This module detects Career Yoga structural patterns.
 * Per spec §20: structural-only representation with no strength/condition/dasha/d10 fields.
 *
 * This detector identifies planetary yoga formations that are career-relevant based on
 * real graph edges (LORD_OF/EXCHANGES/CONJUNCT/ASPECTS). It does NOT calculate strength,
 * qualification, or activation potential - those are handled by P2-04 and later layers.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Edge types that connect planets to houses in the graph.
 */
const PLANET_TO_HOUSE_EDGE_TYPES: ReadonlySet<CareerGraphEdgeType> = Object.freeze(
  new Set<CareerGraphEdgeType>(['LORD_OF', 'EXCHANGES', 'CONJUNCT', 'ASPECTS'])
);

/**
 * Type guard to check if a string is a valid Planet enum value.
 */
function isPlanet(value: string): value is Planet {
  return Object.values(Planet).includes(value as Planet);
}

/**
 * Checks if a network is career-relevant.
 * A network is career-relevant if it includes any career house (2, 6, 10, 11).
 */
function isCareerRelevantNetwork(network: CareerHouseNetwork): boolean {
  const careerHouses = [2, 6, 10, 11];
  return network.houses.some(h => careerHouses.includes(h));
}

/**
 * Extracts planets that have validated lordship edges into the network houses.
 * Per spec: requires planets connected via LORD_OF/EXCHANGES/CONJUNCT/ASPECTS edges to network houses.
 */
function extractParticipantsWithLordship(
  network: CareerHouseNetwork
): readonly Planet[] {
  const participants = new Set<Planet>();
  const networkHouseNodeIds = new Set(
    network.houses.map(h => `HOUSE:${h}`)
  );

  for (const edge of network.relationships) {
    // Check if this edge connects a planet to a network house
    const sourceIsPlanet = edge.sourceNodeId.startsWith('PLANET:');
    const targetIsPlanet = edge.targetNodeId?.startsWith('PLANET:');
    const sourceIsHouse = networkHouseNodeIds.has(edge.sourceNodeId);
    const targetIsHouse = edge.targetNodeId ? networkHouseNodeIds.has(edge.targetNodeId) : false;

    // Only consider edges connecting planets to houses
    if (!PLANET_TO_HOUSE_EDGE_TYPES.has(edge.type)) {
      continue;
    }

    // Extract planet from either source or target
    let planetNodeId: string | null = null;
    if (sourceIsPlanet && targetIsHouse) {
      planetNodeId = edge.sourceNodeId;
    } else if (targetIsPlanet && sourceIsHouse) {
      planetNodeId = edge.targetNodeId!;
    }

    if (planetNodeId) {
      const planetKey = planetNodeId.replace('PLANET:', '');
      if (isPlanet(planetKey)) {
        participants.add(planetKey);
      }
    }
  }

  return Array.from(participants).sort();
}

/**
 * Builds lordships map by reading LORD_OF edges (PLANET → HOUSE).
 * Per spec: derive lordships from real graph edges, not fabricated assignments.
 * LORD_OF participation is distinguished from generic planet-house contact
 * (CONJUNCT/ASPECTS on house nodes alone do not qualify as lordship).
 */
function buildLordships(
  network: CareerHouseNetwork
): Partial<Record<Planet, readonly number[]>> {
  const lordships: Partial<Record<Planet, Set<number>>> = {};
  const networkHouseNodeIds = new Set(
    network.houses.map(h => `HOUSE:${h}`)
  );

  for (const edge of network.relationships) {
    // Only process LORD_OF edges - distinguishes lordship from generic contact
    if (edge.type !== 'LORD_OF') {
      continue;
    }

    const sourceIsPlanet = edge.sourceNodeId.startsWith('PLANET:');
    const targetIsHouse = networkHouseNodeIds.has(edge.targetNodeId);

    if (sourceIsPlanet && targetIsHouse) {
      const planetKey = edge.sourceNodeId.replace('PLANET:', '');
      if (!isPlanet(planetKey)) {
        continue;
      }
      const houseNum = parseInt(edge.targetNodeId!.replace('HOUSE:', ''), 10);

      if (!lordships[planetKey]) {
        lordships[planetKey] = new Set();
      }
      lordships[planetKey]!.add(houseNum);
    }
  }

  // Convert Sets to sorted arrays
  const frozenLordships: Partial<Record<Planet, readonly number[]>> = {};
  for (const [planet, houses] of Object.entries(lordships)) {
    if (isPlanet(planet)) {
      frozenLordships[planet] = Object.freeze(Array.from(houses).sort((a, b) => a - b));
    }
  }

  return Object.freeze(frozenLordships);
}

/**
 * Builds house relationships from LORD_IN_HOUSE/EXCHANGE-derived house pairs.
 * Per spec: derive house relationships from structural facts, not blanket assignments.
 */
function buildHouseRelationships(
  network: CareerHouseNetwork
): Readonly<Record<string, readonly number[]>> {
  const houseRelationships: Record<string, Set<number>> = {};

  // Initialize with empty sets for all houses
  for (const house of network.houses) {
    houseRelationships[`HOUSE_${house}`] = new Set();
  }

  // Add relationships based on edges
  for (const edge of network.relationships) {
    const sourceIsHouse = edge.sourceNodeId.startsWith('HOUSE:');
    const targetIsHouse = edge.targetNodeId?.startsWith('HOUSE:');

    if (sourceIsHouse && targetIsHouse) {
      const sourceHouse = parseInt(edge.sourceNodeId.replace('HOUSE:', ''), 10);
      const targetHouse = parseInt(edge.targetNodeId!.replace('HOUSE:', ''), 10);

      // Add bidirectional relationship
      if (houseRelationships[`HOUSE_${sourceHouse}`]) {
        houseRelationships[`HOUSE_${sourceHouse}`].add(targetHouse);
      }
      if (houseRelationships[`HOUSE_${targetHouse}`]) {
        houseRelationships[`HOUSE_${targetHouse}`].add(sourceHouse);
      }
    }
  }

  // Convert Sets to sorted arrays
  const frozenHouseRelationships: Record<string, readonly number[]> = {};
  for (const [houseKey, relatedHouses] of Object.entries(houseRelationships)) {
    frozenHouseRelationships[houseKey] = Object.freeze(Array.from(relatedHouses).sort((a, b) => a - b));
  }

  return Object.freeze(frozenHouseRelationships);
}

/**
 * Builds a CareerYogaPattern from a network.
 * Per spec §20: structural-only with participants, houseRelationships, lordships, careerRelevant, evidenceIds, ruleIds.
 * Identity: family + sorted participant planets + sorted houses + sorted edge ids (excluding direction).
 */
function buildCareerYogaPattern(
  network: CareerHouseNetwork,
  participants: readonly Planet[],
  lordships: Partial<Record<Planet, readonly number[]>>,
  houseRelationships: Readonly<Record<string, readonly number[]>>,
  ruleId: string
): CareerYogaPattern {
  const family = 'CAREER_YOGA';
  const sortedParticipants = [...participants].sort();
  const sortedHouses = [...network.houses].sort((a, b) => a - b);
  const sortedEdgeIds = network.relationships.map(r => r.identityKey).sort();

  // Build identity matching CareerPattern identity invariant
  const identityKey = `CAREER_YOGA:${family}:PARTICIPANTS:${sortedParticipants.join(',')}:HOUSES:${sortedHouses.join(',')}:EDGES:${sortedEdgeIds.join('|')}`;
  const yogaId = identityKey;
  const name = 'Career Yoga Structure';

  const careerRelevant = isCareerRelevantNetwork(network);

  return Object.freeze({
    yogaId,
    identityKey,
    name,
    participants: Object.freeze(sortedParticipants),
    houseRelationships,
    lordships,
    careerRelevant,
    evidenceIds: network.evidenceIds,
    ruleIds: [ruleId]
  });
}

/**
 * Detects Career Yoga patterns from career house networks.
 * Per spec §20: structural-only detection based on real graph edges.
 *
 * Requirements:
 * - Derive participants from network.relationships edges (planets connected via LORD_OF/EXCHANGES/CONJUNCT/ASPECTS)
 * - Build lordships by reading LORD_OF edges (PLANET → HOUSE)
 * - Build houseRelationships from structural facts
 * - Require ≥2 planets with validated lordship edges into the network
 * - Identity matches CareerPattern invariant (family + sorted participants + sorted houses + sorted edge ids)
 *
 * @param networks - The career house networks to analyze
 * @returns Array of Career Yoga patterns
 */
export function detectCareerYogaPatterns(
  networks: readonly CareerHouseNetwork[]
): readonly CareerYogaPattern[] {
  const patterns: CareerYogaPattern[] = [];

  for (const network of networks) {
    // Extract participants with validated lordship edges
    const participants = extractParticipantsWithLordship(network);

    // Require ≥2 planets with validated lordship edges into the network
    if (participants.length < 2) {
      continue;
    }

    // Only consider career-relevant networks
    if (!isCareerRelevantNetwork(network)) {
      continue;
    }

    // Build lordships from real edges
    const lordships = buildLordships(network);

    // Build house relationships from structural facts
    const houseRelationships = buildHouseRelationships(network);

    // Build yoga pattern
    const pattern = buildCareerYogaPattern(
      network,
      participants,
      lordships,
      houseRelationships,
      'RULE_CAREER_YOGA_STRUCTURE'
    );
    patterns.push(pattern);
  }

  // Sort by identityKey for deterministic output
  return patterns.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}
