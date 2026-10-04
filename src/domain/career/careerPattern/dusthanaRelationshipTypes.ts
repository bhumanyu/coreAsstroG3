/**
 * P2-06B Dusthana Relationship Validation Types
 *
 * This module defines frozen types for dusthana relationship validation.
 * This is a structural relationship VALIDATOR — no scoring, no confidence numbers,
 * no mechanism inference, no dignity/Dasha/D10/transit/timing.
 *
 * Follows P2-06A's frozen relationship semantics in careerPatternPredicates.ts.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerDasha
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Dusthana relationship types.
 * These are the relationship types that can be detected between dusthana and career anchor houses.
 *
 * Initially enabled types: COMMON_LORD, CROSS_LORDSHIP, CONJUNCTION, ASPECT, EXCHANGE, HOUSE_PLACEMENT, PLANET_MEDIATED
 * Deferred/documented-not-emitted types: DISPOSITOR_CHAIN, DIGNITY_RELATION
 * NONE: used when no relationship is detected (NOT_VALIDATED/INSUFFICIENT_DATA cases)
 */
export type DusthanaRelationshipType =
  | 'NONE'
  | 'COMMON_LORD'
  | 'CROSS_LORDSHIP'
  | 'CONJUNCTION'
  | 'ASPECT'
  | 'EXCHANGE'
  | 'HOUSE_PLACEMENT'
  | 'PLANET_MEDIATED'
  | 'DISPOSITOR_CHAIN' // Deferred - not emitted in this wave
  | 'DIGNITY_RELATION'; // Deferred - not emitted in this wave

/**
 * Dusthana relationship validation status.
 * - VALIDATED: relationship is established with evidence
 * - NOT_VALIDATED: relationship not established (NOT negative - just no relationship found)
 * - INSUFFICIENT_DATA: facts missing (e.g., lordship edges absent)
 */
export type DusthanaRelationshipStatus = 'VALIDATED' | 'NOT_VALIDATED' | 'INSUFFICIENT_DATA';

/**
 * A dusthana relationship validation record.
 * Contains the validation result for a specific dusthana-house ↔ career-anchor-house pair.
 */
export interface DusthanaRelationshipValidation {
  readonly validationId: string;
  readonly dusthanaHouse: number;
  readonly careerAnchorHouse: number;
  readonly relationshipType: DusthanaRelationshipType;
  readonly status: DusthanaRelationshipStatus;
  readonly relationshipIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceNetworkIds: readonly string[];
  readonly provenance: DusthanaRelationshipProvenance;
}

/**
 * Evidence for a dusthana relationship.
 * Tracks the specific relationship fact that establishes the relationship.
 */
export interface DusthanaRelationshipEvidence {
  readonly evidenceId: string;
  readonly relationshipId: string;
  readonly relationshipType: DusthanaRelationshipType;
  readonly dusthanaHouse: number;
  readonly careerAnchorHouse: number;
  readonly sourceNetworkId: string;
  readonly sourceNetworkIdentityKey: string;
}

/**
 * Provenance for dusthana relationship validation.
 * Tracks source networks, relationships, rules, and parent relationships.
 * All arrays are sorted, deduped, and frozen.
 */
export interface DusthanaRelationshipProvenance {
  readonly sourceNetworkIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly parentIds: readonly string[];
}

/**
 * Configuration for dusthana relationship validation.
 * Specifies which houses to treat as dusthana and career anchor houses.
 */
export interface DusthanaRelationshipValidationConfig {
  readonly dusthanaHouses: readonly number[];
  readonly careerAnchorHouses: readonly number[];
}

/**
 * Result of dusthana relationship validation.
 * Contains validations for all dusthana-anchor pairs, counts, provenance, and evidence records.
 */
export interface DusthanaRelationshipValidationResult {
  readonly validations: readonly DusthanaRelationshipValidation[];
  readonly validatedPairCount: number;
  readonly insufficientPairCount: number;
  readonly relationshipIds: readonly string[];
  readonly provenance: DusthanaRelationshipProvenance;
  readonly evidence: readonly DusthanaRelationshipEvidence[];
}

/**
 * Default configuration for dusthana relationship validation.
 * Dusthana houses: 6, 8, 12
 * Career anchor houses: 2, 6, 10, 11
 */
export const DEFAULT_DUSTHANA_RELATIONSHIP_VALIDATION_CONFIG: DusthanaRelationshipValidationConfig = Object.freeze({
  dusthanaHouses: [6, 8, 12],
  careerAnchorHouses: [2, 6, 10, 11]
});
