import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPatternClassificationProvenance, CareerPatternClassificationEvidence } from './careerPatternTypes';

/**
 * P2-06D Career Pattern Provenance Builder
 *
 * This module provides provenance construction and canonicalization for Career patterns.
 * It enforces strict validation that all relationship IDs resolve to actual edges in the network,
 * preventing fabrication of synthetic relationship IDs.
 *
 * Key contracts:
 * - Every establishingRelationshipId and supportingRelationshipId must resolve to a CareerGraphEdge
 *   actually present in network.relationships via edge.identityKey
 * - Fabricated IDs (missing from network) are rejected with an error — never emitted with fallback
 * - All ID collections are deduplicated and deterministically sorted
 * - Evidence IDs are derived using a frozen deterministic formula
 * - All returned collections and objects are deeply frozen
 *
 * GENERIC CARRIER EXCEPTION:
 * CAREER_HOUSE_NETWORK is the generic carrier — its establishingRelationshipIds may legitimately
 * span the whole network per its contract. Specialized classifications must only carry establishing
 * IDs that directly establish the specific pattern. This distinction is contractual, not inferred.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Input for building pattern provenance.
 */
export interface BuildPatternProvenanceInput {
  readonly ruleId: string;
  readonly networkId: string;
  readonly establishingRelationshipIds: readonly string[];
  readonly supportingRelationshipIds?: readonly string[];
}

/**
 * Result of building pattern provenance.
 */
export interface BuildPatternProvenanceResult {
  readonly provenance: CareerPatternClassificationProvenance;
  readonly evidence: readonly CareerPatternClassificationEvidence[];
}

/**
 * Result of canonicalizing provenance.
 */
export interface CanonicalizedProvenance {
  readonly sourceNetworkIds: readonly string[];
  readonly establishingRelationshipIds: readonly string[];
  readonly supportingRelationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Error thrown when a relationship ID does not exist in the network.
 */
export class RelationshipNotFoundError extends Error {
  constructor(
    public readonly relationshipId: string,
    public readonly networkId: string
  ) {
    super(`Relationship ID "${relationshipId}" not found in network "${networkId}"`);
    this.name = 'RelationshipNotFoundError';
  }
}

/**
 * Checks if a relationship ID belongs to the network.
 * Returns true if the ID resolves to a CareerGraphEdge in network.relationships via edge.identityKey.
 */
function belongsToNetwork(relationshipId: string, network: CareerHouseNetwork): boolean {
  return network.relationships.some(edge => edge.identityKey === relationshipId);
}

/**
 * Validates that all relationship IDs exist in the network.
 * Throws RelationshipNotFoundError if any ID is fabricated (missing from network).
 */
function validateRelationshipIds(
  establishingIds: readonly string[],
  supportingIds: readonly string[],
  network: CareerHouseNetwork
): void {
  for (const id of establishingIds) {
    if (!belongsToNetwork(id, network)) {
      throw new RelationshipNotFoundError(id, network.networkId);
    }
  }

  for (const id of supportingIds) {
    if (!belongsToNetwork(id, network)) {
      throw new RelationshipNotFoundError(id, network.networkId);
    }
  }
}

/**
 * Deduplicates and deterministically sorts an array of strings.
 */
function dedupeAndSort(ids: readonly string[]): readonly string[] {
  return Object.freeze(Array.from(new Set(ids)).sort());
}

/**
 * Derives an evidence ID from a relationship ID using the frozen deterministic formula.
 * Formula: P2-06D-EVIDENCE:{relationshipId}
 *
 * This formula is stable and must not be changed without a migration plan.
 */
function deriveEvidenceId(relationshipId: string): string {
  return `P2-06D-EVIDENCE:${relationshipId}`;
}

/**
 * Builds pattern provenance from input with strict validation.
 *
 * Responsibilities:
 * (a) Validates every establishing/supporting ID resolves to a CareerGraphEdge in network.relationships
 * (b) Throws RelationshipNotFoundError on fabricated IDs (never emits fallback/synthetic IDs)
 * (c) Deduplicates and sorts all ID collections
 * (d) Derives per-relationship evidence IDs using the frozen deterministic formula
 * (e) Returns deeply frozen collections and provenance object
 *
 * @param input - The provenance input with rule ID, network ID, and relationship IDs
 * @param network - The career house network to validate against
 * @returns BuildPatternProvenanceResult with provenance and evidence records
 * @throws RelationshipNotFoundError if any relationship ID is not found in the network
 */
export function buildPatternProvenance(
  input: BuildPatternProvenanceInput,
  network: CareerHouseNetwork
): BuildPatternProvenanceResult {
  // Validate that all relationship IDs exist in the network
  validateRelationshipIds(
    input.establishingRelationshipIds,
    input.supportingRelationshipIds || [],
    network
  );

  // Deduplicate and sort all ID collections
  const establishingIds = dedupeAndSort(input.establishingRelationshipIds);
  const supportingIds = dedupeAndSort(input.supportingRelationshipIds || []);
  const sourceNetworkIds = dedupeAndSort([input.networkId]);
  const ruleIds = dedupeAndSort([input.ruleId]);

  // For backward compatibility, relationshipIds = establishing ∪ supporting
  const allRelationshipIds = dedupeAndSort([...establishingIds, ...supportingIds]);

  // Build provenance object
  const provenance: CareerPatternClassificationProvenance = Object.freeze({
    sourceNetworkIds,
    relationshipIds: allRelationshipIds,
    ruleIds,
    establishingRelationshipIds: establishingIds,
    supportingRelationshipIds: supportingIds
  });

  // Build evidence records - one per establishing relationship
  const evidence: CareerPatternClassificationEvidence[] = [];
  for (const relationshipId of establishingIds) {
    const evidenceRecord: CareerPatternClassificationEvidence = Object.freeze({
      evidenceId: deriveEvidenceId(relationshipId),
      ruleId: input.ruleId,
      sourceNetworkId: input.networkId,
      sourceNetworkIdentityKey: network.identityKey,
      relationshipId
    });
    evidence.push(evidenceRecord);
  }

  return Object.freeze({
    provenance,
    evidence: Object.freeze(evidence)
  });
}

/**
 * Canonicalizes provenance by normalizing all ID collections.
 *
 * Ensures that different input permutations produce identical canonical provenance.
 * Deduplicates and sorts all ID arrays, then returns a frozen canonical representation.
 *
 * @param provenance - The provenance to canonicalize
 * @returns CanonicalizedProvenance with sorted-unique ID collections
 */
export function canonicalizeProvenance(
  provenance: CareerPatternClassificationProvenance
): CanonicalizedProvenance {
  return Object.freeze({
    sourceNetworkIds: dedupeAndSort(provenance.sourceNetworkIds),
    establishingRelationshipIds: dedupeAndSort(provenance.establishingRelationshipIds),
    supportingRelationshipIds: dedupeAndSort(provenance.supportingRelationshipIds),
    ruleIds: dedupeAndSort(provenance.ruleIds)
  });
}
