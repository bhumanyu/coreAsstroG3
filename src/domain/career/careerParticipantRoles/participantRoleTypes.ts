import type {
  CareerPattern,
  CareerPatternClassification
} from '../careerPattern/careerPatternTypes';
import type {
  QualifiedCareerPattern
} from '../careerPatternQualification/careerPatternQualificationTypes';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { Planet } from '../../../types';

/**
 * P2-07B Participant Roles Types
 *
 * This module defines the type system for the participant roles layer that sits
 * ABOVE the pattern qualification layer (P2-07A) and consumes qualified patterns,
 * networks, planetary conditions, and relevance results.
 *
 * This layer deterministically assigns participant roles (CORE, SUPPORTING, MODIFIER,
 * CHALLENGING) based on structural evidence from P2-06 and P2-07A facts. It does NOT:
 * - Perform qualification (P2-07A)
 * - Calculate mechanisms (P2-07C)
 * - Assign professions (P2-10A)
 * - Process Dasha/D10/transit/timing
 * - Use AI interpretation or semantic role assignment
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 * - careerMechanism*
 * - careerProfession*
 *
 * NO scores, NO qualification changes, NO mechanisms, NO professions, NO Dasha/D10/transit/C11,
 * NO natural-stereotype role assignment (e.g., "Mercury = communication career").
 */

/**
 * Participant role type.
 * Represents the structural role a participant plays in a pattern.
 *
 * Per spec §3: CORE, SUPPORTING, MODIFIER, CHALLENGING are the only role types.
 * CHALLENGING is a cross-cutting adverse flag, not a primary role.
 */
export type ParticipantRole = 'CORE' | 'SUPPORTING' | 'MODIFIER' | 'CHALLENGING';

/**
 * Primary participant role type.
 * Excludes CHALLENGING, which is a cross-cutting flag independent of primary role.
 */
export type PrimaryParticipantRole = 'CORE' | 'SUPPORTING' | 'MODIFIER';

/**
 * Participant identifier.
 * Format: PLANET:{Planet}
 */
export type ParticipantId = `PLANET:${Planet}`;

/**
 * Evidence source type for participant role assignments.
 * Per spec §17: union of all possible sources; only sources backed by existing P2-06/P2-07A
 * facts activate in practice.
 */
export type ParticipantRoleEvidenceSource =
  | 'ESTABLISHING_RELATIONSHIP'
  | 'SUPPORTING_RELATIONSHIP'
  | 'MODIFIER_RELATIONSHIP'
  | 'ADVERSE_CONDITION'
  | 'ADVERSE_EDGE';

/**
 * Evidence record for a participant role assignment.
 * Tracks the source of evidence that led to this role assignment.
 *
 * Per spec §34: evidenceId format P2-07B:EVIDENCE:${ruleId}:${participantId}:${role}:${edge.identityKey}
 * Deduplication is on (ruleId, participantId, role, edge.identityKey).
 */
export interface ParticipantRoleEvidence {
  readonly evidenceId: string;
  readonly role: ParticipantRole;
  readonly relationshipIds: readonly string[];
  readonly source: ParticipantRoleEvidenceSource;
  readonly explanation: string;
}

/**
 * Participant role assignment.
 * Represents the role assignment for a single pattern participant.
 *
 * Per spec §33:
 * - primaryRole: CORE | SUPPORTING | MODIFIER (CHALLENGING excluded from primary)
 * - isChallenging: boolean flag for cross-cutting adverse status
 * - roleEvidence: array of evidence records supporting this assignment
 * - explanation: human-readable explanation
 */
export interface ParticipantRoleAssignment {
  readonly participantId: ParticipantId;
  readonly primaryRole: PrimaryParticipantRole;
  readonly isChallenging: boolean;
  readonly roleEvidence: readonly ParticipantRoleEvidence[];
  readonly explanation: string;
}

/**
 * Participant role result.
 * Represents the complete role assignment result for a pattern.
 *
 * Per spec §26: NO unassignedParticipants field — only participants with evidence
 * are assigned roles. Missing evidence produces no assignment, not negative roles.
 */
export interface ParticipantRoleResult {
  readonly assignments: readonly ParticipantRoleAssignment[];
  readonly evidence: readonly ParticipantRoleEvidence[];
  readonly ruleId: string;
  readonly explanation: string;
}

/**
 * Participant role policy interface.
 * Implemented by per-classification policies to evaluate participant roles.
 */
export interface ParticipantRolePolicy {
  readonly ruleId: string;
  readonly classification: CareerPatternClassification;
  readonly description: string;

  /**
   * Evaluates participant roles for a pattern under this policy.
   *
   * @param context - The pattern, qualification, networks, conditions, and relevance
   * @returns Participant role result with assignments, evidence, and explanation
   */
  evaluate(context: ParticipantRoleContext): ParticipantRoleResult;
}

/**
 * Participant role evaluation context.
 * Provides the data needed by per-classification role policies.
 *
 * Per spec §9: Reuses existing domain types — no parallel copies.
 */
export interface ParticipantRoleContext {
  readonly pattern: CareerPattern;
  readonly qualification: QualifiedCareerPattern;
  readonly networks: readonly CareerHouseNetwork[];
  readonly planetaryConditions: readonly CareerPlanetaryConditionResult[];
  readonly relevance: readonly CareerPlanetaryRelevance[];
}
