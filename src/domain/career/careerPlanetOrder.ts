import { Planet } from '../../types';
import type { ParticipantId } from './careerParticipantRoles/participantRoleTypes';

/**
 * Canonical planet order for Career domain processing.
 * Matches the 9-planet Vedic system: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
 *
 * This constant is frozen and used across multiple Career modules to ensure deterministic
 * ordering of planetary operations.
 */
export const CANONICAL_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
] as const);

/**
 * Canonical planet order lookup map for O(1) ordering comparisons.
 */
const CANONICAL_ORDER_MAP: ReadonlyMap<Planet, number> = new Map(
  CANONICAL_PLANET_ORDER.map((planet, index) => [planet, index])
);

/**
 * Compares two participant IDs using canonical planet order.
 * Returns negative if a comes before b, positive if a comes after b, 0 if equal.
 *
 * @param a - First participant ID (PLANET:{Planet})
 * @param b - Second participant ID (PLANET:{Planet})
 * @returns Comparison result for sorting
 */
export function compareParticipantIds(a: ParticipantId, b: ParticipantId): number {
  const planetA = a.replace('PLANET:', '') as Planet;
  const planetB = b.replace('PLANET:', '') as Planet;

  const orderA = CANONICAL_ORDER_MAP.get(planetA) ?? 999;
  const orderB = CANONICAL_ORDER_MAP.get(planetB) ?? 999;

  return orderA - orderB;
}
