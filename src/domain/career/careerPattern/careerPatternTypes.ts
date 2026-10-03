import type { CareerHouseNetwork, CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';
import type { Planet } from '../../../types';

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
  | 'PARIVARTANA';

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
  | 'PARIVARTANA_YOGA';

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
 * Evidence for a pattern classification.
 * Tracks the source of evidence that led to this classification.
 *
 * BOUNDARY NOTE: This is a P2-03 local classification/provenance record — it is NOT canonical
 * DomainEvidence and does not replace the W0.4 contract. Conversion to DomainEvidence happens at
 * the pattern-evidence/canonical-evidence boundary (later wave). No new global dedup mechanism
 * is introduced.
 */
export interface CareerPatternClassificationEvidence {
  readonly evidenceId: string;
  readonly ruleId: string;
  readonly sourceNetworkId: string;
  readonly sourceNetworkIdentityKey: string;
}

/**
 * Array of evidence records.
 */
export type CareerPatternClassificationEvidenceArray = readonly CareerPatternClassificationEvidence[];

/**
 * Provenance for a pattern classification.
 * Tracks the source networks, relationships, and rules that led to this pattern.
 */
export interface CareerPatternClassificationProvenance {
  readonly sourceNetworkIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
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
