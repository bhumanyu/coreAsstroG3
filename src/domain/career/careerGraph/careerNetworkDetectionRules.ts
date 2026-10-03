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
 * Counts undirected edges in the adjacency map.
 * Each edge is counted once regardless of direction.
 */
function countUndirectedEdges(adjacency: HouseAdjacency): number {
  let count = 0;
  const seen = new Set<string>();
  for (const [house, neighbors] of adjacency.entries()) {
    for (const neighbor of neighbors) {
      const key = [Math.min(house, neighbor), Math.max(house, neighbor)].join(',');
      if (!seen.has(key)) {
        seen.add(key);
        count++;
      }
    }
  }
  return count;
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
 * @param houses - Array of house numbers in the component
 * @param adjacency - Adjacency map representing connections
 * @returns The resolved topology
 */
export function resolveCareerNetworkTopology(
  houses: readonly number[],
  adjacency: HouseAdjacency
): CareerNetworkTopology {
  const n = houses.length;

  // DIRECT_LINK: exactly 2 nodes
  if (n === 2) {
    return 'DIRECT_LINK';
  }

  const degrees = calculateDegrees(adjacency);

  // TRIANGLE: 3 nodes, all degree 2 (checked before LOOP)
  if (isTriangle(houses, degrees)) {
    return 'TRIANGLE';
  }

  // LOOP: ≥3 nodes, all degree 2 (but not a triangle)
  if (isLoop(houses, degrees)) {
    return 'LOOP';
  }

  // STAR: one node of degree n-1, rest degree 1
  if (isStar(houses, degrees)) {
    return 'STAR';
  }

  // CHAIN: exactly two degree-1, rest degree-2
  if (isChain(houses, degrees)) {
    return 'CHAIN';
  }

  // CLUSTER: fallback for any other configuration
  return 'CLUSTER';
}

/**
 * Resolves the network direction from directed house connections.
 *
 * @param connections - Array of house connections with source edge IDs
 * @returns The resolved direction (FORWARD, REVERSE, or BIDIRECTIONAL)
 */
export function resolveCareerNetworkDirection(
  connections: readonly CareerHouseConnection[]
): CareerNetworkDirection {
  // Direction is based on the directed nature of connections
  // If we have both directions present, it's BIDIRECTIONAL
  // Otherwise, determine direction from the primary flow

  // Build a map of directed connections
  const forwardMap = new Map<string, boolean>();
  const reverseMap = new Map<string, boolean>();

  for (const conn of connections) {
    const key = `${conn.houseA}-${conn.houseB}`;
    const reverseKey = `${conn.houseB}-${conn.houseA}`;

    // Mark forward direction exists
    forwardMap.set(key, true);
    // Mark reverse direction exists
    reverseMap.set(reverseKey, true);
  }

  // Check if we have bidirectional flow
  let hasForward = false;
  let hasReverse = false;

  for (const conn of connections) {
    const key = `${conn.houseA}-${conn.houseB}`;
    const reverseKey = `${conn.houseB}-${conn.houseA}`;

    if (forwardMap.has(key)) {
      hasForward = true;
    }
    if (forwardMap.has(reverseKey)) {
      hasReverse = true;
    }
  }

  if (hasForward && hasReverse) {
    return 'BIDIRECTIONAL';
  }

  // For now, default to FORWARD if no bidirectional flow
  // In a more sophisticated implementation, we could analyze the actual
  // edge directions from the source graph
  return 'FORWARD';
}
