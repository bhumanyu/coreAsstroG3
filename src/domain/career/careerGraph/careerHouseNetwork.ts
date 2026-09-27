import type {
  CareerHouseNetwork,
  CareerNetworkTopology,
  CareerNetworkDirection
} from './careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from './careerAstroGraphTypes';
import type { Planet } from '../../../types';
import { normalizeCareerGraphProvenance, mergeCareerGraphProvenances } from './careerAstroGraphProvenance';

/**
 * Builds a deterministic network identity key.
 * Format: `${sortedHouses}:${topology}:${sortedRelationshipIdentities}`
 *
 * Identity is based on sorted house set + topology + structural relationship identity (per §26–27).
 * Identity must NOT include strength/dignity/condition/Dasha.
 *
 * @param houses - Array of house numbers
 * @param topology - The network topology
 * @param relationships - Array of graph edges
 * @returns The deterministic network identity key
 */
export function buildCareerHouseNetworkIdentityKey(
  houses: readonly number[],
  topology: CareerNetworkTopology,
  relationships: readonly CareerGraphEdge[]
): string {
  const sortedHouses = [...houses].sort((a, b) => a - b).join(',');
  const sortedRelationshipIdentities = [...relationships]
    .map(r => r.identityKey)
    .sort()
    .join(',');

  return `${sortedHouses}:${topology}:${sortedRelationshipIdentities}`;
}

/**
 * Builds a CareerHouseNetwork from a set of graph edges.
 *
 * This provides only the structural representation and deterministic identity.
 * Does NOT implement sophisticated automatic topology detection or semantic pattern classification
 * (that is P2-02/P2-03).
 *
 * @param houses - Array of house numbers in the network
 * @param lords - Array of planet lords in the network
 * @param relationships - Array of graph edges representing the network
 * @param topology - The network topology
 * @param direction - The network direction
 * @param provenance - Provenance information
 * @param evidenceIds - Array of evidence IDs
 * @returns A frozen CareerHouseNetwork
 */
export function buildCareerHouseNetwork(
  houses: readonly number[],
  lords: readonly Planet[],
  relationships: readonly CareerGraphEdge[],
  topology: CareerNetworkTopology,
  direction: CareerNetworkDirection,
  provenance: CareerGraphProvenance,
  evidenceIds: readonly string[]
): CareerHouseNetwork {
  const identityKey = buildCareerHouseNetworkIdentityKey(houses, topology, relationships);
  const networkId = identityKey; // networkId is the same as identityKey

  // Merge provenance from all relationships
  const mergedProvenance = mergeCareerGraphProvenances([
    provenance,
    ...relationships.map(r => r.provenance)
  ]);

  return Object.freeze({
    networkId,
    identityKey,
    houses: Object.freeze([...houses].sort((a, b) => a - b)),
    lords: Object.freeze([...lords]),
    relationships: Object.freeze([...relationships]),
    topology,
    direction,
    provenance: normalizeCareerGraphProvenance(mergedProvenance),
    evidenceIds: Object.freeze([...evidenceIds].sort())
  });
}
