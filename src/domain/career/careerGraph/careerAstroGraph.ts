import type { CareerAstroGraph, CareerGraphNode, CareerGraphEdge } from './careerAstroGraphTypes';
import { CANONICAL_CAREER_PLANET_ORDER } from './careerGraphConstants';

/**
 * Validates referential integrity of a CareerAstroGraph.
 * Ensures every edge.sourceNodeId and edge.targetNodeId exists among the nodes.
 *
 * @param graph - The graph to validate
 * @throws Error if any edge references a non-existent node
 */
export const validateGraphReferences = (graph: CareerAstroGraph): void => {
  const nodeIds = new Set(graph.nodes.map(node => node.nodeId));

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      throw new Error(
        `Edge ${edge.edgeId} references non-existent source node: ${edge.sourceNodeId}`
      );
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      throw new Error(
        `Edge ${edge.edgeId} references non-existent target node: ${edge.targetNodeId}`
      );
    }
  }
}

/**
 * Deep freezes a CareerAstroGraph for immutability.
 * Freezes the graph object, its nodes array, its edges array, and each individual node and edge.
 *
 * @param graph - The graph to freeze
 * @returns The frozen graph
 */
export const freezeGraph = (graph: CareerAstroGraph): CareerAstroGraph => {
  // Freeze each node
  for (const node of graph.nodes) {
    Object.freeze(node);
  }

  // Freeze each edge
  for (const edge of graph.edges) {
    Object.freeze(edge);
  }

  // Freeze the arrays
  Object.freeze(graph.nodes);
  Object.freeze(graph.edges);

  // Freeze the graph object
  Object.freeze(graph);

  return graph;
}

/**
 * Compares two CareerGraphNodes for canonical ordering.
 * Ordering rules:
 * 1. HOUSE nodes before PLANET nodes
 * 2. HOUSE nodes by numeric house value
 * 3. PLANET nodes by canonical planet index (SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU)
 *
 * @param a - First node
 * @param b - Second node
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export const compareCareerGraphNodes = (a: CareerGraphNode, b: CareerGraphNode): number => {
  // HOUSE before PLANET
  if (a.type === 'HOUSE' && b.type === 'PLANET') {
    return -1;
  }
  if (a.type === 'PLANET' && b.type === 'HOUSE') {
    return 1;
  }

  // Both are HOUSE - sort by numeric value
  if (a.type === 'HOUSE' && b.type === 'HOUSE') {
    const houseA = parseInt(a.key, 10);
    const houseB = parseInt(b.key, 10);
    return houseA - houseB;
  }

  // Both are PLANET - sort by canonical order
  if (a.type === 'PLANET' && b.type === 'PLANET') {
    const indexA = CANONICAL_CAREER_PLANET_ORDER.indexOf(a.key as any);
    const indexB = CANONICAL_CAREER_PLANET_ORDER.indexOf(b.key as any);
    return indexA - indexB;
  }

  return 0;
}

/**
 * Compares two CareerGraphEdges for canonical ordering.
 * Sorts deterministically by identityKey.
 *
 * @param a - First edge
 * @param b - Second edge
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export const compareCareerGraphEdges = (a: CareerGraphEdge, b: CareerGraphEdge): number => {
  return a.identityKey.localeCompare(b.identityKey);
}
