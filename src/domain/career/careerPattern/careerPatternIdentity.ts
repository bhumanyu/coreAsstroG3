import type { CareerPatternFamily, CareerPatternClassification } from './careerPatternTypes';
import type { CareerNetworkTopology } from '../careerGraph/careerHouseNetworkTypes';

/**
 * P2-03 Career Pattern Identity
 *
 * This module provides identity key builders for Career patterns.
 *
 * Identity is based on family, classification, houses, topology, and relationshipIds.
 * Identity must NOT include direction, strength, dignity, condition, Dasha, D10, timing, qualification.
 */

/**
 * Builds an identity key for a Career pattern.
 *
 * Format: CAREER_PATTERN:<family>:<classification>:HOUSES:<sorted-csv>:TOPOLOGY:<t>:RELATIONSHIPS:<sorted-pipe-list>
 *
 * @param family - The pattern family
 * @param classification - The pattern classification
 * @param houses - The houses in the pattern (will be sorted)
 * @param topology - The network topology
 * @param relationshipIds - The relationship identity keys (will be sorted)
 * @returns The identity key for the pattern
 */
export function buildCareerPatternIdentityKey(
  family: CareerPatternFamily,
  classification: CareerPatternClassification,
  houses: readonly number[],
  topology: CareerNetworkTopology,
  relationshipIds: readonly string[]
): string {
  const sortedHouses = [...houses].sort((a, b) => a - b);
  const sortedRelationshipIds = [...relationshipIds].sort();
  const housesCsv = sortedHouses.join(',');
  const relationshipsPipe = sortedRelationshipIds.join('|');

  return `CAREER_PATTERN:${family}:${classification}:HOUSES:${housesCsv}:TOPOLOGY:${topology}:RELATIONSHIPS:${relationshipsPipe}`;
}

/**
 * Builds a pattern ID from an identity key.
 * The pattern ID is the same as the identity key.
 *
 * @param identityKey - The identity key
 * @returns The pattern ID (same as identity key)
 */
export function buildCareerPatternId(identityKey: string): string {
  return identityKey;
}
