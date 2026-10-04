import type {
  CareerPattern,
  CareerPatternFamily,
  CareerPatternLevel,
  CareerPatternClassification,
  CareerPatternHouseRole
} from '../careerPattern/careerPatternTypes';
import type { CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type { Planet } from '../../../types';

/**
 * P2-04 Career Pattern Qualification Types
 *
 * This module defines the type system for the pattern qualification layer that sits
 * ABOVE the pattern classification layer (P2-03) and consumes planetary relevance (C5)
 * and condition (C6) results.
 *
 * This layer evaluates structural dimensions of Career patterns based on planetary
 * relevance and condition, but does NOT calculate Dasha, D10, transit, timing, or
 * prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Structural strength of a Career pattern.
 * Represents the overall strength of the pattern based on participant conditions.
 *
 * Per §16: NOT_ASSESSED is returned for all patterns until the canonical
 * topology→strength mapping is frozen in the methodology.
 */
export type CareerPatternStructuralStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'NOT_ASSESSED';

/**
 * Planetary condition contribution to a pattern.
 * Maps C6 CareerPlanetaryCondition to qualification-level assessment.
 */
export type CareerPatternPlanetaryCondition =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'UNAVAILABLE';

/**
 * Career relevance of a pattern participant.
 * Maps C5 CareerPlanetRelevance to qualification-level assessment.
 */
export type CareerPatternCareerRelevance =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

/**
 * Coherence of a pattern's structural relationships.
 * Represents how well the pattern's houses and relationships align.
 */
export type CareerPatternCoherence =
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'INSUFFICIENT_DATA';

/**
 * Activation potential of a pattern.
 * Represents the structural potential for activation (excluding timing).
 *
 * Per §16: UNKNOWN is returned for all patterns since current activation
 * remains C9's responsibility (timing-aware).
 */
export type CareerPatternActivationPotential =
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'UNKNOWN';

/**
 * Divisional confirmation of a pattern.
 * Represents D10 confirmation status.
 *
 * Per §16: NOT_ASSESSED is returned since D10 qualification is handled
 * by C10 (careerD10), not this module.
 */
export type CareerPatternDivisionalConfirmation =
  | 'CONFIRMED'
  | 'NOT_CONFIRMED'
  | 'NOT_ASSESSED';

/**
 * Qualification status of a Career pattern.
 * Represents the overall qualification based on all dimensions.
 */
export type CareerPatternQualificationStatus =
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'INSUFFICIENT_DATA';

/**
 * Qualification assessment for a single pattern participant (planet).
 */
export interface CareerPatternParticipantQualification {
  readonly planet: Planet;
  readonly relevance: CareerPatternCareerRelevance;
  readonly condition: CareerPatternPlanetaryCondition;
  readonly relevanceSource?: CareerPlanetaryRelevance;
  readonly conditionSource?: CareerPlanetaryConditionResult;
}

/**
 * Qualification dimensions for a Career pattern.
 * Represents the assessment across all structural dimensions.
 */
export interface CareerPatternQualificationDimensions {
  readonly structuralStrength: CareerPatternStructuralStrength;
  readonly planetaryCondition: CareerPatternPlanetaryCondition;
  readonly careerRelevance: CareerPatternCareerRelevance;
  readonly coherence: CareerPatternCoherence;
  readonly activationPotential: CareerPatternActivationPotential;
  readonly divisionalConfirmation: CareerPatternDivisionalConfirmation;
}

/**
 * Evidence for a qualification dimension.
 * Tracks the source of evidence that led to this dimension assessment.
 */
export interface CareerPatternQualificationEvidence {
  readonly evidenceId: string;
  readonly dimension: keyof CareerPatternQualificationDimensions;
  readonly identityKey: string;
  readonly statement: string;
  readonly sourcePatternId: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Source type for qualification evidence.
 * Indicates the origin of the evidence fact.
 */
export type QualificationEvidenceSourceType =
  | 'PLANETARY_RELEVANCE'
  | 'PLANETARY_CONDITION'
  | 'STRUCTURAL_RELATIONSHIP'
  | 'PATTERN_TOPOLOGY'
  | 'POLICY_RULE';

/**
 * Policy-level evidence record for qualification decisions.
 * Used by per-family qualification policies to provide explainable output.
 *
 * Per spec §25: relationshipIds are sourced ONLY from pattern.provenance.establishingRelationshipIds,
 * never from network.relationships bulk copy (avoids the P2-06 provenance bug).
 */
export interface QualificationEvidence {
  readonly evidenceId: string;
  readonly dimension: keyof CareerPatternQualificationDimensions;
  readonly sourceType: QualificationEvidenceSourceType;
  readonly sourceId: string;
  readonly relationshipIds: readonly string[];
  readonly explanation: string;
}

/**
 * Provenance for a qualification result.
 * Tracks the source patterns, evidence, and rules that led to this qualification.
 */
export interface CareerPatternQualificationProvenance {
  readonly sourcePatternIds: readonly string[];
  readonly sourceEvidenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Policy evaluation context for a single pattern.
 * Provides the data needed by per-family qualification policies.
 */
export interface QualificationPolicyContext {
  readonly pattern: CareerPattern;
  readonly relevanceByPlanet: ReadonlyMap<Planet, CareerPlanetaryRelevance>;
  readonly conditionByPlanet: ReadonlyMap<Planet, CareerPlanetaryConditionResult>;
}

/**
 * Dimension evaluation result from a policy.
 * Used by policies to report per-dimension assessments.
 */
export interface DimensionEvaluation {
  readonly dimension: keyof CareerPatternQualificationDimensions;
  readonly value: string;
  readonly evidence: readonly QualificationEvidence[];
  readonly insufficientDataReasons: readonly string[];
}

/**
 * Policy evaluation result.
 * Returned by a QualificationPolicy after evaluating a pattern.
 */
export interface PolicyEvaluationResult {
  readonly status: CareerPatternQualificationStatus;
  readonly dimensions: CareerPatternQualificationDimensions;
  readonly evidence: readonly QualificationEvidence[];
  readonly insufficientDataReasons: readonly string[];
  readonly ruleId: string;
  readonly explanation: string;
}

/**
 * Qualification policy interface.
 * Implemented by per-family policy files to evaluate pattern qualification.
 */
export interface QualificationPolicy {
  readonly policyId: string;
  readonly classification: CareerPatternClassification;
  readonly description: string;

  /**
   * Evaluates whether a pattern qualifies under this policy.
   *
   * @param context - The pattern and planetary data to evaluate
   * @returns Policy evaluation result with status, dimensions, evidence, and explanation
   */
  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult;
}

/**
 * A qualified Career pattern representation.
 * Represents a pattern with its qualification assessment.
 *
 * Identity is inherited from the source pattern (patternId, identityKey) —
 * this module never mints new identity.
 *
 * Flat fields (family, level, classification, name, topology, direction, houses,
 * houseRoles, planets, networkIds, relationshipIds) are populated verbatim from
 * the source pattern for convenience. The sourcePattern is retained for full
 * provenance and access to all source data.
 */
export interface QualifiedCareerPattern {
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
  readonly sourcePattern: CareerPattern;
  readonly dimensions: CareerPatternQualificationDimensions;
  readonly participants: readonly CareerPatternParticipantQualification[];
  readonly evidence: readonly CareerPatternQualificationEvidence[];
  readonly policyEvidence: readonly QualificationEvidence[];
  readonly insufficientDataReasons: readonly string[];
  readonly ruleId: string;
  readonly explanation: string;
  readonly provenance: CareerPatternQualificationProvenance;
  readonly status: CareerPatternQualificationStatus;
  readonly statement: string;
}

/**
 * Input for pattern qualification.
 * Contains the patterns to qualify along with planetary relevance and condition data.
 *
 * Per §14: NO horoscope, dasha, d10, or timing fields — this module
 * operates purely on structural pattern data and C5/C6 results.
 */
export interface CareerPatternQualificationInput {
  readonly patterns: readonly CareerPattern[];
  readonly relevance: readonly CareerPlanetaryRelevance[];
  readonly condition: readonly CareerPlanetaryConditionResult[];
}

/**
 * Result of pattern qualification.
 * Contains the qualified patterns in deterministic order.
 */
export interface CareerPatternQualificationResult {
  readonly qualifiedPatterns: readonly QualifiedCareerPattern[];
}
