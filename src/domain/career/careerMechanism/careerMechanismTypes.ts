import type { ParticipantId } from '../careerParticipantRoles';

/**
 * P2-07C Career Mechanism Model Types
 *
 * This module defines the canonical mechanism MODEL only — no resolution rules,
 * no pattern→mechanism mapping (that's P2-07D), no dispositor refinement (P2-07E).
 *
 * This is the pure data model for career mechanisms: the vocabulary, families,
 * pathways, status, evidence sources, and canonical records. Mechanisms are
 * structural classifications of HOW career activity manifests, not WHAT profession
 * a person has.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 *
 * Mechanism ≠ profession: These types do NOT contain profession-specific values
 * like SOFTWARE_ENGINEER, BANKER, DOCTOR, etc. Those belong in a later synthesis layer.
 */

// Re-export ParticipantId for convenience
export type { ParticipantId };

/**
 * Career mechanism types.
 * Per spec §4: the canonical mechanism vocabulary union.
 * These are structural classifications of HOW career activity manifests, not WHAT profession.
 *
 * Members from existing CareerMechanism in careerPatternTypes.ts:
 * - SELF_EFFORT, SKILL_DEVELOPMENT, SERVICE_EMPLOYMENT, COMPETITION,
 *   PROFESSIONALIZATION, PROFESSIONAL_GAINS, CREATIVE_INTELLECTUAL,
 *   DHARMA_DRIVEN_PROFESSION, AUTHORITY_LEADERSHIP, TRANSFORMATION,
 *   RESEARCH, RISK_MANAGEMENT, INVESTIGATION, BANKING_FINANCE, INSURANCE,
 *   TAXATION, COMPLIANCE, CRISIS_MANAGEMENT, FOREIGN_WORK, REMOTE_WORK,
 *   INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT, MIXED
 *
 * Note: ISOLATION was removed as it duplicates ISOLATED_ENVIRONMENT
 *
 * New members added per spec §4:
 * - AGENCY, SELF_DIRECTION, INITIATIVE, VISIBILITY, STATUS, AUTHORITY,
 *   LEADERSHIP, STRATEGY, ADVISORY, TEACHING, INNOVATION, DECISION_MAKING,
 *   COMMUNICATION, WRITING, PUBLIC_INTERFACE, CLIENT_INTERACTION,
 *   CONTRACTUAL_INTERACTION, PARTNERSHIP, COMMERCIAL_INTERACTION,
 *   ENTREPRENEURIAL_EFFORT, STABILITY, WORK_ENVIRONMENT,
 *   ADMINISTRATIVE_FOUNDATION, RISK, CRISIS, EXPENDITURE
 */
export type CareerMechanismType =
  // Expression family
  | 'AGENCY'
  | 'SELF_DIRECTION'
  | 'INITIATIVE'
  | 'VISIBILITY'
  | 'STATUS'
  | 'AUTHORITY'
  | 'LEADERSHIP'
  | 'STRATEGY'
  | 'ADVISORY'
  | 'TEACHING'
  | 'INNOVATION'
  | 'DECISION_MAKING'
  | 'COMMUNICATION'
  | 'WRITING'
  | 'PUBLIC_INTERFACE'
  | 'CLIENT_INTERACTION'
  | 'CONTRACTUAL_INTERACTION'
  | 'PARTNERSHIP'
  | 'COMMERCIAL_INTERACTION'
  | 'ENTREPRENEURIAL_EFFORT'
  // Execution family
  | 'EXECUTION'
  | 'HANDS_ON_CAPABILITY'
  | 'COURAGE'
  | 'SELF_EFFORT'
  | 'SKILL_DEVELOPMENT'
  | 'SERVICE_EMPLOYMENT'
  | 'COMPETITION'
  | 'PROFESSIONALIZATION'
  | 'PROFESSIONAL_GAINS'
  | 'CREATIVE_INTELLECTUAL'
  | 'DHARMA_DRIVEN_PROFESSION'
  | 'AUTHORITY_LEADERSHIP'
  | 'STABILITY'
  | 'WORK_ENVIRONMENT'
  | 'ADMINISTRATIVE_FOUNDATION'
  | 'EXPENDITURE'
  // Knowledge family
  | 'INTELLIGENCE'
  | 'SPECIALIZED_KNOWLEDGE'
  | 'RESEARCH'
  | 'INVESTIGATION'
  | 'TRANSFORMATION'
  // Communication family
  | 'TEACHING'
  | 'COMMUNICATION'
  | 'WRITING'
  | 'PUBLIC_INTERFACE'
  | 'CLIENT_INTERACTION'
  | 'CONTRACTUAL_INTERACTION'
  | 'PARTNERSHIP'
  | 'COMMERCIAL_INTERACTION'
  // Business family
  | 'BUSINESS'
  | 'CONSULTING'
  | 'BANKING_FINANCE'
  | 'INSURANCE'
  | 'TAXATION'
  | 'COMPLIANCE'
  | 'RISK'
  | 'CRISIS'
  | 'CRISIS_MANAGEMENT'
  | 'ENTREPRENEURIAL_EFFORT'
  | 'COMMERCIAL_INTERACTION'
  | 'PARTNERSHIP'
  | 'CONTRACTUAL_INTERACTION'
  | 'CLIENT_INTERACTION'
  // Institutional family
  | 'INSTITUTIONAL_BASE'
  | 'INSTITUTIONAL_SERVICE'
  | 'INSTITUTIONAL_WORK'
  | 'ISOLATED_ENVIRONMENT'
  | 'STABILITY'
  | 'WORK_ENVIRONMENT'
  | 'ADMINISTRATIVE_FOUNDATION'
  // Transformation family
  | 'TRANSFORMATION'
  | 'RESEARCH'
  | 'INVESTIGATION'
  | 'RISK'
  | 'CRISIS'
  | 'CRISIS_MANAGEMENT'
  // Foreign family
  | 'FOREIGN'
  | 'FOREIGN_WORK'
  | 'REMOTE_WORK'
  // Legacy from careerPatternTypes.ts (to be migrated)
  | 'MIXED';

