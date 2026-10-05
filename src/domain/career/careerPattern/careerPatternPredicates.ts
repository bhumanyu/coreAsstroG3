import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge } from '../careerGraph/careerAstroGraphTypes';
import { Planet } from '../../../types';

/**
 * P2-06A Relationship Semantic Freeze
 *
 * This module provides frozen structural predicates over CareerHouseNetwork with strict
 * relationship semantics. The freeze defines directional and non-directional relationship
 * types, and explicitly excludes undirected relationships from ordered pathway validation.
 *
 * RELATIONSHIP SEMANTICS (FROZEN):
 * - COMMON_LORD: undirected, can never satisfy directed relationships or ordered chains
 * - OCCUPIES: directional (planet→house), establishes ordered pathways
 * - ASPECTS: directional (planet→house and planet→planet via lord-of-house), establishes ordered pathways
 * - CONJUNCT: direct but undirected, can never satisfy ordered chains
 * - EXCHANGES: bidirectional but never establishes ordered pathways (handled by Parivartana-specific logic)
 * - Cross-house lordship: not directional (no ordered pathway)
 * - Shared participant: no ordered pathway
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
function parsePlanetFromNodeKey(key: string): Planet | null {
  if (key.startsWith('PLANET:')) {
    const planetName = key.slice(7);
    // Type guard to ensure it's a valid Planet enum value
    if (Object.values(Planet).includes(planetName as Planet)) {
      return planetName as Planet;
    }
  }
  return null;
}

/**
 * Returns ALL lords of a house from the network's relationships.
 * Multi-lord facts are preserved; this function never picks one silently.
 * Returns a sorted array for determinism.
 *
 * @param relationships - The graph relationships to search
 * @param house - The house number to get lords for
 * @returns Sorted array of planet names that lord the house
 */
export function getLordsOfHouse(
  relationships: readonly CareerGraphEdge[],
  house: number
): readonly Planet[] {
  const lords: Planet[] = [];
  const houseNodeId = `HOUSE:${house}`;

  for (const edge of relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const targetHouse = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && targetHouse === house) {
        lords.push(planet);
      }
    }
  }

  // Sort for determinism
  return lords.sort();
}

/**
 * Builds a map of planets to the houses they lord from the network's relationships.
 * Only LORD_OF edges are considered; multi-lord facts are preserved.
 *
 * @param relationships - The graph relationships to build the map from
 * @returns Map of planet→houses (LORD_OF only)
 */
export function buildLordshipMap(relationships: readonly CareerGraphEdge[]): Map<Planet, Set<number>> {
  const lordshipMap = new Map<Planet, Set<number>>();

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
 * Checks if there is a common lord relationship between two houses.
 * A common lord relationship exists when the same planet lords both houses.
 * This is an undirected derived relationship — a common lord relates two houses
 * without direction. It is NOT a literal house↔house edge in the CareerAstroGraph.
 *
 * FREEZE SEMANTICS: COMMON_LORD is undirected and can never satisfy directed
 * relationships or ordered chains. It participates in hasDirectHouseRelationship
 * (undirected umbrella) but is explicitly excluded from hasDirectedHouseRelationship
 * and isDirectChain.
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if both houses share a common lord (undirected), false if a===b
 */
export function hasCommonLordRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  // Same house cannot have a common lord relationship with itself
  if (a === b) {
    return false;
  }

  const lordshipMap = buildLordshipMap(network.relationships);

  for (const [planet, houses] of lordshipMap) {
    if (houses.has(a) && houses.has(b)) {
      return true;
    }
  }

  return false;
}

/**
 * Private helper: checks if two planets have a CONJUNCT relationship.
 * CONJUNCT is symmetric — we check both directions.
 */
