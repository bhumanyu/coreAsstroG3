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
 * DIRECT vs PLANET-MEDIATED CONTRACT:
 * - Direct: an actual house↔house edge exists (this predicate)
 * - Planet-mediated: same planet participates in both but no house edge (see hasPlanetMediatedRelationship)
 *
 * EXCHANGES BIDIRECTIONAL BEHAVIOR:
 * EXCHANGES establishes bidirectional lord-exchange between two houses — it is valid for
 * hasDirectedHouseRelationship(a,b) AND hasDirectedHouseRelationship(b,a) simultaneously
 * (Parivartana is genuinely bidirectional). EXCHANGES is the only edge type that can satisfy
 * both a→b and b→a; all other types are single-direction.
 *
 * This predicate excludes planet-mediated-only connectivity where the same planet participates
 * but there is no direct house↔house link (e.g., Mars lords both 6 and 10, but no direct 6↔10 edge).
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if a direct house↔house relationship exists (in either direction)
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
 * Checks if there is a directed house-to-house relationship from fromHouse to toHouse.
 * A directed relationship checks edges in one direction only — (sourceHouses.has(from) && targetHouses.has(to))
 * without the || mirror check. This is used for ordered pathway validation.
 *
 * DIRECT vs PLANET-MEDIATED CONTRACT:
 * - Direct: an actual house↔house edge exists (this predicate)
 * - Planet-mediated: same planet participates in both but no house edge (see hasPlanetMediatedRelationship)
 *
 * EXCHANGES BIDIRECTIONAL BEHAVIOR:
 * EXCHANGES establishes bidirectional lord-exchange between two houses — it is valid for
 * hasDirectedHouseRelationship(a,b) AND hasDirectedHouseRelationship(b,a) simultaneously
 * (Parivartana is genuinely bidirectional). EXCHANGES is the only edge type that can satisfy
 * both a→b and b→a; all other types are single-direction.
 *
 * @param network - The career house network to check
 * @param fromHouse - Source house number (directional source)
 * @param toHouse - Target house number (directional target)
 * @returns true if a directed house→house relationship exists from fromHouse to toHouse
 */
export function hasDirectedHouseRelationship(
  network: CareerHouseNetwork,
  fromHouse: number,
  toHouse: number
): boolean {
  const lordshipMap = buildLordshipMap(network.relationships);

  for (const edge of network.relationships) {
    // EXCHANGES: direct planet-mediated exchange between houses (bidirectional)
    if (edge.type === 'EXCHANGES') {
      const sourcePlanet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const targetPlanet = parsePlanetFromNodeKey(edge.targetNodeId);

      if (sourcePlanet && targetPlanet) {
        // EXCHANGES is bidirectional: check if source lords fromHouse and target lords toHouse
        // OR if source lords toHouse and target lords fromHouse
        const sourceHouses = lordshipMap.get(sourcePlanet);
        const targetHouses = lordshipMap.get(targetPlanet);

        if (sourceHouses && targetHouses) {
          if ((sourceHouses.has(fromHouse) && targetHouses.has(toHouse)) ||
            (sourceHouses.has(toHouse) && targetHouses.has(fromHouse))) {
            return true;
          }
        }
      }
    }

    // LORD_OF: planet lords house - check if this planet lords both fromHouse and toHouse
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses && houses.has(fromHouse) && houses.has(toHouse)) {
          return true;
        }
      }
    }

    // OCCUPIES: planet occupies house - check if the planet lords fromHouse and occupies toHouse
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses) {
          // If planet lords fromHouse and occupies toHouse
          if (houses.has(fromHouse) && house === toHouse) {
            return true;
          }
        }
      }
    }

    // ASPECTS: planet aspects house - check if the planet lords fromHouse and aspects toHouse
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        const houses = lordshipMap.get(planet);
        if (houses) {
          // If planet lords fromHouse and aspects toHouse
          if (houses.has(fromHouse) && house === toHouse) {
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
 * DIRECT vs PLANET-MEDIATED CONTRACT:
 * - Direct: an actual house↔house edge exists (see hasDirectHouseRelationship)
 * - Planet-mediated: same planet participates in both but no house edge (this predicate)
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
 * hasDirectedHouseRelationship in the given order.
 *
 * ORDERED PATHWAY CONTRACT:
 * isDirectChain([a,b,c]) means a→b AND b→c (directed edges), not just connectivity.
 * This predicate uses ONLY directed relationships, never planet-mediated ones.
 *
 * @param network - The career house network to check
 * @param orderedHouses - Array of house numbers in sequence order
 * @returns true if every consecutive pair has a directed house relationship in sequence order
 */
export function isDirectChain(
  network: CareerHouseNetwork,
  orderedHouses: readonly number[]
): boolean {
  if (orderedHouses.length < 2) {
    return false;
  }

  for (let i = 0; i < orderedHouses.length - 1; i++) {
    if (!hasDirectedHouseRelationship(network, orderedHouses[i], orderedHouses[i + 1])) {
      return false;
    }
  }

  return true;
}


