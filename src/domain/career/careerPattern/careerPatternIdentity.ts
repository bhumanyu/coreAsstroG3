import type { CareerPatternFamily, CareerPatternClassification } from './careerPatternTypes';
import type { CareerNetworkTopology } from '../careerGraph/careerHouseNetworkTypes';

/**
 * P2-03 Career Pattern Identity
 *
 * This module provides identity key builders for Career patterns.
 *
 * Identity is based on family, classification, houses, topology, and relationshipIds.
 * Identity must NOT include direction, strength, dignity, condition, Dasha, D10, timing, qualification.
 *
 * NETWORK-VS-PATTERN IDENTITY INVARIANT:
 * CareerHouseNetwork.identityKey (P2-02) includes direction, but CareerPattern.identityKey (P2-03) excludes it.
 * Network direction may distinguish two CareerHouseNetworks, but it must not create two CareerPatterns when
 * the underlying semantic pattern identity is otherwise identical. FORWARD/REVERSE networks over the same
 * houses/topology/relationships map to one pattern. Changing either identity definition breaks the other layer.
 */

/**
 * Builds an identity key for a Career pattern.
 *
 * Format: CAREER_PATTERN:<family>:<classification>:HOUSES:<sorted-csv>:TOPOLOGY:<t>:RELATIONSHIPS:<sorted-pipe-list>
 *
 * RELATIONSHIP-IDS-IN-IDENTITY SEMANTICS:
 * Pattern identity contains relationship identity because the same house set can represent different
 * structural mechanisms. Two networks with identical houses/classification/topology but different
 * relationship edges legitimately produce different patterns. This is deliberate and matters before
 * P2-04 qualification.
 *
 * MECHANISMS-NOT-IN-IDENTITY:
 * Mechanisms are inferred from participating planets and relationships, not from structural identity.
 * The same structural pattern can produce different mechanisms based on planetary attributes.
 * Therefore, mechanisms are NOT included in the identity key - they are added as metadata during
 * pattern detection and analysis. Identity remains condition-independent.
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