function hasPlanetConjunction(
  relationships: readonly CareerGraphEdge[],
  planetA: Planet,
  planetB: Planet
): boolean {
  const nodeA = `PLANET:${planetA}`;
  const nodeB = `PLANET:${planetB}`;

  for (const edge of relationships) {
    if (edge.type === 'CONJUNCT') {
      const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
      const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;
      if (connectsAToB || connectsBToA) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Private helper: checks if planetA aspects planetB (directional).
 */
function hasPlanetAspect(
  relationships: readonly CareerGraphEdge[],
  planetA: Planet,
  planetB: Planet
): boolean {
  const nodeA = `PLANET:${planetA}`;
  const nodeB = `PLANET:${planetB}`;

  for (const edge of relationships) {
    if (edge.type === 'ASPECTS' && edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB) {
      return true;
    }
  }

  return false;
}

/**
 * Private helper: checks if two planets have an ASPECTS relationship in either direction.
 */
function hasPlanetAspectEitherDirection(
  relationships: readonly CareerGraphEdge[],
  planetA: Planet,
  planetB: Planet
): boolean {
  return hasPlanetAspect(relationships, planetA, planetB) ||
    hasPlanetAspect(relationships, planetB, planetA);
}

/**
 * Private helper: checks if two planets have an EXCHANGES relationship.
 * EXCHANGES is symmetric — we check both directions.
 */
function hasPlanetExchange(
  relationships: readonly CareerGraphEdge[],
  planetA: Planet,
  planetB: Planet
): boolean {
  const nodeA = `PLANET:${planetA}`;
  const nodeB = `PLANET:${planetB}`;

  for (const edge of relationships) {
    if (edge.type === 'EXCHANGES') {
      const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
      const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;
      if (connectsAToB || connectsBToA) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if there is a directed house-to-house relationship from fromHouse to toHouse.
 * A directed relationship is established by:
 * (1) lord(from) OCCUPIES→toHouse
 * (2) lord(from) ASPECTS→toHouse (house target)
 * (3) lord(from) ASPECTS→lord(to) planet-level, requiring sourceLord !== targetLord
 *
 * FREEZE SEMANTICS: Common lordship, conjunction, and exchange are EXPLICITLY EXCLUDED
 * from directed relationships. These are undirected/bidirectional and cannot satisfy
 * ordered pathways.
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
  return getDirectedHouseRelationshipIds(network, fromHouse, toHouse).length > 0;
}

/**
 * Returns the edge IDs that establish a directed house-to-house relationship from fromHouse to toHouse.
 * A directed relationship is established by:
 * (1) lord(from) OCCUPIES→toHouse
 * (2) lord(from) ASPECTS→toHouse (house target)
 * (3) lord(from) ASPECTS→lord(to) planet-level, requiring sourceLord !== targetLord
 *
 * NOTE: LORD_OF edges are included only as supporting context alongside a real establishing edge,
 * never alone. If no OCCUPIES/ASPECTS establishing edge exists, this function returns [].
 * When at least one directed establishing edge exists, relevant LORD_OF edges are appended
 * (lords of fromHouse participating in establishing edges, plus lords of toHouse for planet-level ASPECTS)
 * to keep evidence complete.
 *
 * FREEZE SEMANTICS: Common lordship, conjunction, and exchange are EXPLICITLY EXCLUDED
 * from directed relationships. These are undirected/bidirectional and cannot satisfy
 * ordered pathways.
 *
 * @param network - The career house network to check
 * @param fromHouse - Source house number (directional source)
 * @param toHouse - Target house number (directional target)
 * @returns Array of edge identityKeys that establish the directed relationship (sorted)
 */
export function getDirectedHouseRelationshipIds(
  network: CareerHouseNetwork,
  fromHouse: number,
  toHouse: number
): readonly string[] {
  const directedIds: string[] = [];
  const fromLords = getLordsOfHouse(network.relationships, fromHouse);
  const toLords = getLordsOfHouse(network.relationships, toHouse);

  for (const edge of network.relationships) {
    // (1) OCCUPIES: planet occupies house - check if the planet lords fromHouse and occupies toHouse
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (fromLords.includes(planet) && house === toHouse) {
          directedIds.push(edge.identityKey);
        }
      }
    }

    // (2) ASPECTS: planet aspects house - check if the planet lords fromHouse and aspects toHouse
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (fromLords.includes(planet) && house === toHouse) {
          directedIds.push(edge.identityKey);
        }
      }
    }
  }

  // (3) Planet-level ASPECTS: lord(from) ASPECTS→lord(to), requiring sourceLord !== targetLord
  for (const sourceLord of fromLords) {
    for (const targetLord of toLords) {
      if (sourceLord !== targetLord) {
        for (const edge of network.relationships) {
          if (edge.type === 'ASPECTS') {
            const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
            const targetPlanet = parsePlanetFromNodeKey(edge.targetNodeId);

            if (planet === sourceLord && targetPlanet === targetLord) {
              directedIds.push(edge.identityKey);
            }
          }
        }
      }
    }
  }

  // If no directed establishing edge exists, return [] (do NOT include LORD_OF alone)
  if (directedIds.length === 0) {
    return [];
  }

  // Append LORD_OF edges as supporting context for the establishing edges
  const lordIds: string[] = [];
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        // Include lords of fromHouse that participate in establishing edges
        if (fromLords.includes(planet) && house === fromHouse) {
          lordIds.push(edge.identityKey);
        }
        // Include lords of toHouse for planet-level ASPECTS establishing edges
        if (toLords.includes(planet) && house === toHouse) {
          lordIds.push(edge.identityKey);
        }
      }
    }
  }

  // Return sorted-unique for determinism
  return [...new Set([...directedIds, ...lordIds])].sort();
}

