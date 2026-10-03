import type { CareerNetworkTopology, CareerNetworkDirection } from './careerHouseNetworkTypes';
import type { CareerHouseConnection } from './careerNetworkDetectionTypes';

/**
 * P2-02 Career Network Detection Rules
 *
 * This module provides topology resolution and direction analysis for career house networks.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 *
 * It is a pure structural adapter over the CareerAstroGraph.
 *
 * Topology Precedence Order (strict):
 * 1. DIRECT_LINK (2 nodes) - Simplest case
 * 2. TRIANGLE (3 nodes, all degree 2) - Checked before LOOP because a triangle is also a loop
 * 3. LOOP (≥3 nodes, all degree 2) - But not a triangle
 * 4. STAR (one node of degree n-1, rest degree 1)
 * 5. CHAIN (exactly two degree-1, rest degree-2)
 * 6. CLUSTER (fallback for any other configuration)
 *
 * The TRIANGLE → LOOP precedence is semantically required: a triangle is technically a loop
 * (all nodes have degree 2), but we want to classify it as TRIANGLE for its special significance.
 *
 * SHARED_PARTICIPANT Topology Rule:
 * - A component connected purely through one shared participant (pairwise clique of n houses)
 *   classifies as STAR (participant-mediated hub), NOT TRIANGLE/LOOP
 * - When computing degree for topology, count only DIRECT connections toward CHAIN/TRIANGLE/LOOP eligibility
 * - SHARED_PARTICIPANT-only components resolve to STAR (single participant) or CLUSTER (multiple participants)
 *
 * Direction Resolution Rule:
 * - BIDIRECTIONAL: if any house pair has directed connections in both directions
 * - FORWARD: if directed connections flow predominantly from lower-numbered to higher-numbered houses
 * - REVERSE: if directed connections flow predominantly from higher-numbered to lower-numbered houses
 * - For SHARED_PARTICIPANT-only connections: direction is derived from participant edge orientation
 *   (planet→house = FORWARD semantics, house→planet = REVERSE semantics)
 *
 * Golden tests:
 * - 6→10→11 produces FORWARD
 * - 11→10→6 produces REVERSE
 * - A two-way pair produces BIDIRECTIONAL
 */

/**
 * Adjacency map representation for topology analysis.
 * Maps house number to set of connected house numbers.
 */
type HouseAdjacency = Map<number, Set<number>>;

/**
 * Calculates the degree of each node in the adjacency map.
 */
function calculateDegrees(adjacency: HouseAdjacency): Map<number, number> {
  const degrees = new Map<number, number>();
  for (const [house, neighbors] of adjacency.entries()) {
    degrees.set(house, neighbors.size);
  }
  return degrees;
}

/**
 * Checks if the component is a triangle (3 nodes, all degree 2).
 */
