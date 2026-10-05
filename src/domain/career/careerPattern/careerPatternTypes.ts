import type { CareerHouseNetwork, CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';
import type { Planet } from '../../../types';
import type { CareerMechanismType } from '../careerMechanism/careerMechanismTypes';

/**
 * P2-03 Career Pattern Classification Types
 *
 * This module defines the type system for the pattern-identity/classification layer that sits
 * ABOVE the CareerHouseNetwork detection (P2-02) and BELOW the qualification layer.
 *
 * This layer is pure structural pattern-identity/classification only - it does NOT calculate
 * strength, confidence, scores, qualification, activation, Dasha, D10, transit, mechanism,
 * or prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Pattern family categories for Career patterns.
 * Represents the high-level classification of pattern types.
 */
export type CareerPatternFamily =
  | 'CAREER_HOUSE_NETWORK'
  | 'KENDRA_TRIKONA'
  | 'UPACHAYA'
  | 'PARIVARTANA'
  | 'DUSTHANA_TRANSFORMATION'
  | 'CAREER_YOGA';

/**
 * Pattern hierarchy level.
 * Represents the structural depth of the pattern in the classification hierarchy.
 */
export type CareerPatternLevel =
  | 'HOUSE_NETWORK'
  | 'PLANETARY_YOGA';

/**
 * Pattern classification categories.
 * Represents the semantic classification of the pattern.
 * 9 members as specified (SELF_EFFORT_TO_WORK_TO_PROFESSION_TO_GAINS removed — unused).
 */
export type CareerPatternClassification =
  | 'CAREER_HOUSE_NETWORK'
  | 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS'
  | 'COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS'
  | 'CREATIVE_DHARMA_TO_PROFESSION'
  | 'DHARMA_KARMA_ALIGNMENT'
  | 'SERVICE_TO_PROFESSION_TO_GAINS'
  | 'PROFESSION_TO_GAINS'
  | 'UPACHAYA_PROGRESSION'
  | 'PARIVARTANA_YOGA'
  | 'DUSTHANA_CAREER_TRANSFORMATION'
  | 'CAREER_YOGA_STRUCTURE'
  | 'AUTHORITY_PATTERN'
  | 'PROFESSIONAL_RISE_PATTERN';

/**
 * House role in a pattern.
 * Represents the semantic role a house plays within a pattern.
 */
export type CareerPatternHouseRole =
  | 'CAREER_HOUSE'
  | 'WEALTH_HOUSE'
  | 'SERVICE_HOUSE'
  | 'EFFORT_HOUSE'
  | 'COMMUNICATION_HOUSE'
  | 'CREATIVE_HOUSE'
  | 'DHARMA_HOUSE'
  | 'GAINS_HOUSE'
  | 'UNKNOWN';

/**
 * Career mechanism types.
 * Represents the underlying mechanism of career activity in a pattern.
 * Per spec §6: mechanism classifications only, no profession-specific values.
 *
 * @deprecated Use CareerMechanismType from careerMechanism/careerMechanismTypes.ts instead.
 * This alias exists only for backward compatibility with external callers.
 */
export type CareerMechanism = CareerMechanismType;

/**
 * Parivartana career type classification.
 * Per spec §19: specific exchange types based on house pairs.
 */
export type ParivartanaCareerType =
  | 'SERVICE_PROFESSION_EXCHANGE'
  | 'DHARMA_KARMA_EXCHANGE'
  | 'TRANSFORMATION_PROFESSION_EXCHANGE'
  | 'GAINS_PROFESSION_EXCHANGE'
  | 'SELF_EFFORT_PROFESSION_EXCHANGE'
  | 'RESOURCE_PROFESSION_EXCHANGE'
  | 'GENERIC_CAREER_EXCHANGE';

/**
 * Evidence for a pattern classification.
 * Tracks the source of evidence that led to this classification.
 *
 * BOUNDARY NOTE: This is a P2-03 local classification/provenance record — it is NOT canonical
 * DomainEvidence and does not replace the W0.4 contract. Conversion to DomainEvidence happens at
 * the pattern-evidence/canonical-evidence boundary (later wave). No new global dedup mechanism
 * is introduced.
 *
 * P2-06D: Added relationshipId to reference the establishing relationship for this evidence.
 */
export interface CareerPatternClassificationEvidence {
  readonly evidenceId: string;
  readonly ruleId: string;
  readonly sourceNetworkId: string;
  readonly sourceNetworkIdentityKey: string;
  readonly relationshipId?: string;
}

/**
 * Array of evidence records.
 */
export type CareerPatternClassificationEvidenceArray = readonly CareerPatternClassificationEvidence[];

/**
 * Provenance for a pattern classification.
 * Tracks the source networks, relationships, and rules that led to this pattern.
 *
 * P2-06D: Extended with establishingRelationshipIds and supportingRelationshipIds for
 * fine-grained provenance tracking. The legacy relationshipIds field is retained for
 * backward compatibility and populated as establishingRelationshipIds ∪ supportingRelationshipIds.
 */
export interface CareerPatternClassificationProvenance {
  readonly sourceNetworkIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly establishingRelationshipIds: readonly string[];
  readonly supportingRelationshipIds: readonly string[];
}

/**
 * Relationship between two patterns.
 * Represents how patterns relate to each other in the analysis.
 */
export interface CareerPatternRelationship {
  readonly relationshipId: string;
  readonly sourcePatternId: string;
  readonly targetPatternId: string;
  readonly relationshipType: 'SUPPORTS' | 'CONFLICTS' | 'REINFORCES' | 'MODIFIES';
  readonly description: string;
}

/**
 * Conflict between patterns.
 * Represents a detected conflict between patterns that coexist.
 * Per spec §28: conflicts preserve coexisting patterns rather than eliminating them.
 */
export interface CareerPatternConflict {
  readonly conflictId: string;
  readonly patternIds: readonly string[];
  readonly conflictType: 'SEMANTIC_CONFLICT' | 'MECHANISM_CONFLICT' | 'STRUCTURAL_CONFLICT';
  readonly description: string;
  readonly resolution?: string;
}

/**
 * A Career pattern representation.
 * Represents a classified pattern with its structural identity and classification metadata.
 *
 * Identity is based on family, classification, houses, topology, and relationshipIds.
 * Identity must NOT include direction, strength, dignity, condition, Dasha, D10, timing, qualification.
 *
 * NO strength/confidence/score/weight/activation/timing fields anywhere in this type.
 */
export interface CareerPattern {
  readonly patternId: string;
  readonly identityKey: string;
  readonly family: CareerPatternFamily;
  readonly level: CareerPatternLevel;
  readonly classification: CareerPatternClassification;
  readonly name: string;
  readonly topology: CareerNetworkTopology;
  readonly direction: CareerNetworkDirection;
  readonly houses: readonly number[];
  readonly houseRoles: Readonly<Record<number, CareerPatternHouseRole>>;
  readonly planets: readonly Planet[];
  readonly networkIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly mechanisms: readonly CareerMechanismType[];
  readonly relationships: readonly CareerPatternRelationship[];
  readonly evidence: readonly CareerPatternClassificationEvidence[];
  readonly provenance: CareerPatternClassificationProvenance;
}

/**
 * Input for pattern classification.
 * Contains the CareerHouseNetworks to be classified.
 */
export interface CareerPatternClassificationInput {
  readonly networks: readonly CareerHouseNetwork[];
}

/**
 * Result of pattern classification.
 * Contains the classified patterns in deterministic order.
 */
export interface CareerPatternClassificationResult {
  readonly patterns: readonly CareerPattern[];
}

/**
 * Career Yoga structural pattern.
 * Per spec §20: structural-only representation with no strength/condition/dasha/d10 fields.
 */
export interface CareerYogaPattern {
  readonly yogaId: string;
  readonly identityKey: string;
  readonly name: string;
  readonly participants: readonly Planet[];
  readonly houseRelationships: Readonly<Record<string, readonly number[]>>;
  readonly lordships: Readonly<Partial<Record<Planet, readonly number[]>>>;
  readonly careerRelevant: boolean;
  readonly evidenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Evidence for a pattern analysis.
 * Per spec §24: evidence with deduplication support keyed on underlying fact identity.
 */
export interface CareerPatternEvidence {
  readonly evidenceId: string;
  readonly identityKey: string;
  readonly statement: string;
  readonly sourcePatternIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly underlyingFactIds: readonly string[];
}

/**
 * Result of pattern analysis.
 * Per spec §23: contains patterns, evidence, relationships, mechanisms, conflicts, and provenance.
 * Sorted deterministically by family then identityKey.
 *
 * NOTE: relationships field is retained for type compatibility but is always empty in this wave.
 * Future enhancement would implement SUPPORTS/REINFORCES/MODIFIES relationship detection.
 */
export interface CareerPatternAnalysis {
  readonly patterns: readonly CareerPattern[];
  readonly careerYogaPatterns: readonly CareerYogaPattern[];
  readonly evidence: readonly CareerPatternEvidence[];
  readonly relationships: readonly CareerPatternRelationship[];
  readonly mechanisms: readonly CareerMechanismType[];
  readonly conflicts: readonly CareerPatternConflict[];
  readonly provenance: {
    readonly sourceNetworkIds: readonly string[];
    readonly totalPatterns: number;
    readonly totalCareerYogaPatterns: number;
    readonly totalEvidence: number;
    readonly totalConflicts: number;
  };
}
