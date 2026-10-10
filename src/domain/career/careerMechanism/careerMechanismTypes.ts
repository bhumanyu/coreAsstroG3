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
 *   INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT
 *
 * Note: ISOLATION was removed as it duplicates ISOLATED_ENVIRONMENT
 * Note: MIXED was removed - mixed resolution should be represented structurally on the candidate/result model
 *   (e.g., a set containing multiple candidates) rather than as a mechanism type
 *
 * New members added per spec §4:
 * - AGENCY, SELF_DIRECTION, INITIATIVE, VISIBILITY, STATUS, AUTHORITY,
 *   LEADERSHIP, STRATEGY, ADVISORY, TEACHING, INNOVATION, DECISION_MAKING,
 *   COMMUNICATION, WRITING, PUBLIC_INTERFACE, CLIENT_INTERACTION,
 *   CONTRACTUAL_INTERACTION, PARTNERSHIP, COMMERCIAL_INTERACTION,
 *   ENTREPRENEURIAL_EFFORT, STABILITY, WORK_ENVIRONMENT,
 *   ADMINISTRATIVE_FOUNDATION, RISK, CRISIS, EXPENDITURE
 *
 * Borderline-domain types (mechanism vs domain vs outcome - to be decided in P2-07D):
 * - BANKING_FINANCE, INSURANCE, TAXATION, COMPLIANCE, FOREIGN_WORK, REMOTE_WORK,
 *   INSTITUTIONAL_WORK, PROFESSIONAL_GAINS
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
  // Institutional family
  | 'INSTITUTIONAL_BASE'
  | 'INSTITUTIONAL_SERVICE'
  | 'INSTITUTIONAL_WORK'
  | 'ISOLATED_ENVIRONMENT'
  // Transformation family
  | 'RISK'
  | 'CRISIS'
  | 'CRISIS_MANAGEMENT'
  // Foreign family
  | 'FOREIGN'
  | 'FOREIGN_WORK'
  | 'REMOTE_WORK';

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
 * This invariant is enforced at the builder level (buildCareerMechanismEvidence throws for D10).
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
 * Career mechanism refinement source.
 * Per spec §8: sources that can ONLY be used for refinement evidence, never establishing.
 *
 * Currently 'D10' and 'DISPOSITOR' are refinement-only sources. Future refinement sources are added to this union.
 */
export type CareerMechanismRefinementSource = 'D10' | 'DISPOSITOR';

/**
 * Career mechanism evidence role.
 * Per spec §9: distinguishes between establishing and refinement evidence.
 *
 * ESTABLISHING: Evidence that initially establishes a mechanism candidate (structural sources).
 * REFINING: Evidence that refines or qualifies an existing mechanism (e.g., D10).
 *
 * Invariant: ESTABLISHING evidence can never carry source: 'D10'.
 */
export type CareerMechanismEvidenceRole = 'ESTABLISHING' | 'REFINING';

/**
 * Career mechanism source stage.
 * Per spec §10: tracks the stage or source type that contributed to a mechanism.
 *
 * This is currently aliased to CareerMechanismEvidenceSource as stages and sources
 * are identical in the current model. If stages diverge from sources in the future,
 * this should be changed to an explicit union.
 */
export type CareerMechanismSourceStage = CareerMechanismEvidenceSource;

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
  readonly role: CareerMechanismEvidenceRole;
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
  readonly sourceStages: readonly CareerMechanismSourceStage[];
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
  /**
   * IDs of establishing evidence records that were accepted for this candidate.
   * This explicitly identifies which supplied establishing evidence was validated
   * (matching source + ESTABLISHING role + expected pattern reference + mechanism-type match).
   * The accepted signal confirms "structural eligibility" only - it does NOT validate
   * full provenance agreement (e.g., relationshipIds/participantIds against the pattern's
   * establishingRelationshipIds/participants). Full provenance validation is a separate
   * concern performed at the pattern qualification layer.
   * When present, this should be used to derive establishingEvidenceStatus instead of
   * naive evidence ID intersection.
   */
  readonly acceptedEstablishingEvidenceIds?: readonly string[];
  /**
   * IDs of establishing evidence records that were rejected for this candidate.
   * This explicitly identifies which supplied establishing evidence failed validation
   * (non-ESTABLISHING role, wrong pattern reference, or wrong mechanism type).
   * When present, this distinguishes "explicitly rejected" from "signal absent" in the orchestrator.
   */
  readonly rejectedEstablishingEvidenceIds?: readonly string[];
  /**
   * IDs of establishing evidence records that were excluded by the source firewall.
   * This explicitly identifies which supplied establishing evidence was filtered out because
   * its source is not in ESTABLISHING_EVIDENCE_SOURCES (i.e., it's a later-stage source like
   * D10, DISPOSITOR, PLANETARY_RELEVANCE, etc. that cannot flow into provenance as establishing evidence).
   * This is distinct from validation rejection: firewall-excluded evidence is structurally valid
   * for later stages but ineligible for establishing provenance.
   */
  readonly firewallExcludedEstablishingEvidenceIds?: readonly string[];
}

/**
 * Career mechanism candidate set.
 * Per spec §15: collection of mechanism candidates with set-level provenance.
 *
 * The evidence and provenance fields represent the aggregate of all candidates,
 * deduplicated and sorted via mergeCareerMechanismProvenances.
 */
export interface CareerMechanismCandidateSet {
  readonly patternId: string;
  readonly candidates: readonly CareerMechanismCandidate[];
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}
