import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge } from '../careerGraph/careerAstroGraphTypes';

/**
 * P2-03 Career Pattern Predicates
 *
 * This module provides frozen structural predicates over CareerHouseNetwork.
 * These predicates enable pathway validation before semantic classification, ensuring that specialized
 * pattern names are only emitted when the required structural relationships are established.
 *
 * This layer is pure structural predicate logic only - it does NOT calculate strength, confidence,
 * scores, qualification, activation, Dasha, D10, transit, mechanism, or prediction.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Helper to extract house number from a node key.
 * Node keys are formatted as 'HOUSE:<number>' or 'PLANET:<name>'.
 */
function parseHouseFromNodeKey(key: string): number | null {
  if (key.startsWith('HOUSE:')) {
    return parseInt(key.slice(6), 10);
  }
  return null;
}

/**
 * Helper to extract planet name from a node key.
 * Node keys are formatted as 'PLANET:<name>' or 'HOUSE:<number>'.
 */
function parsePlanetFromNodeKey(key: string): string | null {
  if (key.startsWith('PLANET:')) {
    return key.slice(7);
  }
  return null;
}

/**
 * Builds a map of planets to the houses they lord from the network's relationships.
 */
function buildLordshipMap(relationships: readonly CareerGraphEdge[]): Map<string, Set<number>> {
  const lordshipMap = new Map<string, Set<number>>();

  for (const edge of relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (!lordshipMap.has(planet)) {
          lordshipMap.set(planet, new Set());
        }
        lordshipMap.get(planet)!.add(house);
      }
    }
  }

  return lordshipMap;
}

/**
 * Checks if there is a direct house-to-house relationship between two houses.
 * A direct relationship is established by:
 * - EXCHANGES edge between two planets (implies exchange between their houses)
 * - LORD_OF edge from a planet that lords both house A and house B
 * - OCCUPIES edge from a planet that lords house A to house B (or vice versa)
 * - ASPECTS edge from a planet that lords house A to house B (or vice versa)
 *
 * This predicate excludes planet-mediated-only connectivity where the same planet participates
 * but there is no direct house↔house link (e.g., Mars lords both 6 and 10, but no direct 6↔10 edge).
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if a direct house↔house relationship exists
 */
export function hasDirectHouseRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  const lordshipMap = buildLordshipMap(network.relationships);

  for (const edge of network.relationships) {
    // EXCHANGES: direct planet-mediated exchange between houses
    if (edge.type === 'EXCHANGES') {
      const sourcePlanet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const targetPlanet = parsePlanetFromNodeKey(edge.targetNodeId);

      if (sourcePlanet && targetPlanet) {
        // Check if these planets lord houses a and b (in any order)
        const sourceHouses = lordshipMap.get(sourcePlanet);
        const targetHouses = lordshipMap.get(targetPlanet);

        if (sourceHouses && targetHouses) {
          if ((sourceHouses.has(a) && targetHouses.has(b)) ||
            (sourceHouses.has(b) && targetHouses.has(a))) {
            return true;
          }
        }
      }
    }

    // LORD_OF: planet lords house - check if this planet lords both a and b
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses && houses.has(a) && houses.has(b)) {
          return true;
        }
      }
    }

    // OCCUPIES: planet occupies house - check if the planet lords the other house
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses) {
          // If planet lords a and occupies b, or lords b and occupies a
          if ((houses.has(a) && house === b) || (houses.has(b) && house === a)) {
            return true;
          }
        }
      }
    }

    // ASPECTS: planet aspects house - check if the planet lords the other house
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses) {
          // If planet lords a and aspects b, or lords b and aspects a
          if ((houses.has(a) && house === b) || (houses.has(b) && house === a)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Checks if there is a planet-mediated relationship between two houses.
 * A planet-mediated relationship exists when the same planet participates in relationships
 * with both houses, but there is no direct house↔house link.
 *
 * This is the complement to hasDirectHouseRelationship - it returns true only when
 * connectivity is shared-participant only (not direct house↔house).
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if there is only a planet-mediated relationship (no direct house↔house link)
 */
export function hasPlanetMediatedRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  // If there's a direct relationship, this is not planet-mediated-only
  if (hasDirectHouseRelationship(network, a, b)) {
    return false;
  }

  // Check for shared planet participation via lordship
  const lordshipMap = buildLordshipMap(network.relationships);

  for (const [planet, houses] of lordshipMap) {
    if (houses.has(a) && houses.has(b)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the ordered house sequence forms a direct chain.
 * A direct chain requires that every consecutive pair in the sequence satisfies
 * hasDirectHouseRelationship in the given order.
 *
 * @param network - The career house network to check
 * @param orderedHouses - Array of house numbers in sequence order
 * @returns true if every consecutive pair has a direct house relationship
 */
export function isDirectChain(
  network: CareerHouseNetwork,
  orderedHouses: readonly number[]
): boolean {
  if (orderedHouses.length < 2) {
    return false;
  }

  for (let i = 0; i < orderedHouses.length - 1; i++) {
    if (!hasDirectHouseRelationship(network, orderedHouses[i], orderedHouses[i + 1])) {
      return false;
    }
  }

  return true;
}

/**
 * Thin wrapper over network.topology to check if the network is a STAR.
 * A STAR topology has one central node connected to all other nodes.
 *
 * @param network - The career house network to check
 * @returns true if topology is STAR
 */
export function isStar(network: CareerHouseNetwork): boolean {
  return network.topology === 'STAR';
}

/**
 * Thin wrapper over network.topology to check if the network is a TRIANGLE.
 * A TRIANGLE topology has three nodes with mutual connections.
 *
 * @param network - The career house network to check
 * @returns true if topology is TRIANGLE
 */
export function isTriangle(network: CareerHouseNetwork): boolean {
  return network.topology === 'TRIANGLE';
}

/**
 * Thin wrapper over network.topology to check if the network is a LOOP.
 * A LOOP topology has nodes forming a cycle.
 *
 * @param network - The career house network to check
 * @returns true if topology is LOOP
 */
export function isLoop(network: CareerHouseNetwork): boolean {
  return network.topology === 'LOOP';
}

/**
 * Thin wrapper over network.topology to check if the network is SHARED_PARTICIPANT.
 * A SHARED_PARTICIPANT topology has connectivity through shared planets only.
 *
 * @param network - The career house network to check
 * @returns true if topology is CLUSTER (represents shared-participant connectivity)
 */
export function isSharedParticipant(network: CareerHouseNetwork): boolean {
  return network.topology === 'CLUSTER';
}
