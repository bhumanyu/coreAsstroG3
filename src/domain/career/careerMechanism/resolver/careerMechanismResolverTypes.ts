import type { CareerPattern } from '../../careerPattern/careerPatternTypes';
import type { ParticipantRoleAssignment } from '../../careerParticipantRoles/participantRoleTypes';
import type { QualifiedCareerPattern } from '../../careerPatternQualification/careerPatternQualificationTypes';
import type { CareerHouseNetwork } from '../../careerGraph/careerHouseNetworkTypes';
import type {
  CareerMechanismCandidateSet,
  CareerMechanismEvidence,
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
 * Input for mechanism resolution.
 * Contains the pattern, qualification, participant roles, establishing evidence,
 * and source network(s) for canonical edge resolution.
 *
 * Per spec §25: uses ParticipantRoleAssignment from careerParticipantRoles.
 * Extended to carry qualification for gating and source networks for canonical
 * edge resolution (replaces ID-string checks with P2-06A predicates).
 */
export interface CareerMechanismResolutionInput {
  readonly pattern: CareerPattern;
  readonly qualification: QualifiedCareerPattern;
  readonly participantRoles: readonly ParticipantRoleAssignment[];
  readonly establishingEvidence: readonly CareerMechanismEvidence[];
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
