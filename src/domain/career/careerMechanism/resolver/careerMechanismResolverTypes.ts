import type { CareerPattern } from '../../careerPattern/careerPatternTypes';
import type { ParticipantRoleAssignment } from '../../careerParticipantRoles/participantRoleTypes';
import type { QualifiedCareerPattern } from '../../careerPatternQualification/careerPatternQualificationTypes';
import type { CareerHouseNetwork } from '../../careerGraph/careerHouseNetworkTypes';
import type {
  CareerMechanismCandidateSet,
  CareerMechanismEvidence,
  CareerMechanismEvidenceSource,
  CareerMechanismPathway,
  CareerMechanismType
} from '../careerMechanismTypes';

/**
 * P2-07D Career Mechanism Resolver Types
 *
 * This module defines the type system for the mechanism resolution layer that sits
 * ABOVE the pattern layer (P2-03/P2-06) and consumes patterns, participant roles,
 * and establishing evidence to produce mechanism candidate sets.
 *
 * This layer deterministically resolves mechanism types from pattern structural facts.
 * It does NOT:
 * - Modify patterns (C4–C7)
 * - Process careerDasha, careerD10, careerExpression, or timing
 * - Assign professions (P2-10A)
 * - Use AI interpretation
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - any AI/profession module
 */

/**
 * Pattern-level establishing evidence for mechanism resolution.
 * Unlike CareerMechanismEvidence, mechanismType is optional here because
 * pattern-level evidence does not yet know which mechanism type it will establish.
 * The resolver determines the mechanism type during resolution.
 *
 * This evidence is attached to all candidates derived from the pattern,
 * while typed establishing evidence (with mechanismType) is attached only
 * to matching mechanism types.
 */
export interface PatternLevelEstablishingEvidence {
  readonly evidenceId: string;
  readonly mechanismType?: CareerMechanismType; // Optional - resolver determines the type
  readonly source: CareerMechanismEvidenceSource;
  readonly role: 'ESTABLISHING'; // Always establishing for this type
  readonly participantIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly patternId?: string;
  readonly explanation: string;
}

/**
 * Input for mechanism resolution.
 * Contains the pattern, qualification, participant roles, establishing evidence,
 * and source network(s) for canonical edge resolution.
 *
 * Per spec §25: uses ParticipantRoleAssignment from careerParticipantRoles.
 * Extended to carry qualification for gating and source networks for canonical
 * edge resolution (replaces ID-string checks with P2-06A predicates).
 *
 * establishingEvidence now accepts both typed CareerMechanismEvidence (with
 * required mechanismType) and pattern-level PatternLevelEstablishingEvidence
 * (with optional mechanismType). Pattern-level evidence is attached to all
 * candidates derived from the pattern, while typed evidence is attached only
 * to matching mechanism types.
 */
export interface CareerMechanismResolutionInput {
  readonly pattern: CareerPattern;
  readonly qualification: QualifiedCareerPattern;
  readonly participantRoles: readonly ParticipantRoleAssignment[];
  readonly establishingEvidence: readonly PatternLevelEstablishingEvidence[];
  readonly networks: readonly CareerHouseNetwork[];
}

/**
 * Mechanism resolution rule.
 * Defines a rule that can apply to a pattern and resolve mechanism types.
 *
 * Per spec §25: rules check pattern structural facts (relationshipIds, not just houses)
 * and emit mechanism types via the registry.
 */
export interface CareerMechanismResolutionRule {
  readonly ruleId: string;
  readonly pathway: CareerMechanismPathway;

  /**
   * Checks if this rule applies to the given input.
   * Must check pattern.provenance.establishingRelationshipIds (or pattern.relationshipIds)
   * for required houses/edges — never just pattern.houses.
   */
  applies(input: CareerMechanismResolutionInput): boolean;

  /**
   * Resolves mechanism types for the given input.
   * Returns an array of mechanism types (must all be valid registry types).
   */
  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[];
}

/**
 * Career mechanism resolver interface.
 * Per spec §25: resolves mechanism candidates from patterns, keeping per-pattern
 * CandidateSets, never merging across patterns.
 */
export interface CareerMechanismResolver {
  /**
   * Resolves mechanism candidates for a single pattern.
   * Returns a CandidateSet with candidates, evidence, and provenance.
   *
   * Per spec §23: validate input → filter applicable rules → flatMap resolve →
   * unique sort → create candidates → create CandidateSet.
   */
  resolve(input: CareerMechanismResolutionInput): CareerMechanismCandidateSet;

  /**
   * Resolves mechanism candidates for multiple patterns.
   * Returns one CandidateSet per input pattern, never merged.
   */
  resolveAll(inputs: readonly CareerMechanismResolutionInput[]): readonly CareerMechanismCandidateSet[];
}
