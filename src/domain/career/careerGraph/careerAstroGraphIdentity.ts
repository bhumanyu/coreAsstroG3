import type { CareerGraphNodeType, CareerGraphEdgeType } from './careerAstroGraphTypes';

/**
 * Builds a canonical node ID for a CareerAstroGraph node.
 * Format: `${type}:${key}`
 *
 * Examples:
 * - HOUSE:10 → HOUSE:10
 * - PLANET:SATURN → PLANET:SATURN
 *
 * Identity must exclude strength/dignity/condition.
 *
 * @param type - The node type (HOUSE or PLANET)
 * @param key - The node key (house number as string, or planet name)
 * @returns The canonical node ID
 */
export function buildCareerGraphNodeId(
  type: CareerGraphNodeType,
  key: string
): string {
  return `${type}:${key}`;
}

/**
 * Builds a canonical edge identity key for a CareerAstroGraph edge.
 * Format: `${type}:${sourceNodeId}→${targetNodeId}`
 *
 * Examples:
 * - LORD_OF:PLANET:SATURN→HOUSE:10 → LORD_OF:PLANET:SATURN→HOUSE:10
 *
 * Identity must exclude strength/dignity/condition.
 *
 * @param type - The edge type
 * @param sourceNodeId - The source node ID
 * @param targetNodeId - The target node ID
 * @returns The canonical edge identity key
 */
export function buildCareerGraphEdgeIdentityKey(
  type: CareerGraphEdgeType,
  sourceNodeId: string,
  targetNodeId: string
): string {
  return `${type}:${sourceNodeId}→${targetNodeId}`;
}