/**
 * Career mechanism families.
 * Per spec §3: high-level groupings of related mechanism types.
 */
export type CareerMechanismFamily =
  | 'EXPRESSION'
  | 'EXECUTION'
  | 'KNOWLEDGE'
  | 'COMMUNICATION'
  | 'BUSINESS'
  | 'INSTITUTIONAL'
  | 'TRANSFORMATION'
  | 'FOREIGN';

/**
 * Career mechanism pathways.
 * Per spec §5: how a mechanism is detected or derived.
 */
export type CareerMechanismPathway =
  | 'HOUSE'
  | 'PLANETARY'
  | 'RELATIONSHIP'
  | 'PATTERN'
  | 'YOGA'
  | 'DISPOSITOR'
  | 'COMBINED';

/**
 * Career mechanism status.
 * Per spec §7: lifecycle status of a mechanism.
 * Do NOT reuse P2-07A qualification status.
 */
export type CareerMechanismStatus =
  | 'CANDIDATE'
  | 'QUALIFIED'
  | 'REFINED'
  | 'INSUFFICIENT_DATA';

/**
 * Career mechanism evidence source.
 * Per spec §8: where evidence for a mechanism comes from.
 *
 * IMPORTANT: 'D10' is allowed ONLY as refinement evidence, NEVER as an establishing source.
 * This invariant must be documented and enforced by the mechanism resolution layer (P2-07D).
 */
export type CareerMechanismEvidenceSource =
  | 'PATTERN'
  | 'PARTICIPANT_ROLE'
  | 'PLANETARY_RELEVANCE'
  | 'PLANETARY_CONDITION'
  | 'LORDSHIP'
  | 'RELATIONSHIP'
  | 'YOGA'
  | 'DISPOSITOR'
  | 'D10'; // Allowed ONLY as refinement evidence, NEVER as establishing source

/**
 * Career mechanism definition.
 * Per spec §11: static metadata for each mechanism type.
 */
export interface CareerMechanismDefinition {
  readonly type: CareerMechanismType;
  readonly family: CareerMechanismFamily;
  readonly description: string;
}

/**
 * Career mechanism evidence.
 * Per spec §9: evidence record for a mechanism.
 * Must cite real participant/relationship IDs; no fabrication.
 */
export interface CareerMechanismEvidence {
  readonly evidenceId: string;
  readonly mechanismType: CareerMechanismType;
  readonly source: CareerMechanismEvidenceSource;
  readonly participantIds: readonly ParticipantId[];
  readonly relationshipIds: readonly string[];
  readonly patternId?: string;
  readonly explanation: string;
}

/**
 * Career mechanism provenance.
 * Per spec §10: provenance tracking for a mechanism.
 */
export interface CareerMechanismProvenance {
  readonly patternIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly participantIds: readonly ParticipantId[];
  readonly evidenceIds: readonly string[];
  readonly sourceStages: readonly string[];
}

/**
 * Career mechanism.
 * Per spec §6: canonical mechanism record.
 */
export interface CareerMechanism {
  readonly mechanismId: string;
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly participants: readonly ParticipantId[];
  readonly coreParticipants: readonly ParticipantId[];
  readonly supportingParticipants: readonly ParticipantId[];
  readonly challengingParticipants: readonly ParticipantId[];
  readonly status: CareerMechanismStatus;
  readonly explanation: string;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}

/**
 * Career mechanism input.
 * Per spec §13: input for mechanism creation.
 */
export interface CareerMechanismInput {
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly participants: readonly ParticipantId[];
  readonly coreParticipants: readonly ParticipantId[];
  readonly supportingParticipants: readonly ParticipantId[];
  readonly challengingParticipants: readonly ParticipantId[];
  readonly status: CareerMechanismStatus;
  readonly explanation: string;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}

/**
 * Career mechanism candidate.
 * Per spec §14: candidate mechanism before qualification.
 */
export interface CareerMechanismCandidate {
  readonly candidateId: string;
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
  readonly explanation: string;
}

/**
 * Career mechanism candidate set.
 * Per spec §15: collection of mechanism candidates.
 */
export interface CareerMechanismCandidateSet {
  readonly patternId: string;
  readonly candidates: readonly CareerMechanismCandidate[];
}