function isTriangle(houses: readonly number[], degrees: Map<number, number>): boolean {
  if (houses.length !== 3) {
    return false;
  }
  for (const house of houses) {
    if (degrees.get(house) !== 2) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the component is a loop (≥3 nodes, all degree 2).
 * Used only after triangle check has failed.
 */
function isLoop(houses: readonly number[], degrees: Map<number, number>): boolean {
  if (houses.length < 3) {
    return false;
  }
  for (const house of houses) {
    if (degrees.get(house) !== 2) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the component is a star (one node of degree n-1, rest degree 1).
 */
function isStar(houses: readonly number[], degrees: Map<number, number>): boolean {
  if (houses.length < 3) {
    return false;
  }
  const degreeValues = Array.from(degrees.values());
  const maxDegree = Math.max(...degreeValues);
  const degreeOneCount = degreeValues.filter(d => d === 1).length;

  // Star: one center with degree n-1, all others degree 1
  return maxDegree === houses.length - 1 && degreeOneCount === houses.length - 1;
}

/**
 * Checks if the component is a chain (exactly two degree-1, rest degree-2).
 */
function isChain(houses: readonly number[], degrees: Map<number, number>): boolean {
  if (houses.length < 3) {
    return false;
  }
  const degreeValues = Array.from(degrees.values());
  const degreeOneCount = degreeValues.filter(d => d === 1).length;
  const degreeTwoCount = degreeValues.filter(d => d === 2).length;

  // Chain: exactly two endpoints (degree 1), rest are interior (degree 2)
  return degreeOneCount === 2 && degreeTwoCount === houses.length - 2;
}

/**
 * Resolves the network topology from house nodes and adjacency map.
 *
 * Uses strict precedence order:
 * DIRECT_LINK → TRIANGLE → LOOP → STAR → CHAIN → CLUSTER
 *
 * SHARED_PARTICIPANT Topology Rule:
 * - When computing degree for topology, count only DIRECT connections toward CHAIN/TRIANGLE/LOOP eligibility
 * - SHARED_PARTICIPANT-only components resolve to STAR (single participant) or CLUSTER (multiple participants)
 *
 * @param houses - Array of house numbers in the component
 * @param adjacency - Adjacency map representing connections (used for connectivity)
 * @param connections - Array of house connections with kind information
 * @returns The resolved topology
 */
export function resolveCareerNetworkTopology(
  houses: readonly number[],
  adjacency: HouseAdjacency,
  connections: readonly CareerHouseConnection[]
): CareerNetworkTopology {
  const n = houses.length;

  // DIRECT_LINK: exactly 2 nodes
  if (n === 2) {
    return 'DIRECT_LINK';
  }

  // Check if all connections are SHARED_PARTICIPANT
  const allSharedParticipant = connections.every(conn => conn.kind === 'SHARED_PARTICIPANT');

  // Count unique participants
  const uniqueParticipants = new Set<string>();
  for (const conn of connections) {
    for (const participant of conn.participantNodeIds) {
      uniqueParticipants.add(participant);
    }
  }

  // SHARED_PARTICIPANT-only components
  if (allSharedParticipant) {
    if (uniqueParticipants.size === 1) {
      // Single participant connecting all houses -> STAR (participant-mediated hub)
      return 'STAR';
    } else {
      // Multiple participants -> CLUSTER
      return 'CLUSTER';
    }
  }

  // Build adjacency considering only DIRECT connections for CHAIN/TRIANGLE/LOOP eligibility
  const directAdjacency = new Map<number, Set<number>>();
  for (const house of houses) {
    directAdjacency.set(house, new Set());
  }

  for (const conn of connections) {
    if (conn.kind === 'DIRECT') {
      directAdjacency.get(conn.houseA)!.add(conn.houseB);
      directAdjacency.get(conn.houseB)!.add(conn.houseA);
    }
  }

  const directDegrees = calculateDegrees(directAdjacency);

  // TRIANGLE: 3 nodes, all degree 2 (checked before LOOP)
  // Only applies if all connections are DIRECT
  if (isTriangle(houses, directDegrees)) {
    return 'TRIANGLE';
  }

  // LOOP: ≥3 nodes, all degree 2 (but not a triangle)
  // Only applies if all connections are DIRECT
  if (isLoop(houses, directDegrees)) {
    return 'LOOP';
  }

  // CHAIN: exactly two degree-1, rest degree-2
  // Only applies if all connections are DIRECT
  if (isChain(houses, directDegrees)) {
    return 'CHAIN';
  }

  // For STAR and CLUSTER, use the full adjacency (including SHARED_PARTICIPANT)
  const fullDegrees = calculateDegrees(adjacency);

  // STAR: one node of degree n-1, rest degree 1
  // Can be either DIRECT or SHARED_PARTICIPANT
  if (isStar(houses, fullDegrees)) {
    return 'STAR';
  }

  // CLUSTER: fallback for any other configuration
  return 'CLUSTER';
}

/**
 * Resolves the network direction from directed house connections.
 *
 * Deterministic contract:
 * - BIDIRECTIONAL if any house pair has directed connections in both directions
 * - FORWARD if directed connections flow predominantly from lower-numbered to higher-numbered houses
 * - REVERSE if directed connections flow predominantly from higher-numbered to lower-numbered houses
 * - For SHARED_PARTICIPANT-only connections: direction is derived from participant edge orientation
 *   (planet→house = FORWARD semantics, house→planet = REVERSE semantics)
 *
 * @param connections - Array of house connections with directed connections
 * @returns The resolved direction (FORWARD, REVERSE, or BIDIRECTIONAL)
 */
export function resolveCareerNetworkDirection(
  connections: readonly CareerHouseConnection[]
): CareerNetworkDirection {
  // Track directed connections per house pair
  const directedPairs = new Map<string, Set<'FORWARD' | 'REVERSE'>>();

  for (const conn of connections) {
    for (const directed of conn.directedConnections) {
      const key = `${Math.min(directed.sourceHouse, directed.targetHouse)}-${Math.max(directed.sourceHouse, directed.targetHouse)}`;

      if (!directedPairs.has(key)) {
        directedPairs.set(key, new Set());
      }

      // Determine direction based on actual source/target
      if (directed.sourceHouse < directed.targetHouse) {
        directedPairs.get(key)!.add('FORWARD');
      } else if (directed.sourceHouse > directed.targetHouse) {
        directedPairs.get(key)!.add('REVERSE');
      }
    }
  }

  // Check if any pair has bidirectional flow
  for (const directions of directedPairs.values()) {
    if (directions.has('FORWARD') && directions.has('REVERSE')) {
      return 'BIDIRECTIONAL';
    }
  }

  // Count overall direction dominance
  let forwardCount = 0;
  let reverseCount = 0;

  for (const directions of directedPairs.values()) {
    if (directions.has('FORWARD')) {
      forwardCount++;
    }
    if (directions.has('REVERSE')) {
      reverseCount++;
    }
  }

  // Determine direction based on dominance
  if (forwardCount > reverseCount) {
    return 'FORWARD';
  } else if (reverseCount > forwardCount) {
    return 'REVERSE';
  }

  // If no directed connections or equal counts, default to FORWARD
  return 'FORWARD';
}