/**
 * Explicit helper: checks if there is an EXCHANGES relationship between two houses.
 * EXCHANGES is bidirectional but never establishes ordered pathways.
 *
 * FREEZE SEMANTICS: This is a non-directional relationship for ordered pathway purposes.
 * It participates in hasDirectHouseRelationship (undirected umbrella) but is explicitly
 * excluded from hasDirectedHouseRelationship and isDirectChain.
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if an EXCHANGES relationship exists between the houses (bidirectional)
 */
export function hasExchangeRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  const lordshipMap = buildLordshipMap(network.relationships);
  const lordsA = getLordsOfHouse(network.relationships, a);
  const lordsB = getLordsOfHouse(network.relationships, b);

  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      if (hasPlanetExchange(network.relationships, lordA, lordB)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Explicit helper: checks if there is a CONJUNCT relationship between lords of two houses.
 * CONJUNCT is direct but undirected, never establishes ordered direction.
 *
 * FREEZE SEMANTICS: This is a non-directional relationship for ordered pathway purposes.
 * It participates in hasDirectHouseRelationship (undirected umbrella) but is explicitly
 * excluded from hasDirectedHouseRelationship and isDirectChain.
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if lords of the houses are in CONJUNCT (undirected)
 */
export function hasConjunctionRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  const lordsA = getLordsOfHouse(network.relationships, a);
  const lordsB = getLordsOfHouse(network.relationships, b);

  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      if (hasPlanetConjunction(network.relationships, lordA, lordB)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Explicit helper: checks if there is a lord-level ASPECTS relationship between two houses.
 * This checks for ASPECTS between lords in either direction.
 *
 * FREEZE SEMANTICS: This is a non-directional relationship for ordered pathway purposes.
 * While ASPECTS is directional in graph edges, this helper checks both directions and
 * is used in the undirected umbrella (hasDirectHouseRelationship). For ordered pathways,
 * use hasDirectedHouseRelationship which enforces direction.
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if lords of the houses have ASPECTS relationship (either direction)
 */
export function hasLordAspectRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  const lordsA = getLordsOfHouse(network.relationships, a);
  const lordsB = getLordsOfHouse(network.relationships, b);

  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      if (hasPlanetAspectEitherDirection(network.relationships, lordA, lordB)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if there is a direct house-to-house relationship between two houses.
 * A direct relationship is established by:
 * - Common lord relationship (hasCommonLordRelationship) — undirected
 * - Directed house relationship (hasDirectedHouseRelationship in either direction) — directional
 * - Lord conjunction between distinct lords — undirected
 * - Lord aspect (either direction) between distinct lords — undirected
 * - Exchange between distinct lords — bidirectional (undirected for ordered pathways)
 *
 * FREEZE SEMANTICS: This is an undirected umbrella predicate. It includes both directional
 * and non-directional relationships. For ordered pathway validation, use hasDirectedHouseRelationship
 * and isDirectChain which enforce direction.
 *
 * @param network - The career house network to check
 * @param a - First house number
 * @param b - Second house number
 * @returns true if a derived house relationship exists (in either direction or undirected)
 */
export function hasDirectHouseRelationship(
  network: CareerHouseNetwork,
  a: number,
  b: number
): boolean {
  // Common lord (undirected)
  if (hasCommonLordRelationship(network, a, b)) {
    return true;
  }

  // Directed relationship in either direction
  if (hasDirectedHouseRelationship(network, a, b) ||
    hasDirectedHouseRelationship(network, b, a)) {
    return true;
  }

  // Lord conjunction (undirected)
  if (hasConjunctionRelationship(network, a, b)) {
    return true;
  }

  // Lord aspect (either direction, undirected for this predicate)
  if (hasLordAspectRelationship(network, a, b)) {
    return true;
  }

  // Exchange (bidirectional, undirected for ordered pathways)
  if (hasExchangeRelationship(network, a, b)) {
    return true;
  }

  return false;
}

/**
 * Checks if there is a planet-mediated relationship between two houses.
 * A planet-mediated relationship exists when the same planet participates in relationships
 * with both houses, but there is no direct house↔house link.
 *
 * FREEZE SEMANTICS: This is the complement to hasDirectHouseRelationship - it returns
 * true only when connectivity is shared-participant only (not direct house↔house).
 * Shared LORD_OF/OCCUPIES/ASPECTS participation qualifies as planet-mediated.
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

  // Check for shared LORD_OF participation (shared lordship)
  const lordshipMap = buildLordshipMap(network.relationships);
  for (const [planet, houses] of lordshipMap) {
    if (houses.has(a) && houses.has(b)) {
      return true;
    }
  }

  // Check for shared OCCUPIES participation
  const occupiedByA: Set<Planet> = new Set();
  const occupiedByB: Set<Planet> = new Set();

  for (const edge of network.relationships) {
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (house === a) occupiedByA.add(planet);
        if (house === b) occupiedByB.add(planet);
      }
    }
  }

  for (const planet of occupiedByA) {
    if (occupiedByB.has(planet)) {
      return true;
    }
  }

  // Check for shared ASPECTS participation
  const aspectedByA: Set<Planet> = new Set();
  const aspectedByB: Set<Planet> = new Set();

  for (const edge of network.relationships) {
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (house === a) aspectedByA.add(planet);
        if (house === b) aspectedByB.add(planet);
      }
    }
  }

  for (const planet of aspectedByA) {
    if (aspectedByB.has(planet)) {
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
 * FREEZE SEMANTICS: This predicate uses ONLY directed relationships. Undirected
 * relationships (common lord, conjunction, exchange) cannot satisfy ordered pathways.
 * Rejects duplicates and sequences with length < 2.
 *
 * @param network - The career house network to check
 * @param orderedHouses - Array of house numbers in sequence order
 * @returns true if every consecutive pair has a directed house relationship in sequence order
 */
export function isDirectChain(
  network: CareerHouseNetwork,
  orderedHouses: readonly number[]
): boolean {
  return getDirectChainRelationshipIds(network, orderedHouses).length > 0;
}

/**
 * Returns the edge IDs that establish a direct chain for the ordered house sequence.
 * A direct chain requires that every consecutive pair in the sequence satisfies
 * hasDirectedHouseRelationship in the given order.
 *
 * NOTE: LORD_OF edges are included only as supporting context alongside real establishing edges,
 * never alone. If any consecutive pair lacks a directed establishing edge, the chain is broken
 * and this function returns []. After all pairs verify, LORD_OF context edges for chain houses
 * are appended to keep evidence complete.
 *
 * FREEZE SEMANTICS: This predicate uses ONLY directed relationships. Undirected
 * relationships (common lord, conjunction, exchange) cannot satisfy ordered pathways.
 * Rejects duplicates and sequences with length < 2.
 *
 * @param network - The career house network to check
 * @param orderedHouses - Array of house numbers in sequence order
 * @returns Array of edge identityKeys that establish the chain (sorted-unique), empty if not a chain
 */
export function getDirectChainRelationshipIds(
  network: CareerHouseNetwork,
  orderedHouses: readonly number[]
): readonly string[] {
  if (orderedHouses.length < 2) {
    return [];
  }

  // Reject duplicate houses in sequence
  const seen = new Set<number>();
  for (const house of orderedHouses) {
    if (seen.has(house)) {
      return [];
    }
    seen.add(house);
  }

  const pairIds: string[] = [];

  // First, collect establishing edges for each consecutive pair
  for (let i = 0; i < orderedHouses.length - 1; i++) {
    const currentPairIds = getDirectedHouseRelationshipIds(network, orderedHouses[i], orderedHouses[i + 1]);
    if (currentPairIds.length === 0) {
      return []; // Chain broken - no directed establishing edge for this pair
    }
    pairIds.push(...currentPairIds);
  }

  // Only after all pairs verify, append LORD_OF context edges for chain houses
  const lordIds: string[] = [];
  for (const house of orderedHouses) {
    const lords = getLordsOfHouse(network.relationships, house);
    for (const lord of lords) {
      for (const edge of network.relationships) {
        if (edge.type === 'LORD_OF') {
          const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
          const targetHouse = parseHouseFromNodeKey(edge.targetNodeId);
          if (planet === lord && targetHouse === house) {
            lordIds.push(edge.identityKey);
          }
        }
      }
    }
  }

  // Return sorted-unique for determinism
  return [...new Set([...pairIds, ...lordIds])].sort();
}
