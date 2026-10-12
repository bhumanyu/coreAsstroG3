import type {
  CareerMechanismType,
  CareerMechanismPathway,
  CareerMechanismCandidate
} from '../careerMechanism';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';

/**
 * P2-08A Career Expression Model Types
 *
 * This module defines the canonical expression MODEL only — no resolution rules,
 * no mechanism→expression mapping (that's P2-08B), no 10H/10L refinement.
 *
 * Career expressions are domain-level classifications of HOW career activity manifests
 * in observable work patterns. They are derived from career mechanisms but focus on
 * the domain-level expression rather than the structural mechanism.
 *
 * NAMING COLLISION RESOLUTION:
 * - Legacy careerExpression.ts (C8 layer) exports CareerExpression, CareerExpressionAnalysis,
 *   CareerExpressionEvidence for mode/strength/weight-based analysis.
 * - This module uses CareerExpressionCandidate and CareerExpressionAnalysisResult to avoid collision.
 * - CareerMechanismExpressionEvidence (renamed from CareerExpressionEvidence) is mechanism-source-based
 *   to avoid collision with legacy mode/strength-based type.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 * - legacy careerExpression.ts (unless deliberately consumed)
 *
 * Expression ≠ profession: These types do NOT contain profession-specific values
 * like SOFTWARE_ENGINEER, BANKER, DOCTOR, etc. Those belong in a later synthesis layer.
 */

/**
 * Career expression types.
 * Per spec §8: the canonical expression vocabulary union.
 * These are domain-level classifications of HOW career activity manifests in observable work patterns.
 *
 * Starting vocabulary from spec §8 (only add members a rule actually emits):
 * - Expression family: derived from EXPRESSION mechanism family
 * - Work family: derived from EXECUTION mechanism family
 * - Knowledge family: derived from KNOWLEDGE mechanism family
 * - Business family: derived from BUSINESS mechanism family
 * - Institutional family: derived from INSTITUTIONAL mechanism family
 * - Foreign family: derived from FOREIGN mechanism family
 *
 * Mapped from CareerMechanismType in careerMechanismTypes.ts:
 * EXPRESSION → EXPRESSION family
 * EXECUTION → WORK family
 * KNOWLEDGE → KNOWLEDGE family
 * BUSINESS → BUSINESS family
 * INSTITUTIONAL → INSTITUTIONAL family
 * FOREIGN → FOREIGN family
 *
 * Specific mappings (1:1 primary, composite for multi-mechanism expressions):
 * - RESEARCH → RESEARCH_WORK
 * - COMMUNICATION → COMMUNICATION_WORK
 * - AUTHORITY → AUTHORITY_EXPRESSION
 * - LEADERSHIP → LEADERSHIP_EXPRESSION
 * - TEACHING → TEACHING_EXPRESSION
 * - WRITING → WRITING_WORK
 * - INNOVATION → INNOVATION_WORK
 * - SERVICE_EMPLOYMENT → SERVICE_WORK
 * - FOREIGN_WORK → FOREIGN_WORK_EXPRESSION
 * - INSTITUTIONAL_WORK → INSTITUTIONAL_WORK_EXPRESSION
 * - ISOLATED_ENVIRONMENT → ISOLATED_WORK_EXPRESSION
 * - BANKING_FINANCE → FINANCIAL_WORK
 * - INSURANCE → INSURANCE_WORK
 * - TAXATION → TAXATION_WORK
 * - COMPLIANCE → COMPLIANCE_WORK
 * - CRISIS_MANAGEMENT → CRISIS_MANAGEMENT_WORK
 * - REMOTE_WORK → REMOTE_WORK_EXPRESSION
 * - RESEARCH + SPECIALIZED_KNOWLEDGE → ANALYTICAL_SPECIALIZED_WORK (composite example)
 *
 * NOTE: Only add expression types that are actually emitted by rules in careerExpressionRules.ts.
 * This ensures the union stays minimal and matched to CareerMechanismType.
 */
export type CareerExpressionType =
  // Expression family (from EXPRESSION mechanism family)
  | 'AUTHORITY_EXPRESSION'
  | 'LEADERSHIP_EXPRESSION'
  | 'TEACHING_EXPRESSION'
  // Work family (from EXECUTION mechanism family)
  | 'RESEARCH_WORK'
  | 'COMMUNICATION_WORK'
  | 'WRITING_WORK'
  | 'INNOVATION_WORK'
  | 'SERVICE_WORK'
  // Knowledge family (from KNOWLEDGE mechanism family)
  | 'ANALYTICAL_SPECIALIZED_WORK'
  // Business family (from BUSINESS mechanism family)
  | 'FINANCIAL_WORK'
  | 'INSURANCE_WORK'
  | 'TAXATION_WORK'
  | 'COMPLIANCE_WORK'
  | 'CRISIS_MANAGEMENT_WORK'
  // Institutional family (from INSTITUTIONAL mechanism family)
  | 'INSTITUTIONAL_WORK_EXPRESSION'
  | 'ISOLATED_WORK_EXPRESSION'
  // Foreign family (from FOREIGN mechanism family)
  | 'FOREIGN_WORK_EXPRESSION'
  | 'REMOTE_WORK_EXPRESSION';

/**
 * Career expression qualification status.
 * Per P2-11C Gate 1: canonical C8 identity/qualification types.
 *
 * QUALIFIED: Expression is qualified by an authoritative qualification rule.
 * CANDIDATE: Expression derived from one or more mechanism candidates but lacks authoritative qualification.
 * UNRESOLVED: Expression cannot be determined due to insufficient data or conflicting signals.
 * NOT_APPLICABLE: Expression does not apply to the current context.
 *
 * Invariants:
 * - A QUALIFIED expression must carry authorizing ruleIds (enforced via discriminated union).
 * - A CANDIDATE must never be silently promoted to QUALIFIED without a rule.
 * - UNRESOLVED/NOT_APPLICABLE stay in those states; never default to CANDIDATE.
 */
export type CareerExpressionQualificationStatus =
  | 'QUALIFIED'
  | 'CANDIDATE'
  | 'UNRESOLVED'
  | 'NOT_APPLICABLE';

/**
 * Career expression status (legacy compatibility).
 * Per spec §8: lifecycle status of an expression.
 * Only statuses that can actually be reached are included (no unreachable status).
 *
 * CANDIDATE: Expression derived from one or more mechanism candidates.
 * INSUFFICIENT_DATA: Missing required context to determine expression candidacy.
 *
 * Note: This is the legacy status field. New code should use CareerExpressionQualificationStatus
 * for canonical qualification tracking.
 */
export type CareerExpressionStatus =
  | 'CANDIDATE'
  | 'INSUFFICIENT_DATA';

/**
 * Canonical expression direction.
 * Per P2-11C Gate 1: reconciled with existing CareerExpressionDirection enum.
 *
 * Reuses existing CareerExpressionDirection from careerExpression.ts:
 * - SUPPORTED, CONDITIONAL, NEUTRAL, UNAVAILABLE
 *
 * No competing union introduced - this is an alias for type-level documentation.
 */
export type CareerExpressionCanonicalDirection =
  | 'SUPPORTED'
  | 'CONDITIONAL'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

/**
 * Canonical expression strength.
 * Per P2-11C Gate 1: reconciled with existing CareerExpressionStrength enum.
 *
 * Reuses existing CareerExpressionStrength from careerExpression.ts:
 * - STRONG, MODERATE, WEAK, UNAVAILABLE
 *
 * No competing union introduced - this is an alias for type-level documentation.
 */
export type CareerExpressionCanonicalStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'UNAVAILABLE';

/**
 * Canonical expression provenance record.
 * Per P2-11C Gate 1: provenance tracking with DISTINCT identity fields.
 *
 * Invariants:
 * - candidateId: The mechanism candidate ID that produced this expression (required for candidates).
 * - mechanismId: The resolved mechanism ID (required for QUALIFIED expressions, optional for CANDIDATE).
 * - sourceMechanismIds: All mechanism IDs that contributed to this expression (may be multiple).
 * - ruleIds: The rule IDs that authorized this expression (required for QUALIFIED, empty for CANDIDATE).
 * - sourceEvidenceIds: The upstream evidence IDs that support this expression.
 * - participantIds: The participant IDs (planets/houses) involved in this expression.
 * - identityKey: Optional semantic identity key (absent stays absent - never synthesized from IDs/mode/statement).
 *
 * Key distinction:
 * - candidateId vs mechanismId: candidateId is the candidate from C7, mechanismId is the resolved mechanism.
 * - sourceMechanismIds vs mechanismId: sourceMechanismIds is a list, mechanismId is the single resolved ID.
 * - identityKey is optional and only present when explicitly supplied; never fabricated.
 */
export interface CareerExpressionCanonicalProvenance {
  readonly candidateId: string;
  readonly mechanismId?: string; // Required for QUALIFIED, optional for CANDIDATE
  readonly sourceMechanismIds: readonly string[];
  readonly ruleIds: readonly string[]; // Required for QUALIFIED, empty for CANDIDATE
  readonly sourceEvidenceIds: readonly string[];
  readonly participantIds: readonly string[];
  readonly identityKey?: string; // Optional - never synthesized if absent
}

/**
 * Qualified expression with authorizing rules.
 * Per P2-11C Gate 1: discriminated union for QUALIFIED expressions.
 *
 * This type ensures via the type system that a QUALIFIED expression always carries
 * the authorizing ruleIds. The compiler will reject QUALIFIED-with-no-rule.
 */
export interface QualifiedExpression {
  readonly qualificationStatus: 'QUALIFIED';
  readonly ruleIds: readonly string[]; // Non-empty - enforced by runtime check
  readonly provenance: CareerExpressionCanonicalProvenance;
}

/**
 * Candidate expression without authorizing rules.
 * Per P2-11C Gate 1: discriminated union for CANDIDATE expressions.
 *
 * This type represents expressions derived from mechanism candidates but lacking
 * authoritative qualification. ruleIds is empty by contract.
 */
export interface CandidateExpression {
  readonly qualificationStatus: 'CANDIDATE';
  readonly ruleIds: readonly string[]; // Empty by contract
  readonly provenance: CareerExpressionCanonicalProvenance;
}

/**
 * Unresolved expression due to insufficient data.
 * Per P2-11C Gate 1: discriminated union for UNRESOLVED expressions.
 */
export interface UnresolvedExpression {
  readonly qualificationStatus: 'UNRESOLVED';
  readonly ruleIds: readonly string[]; // Empty by contract
  readonly provenance?: CareerExpressionCanonicalProvenance;
}

/**
 * Not applicable expression.
 * Per P2-11C Gate 1: discriminated union for NOT_APPLICABLE expressions.
 */
export interface NotApplicableExpression {
  readonly qualificationStatus: 'NOT_APPLICABLE';
  readonly ruleIds: readonly string[]; // Empty by contract
  readonly provenance?: CareerExpressionCanonicalProvenance;
}

/**
 * Canonical expression qualification union.
 * Per P2-11C Gate 1: discriminated union for all qualification states.
 *
 * The compiler enforces that QUALIFIED expressions have non-empty ruleIds.
 * Runtime validation should check this invariant as well.
 */
export type CareerExpressionQualification =
  | QualifiedExpression
  | CandidateExpression
  | UnresolvedExpression
  | NotApplicableExpression;

/**
 * Career expression pathway.
 * Per spec §8: how an expression is detected or derived.
 * Passthrough of CareerMechanismPathway (no new values).
 *
 * Expressions inherit the pathway from their source mechanisms.
 */
export type CareerExpressionPathway = CareerMechanismPathway;

/**
 * Career expression candidate.
 * Per spec §8: canonical expression record derived from mechanism candidates.
 *
 * expressionId: Unique identifier for this expression candidate.
 * expressionType: The domain-level expression type.
 * sourceMechanismIds: IDs of the mechanism candidates that produced this expression.
 * mechanismTypes: The mechanism types that produced this expression (for provenance).
 * status: CANDIDATE or INSUFFICIENT_DATA.
 * pathway: How the expression was derived (inherited from source mechanisms).
 * evidence: Evidence records linking this expression to its sources.
 * provenance: Provenance tracking for this expression.
 */
export interface CareerExpressionCandidate {
  readonly expressionId: string;
  readonly expressionType: CareerExpressionType;
  readonly sourceMechanismIds: readonly string[];
  readonly mechanismTypes: readonly CareerMechanismType[];
  readonly status: CareerExpressionStatus;
  readonly pathway: CareerExpressionPathway;
  readonly evidence: readonly CareerMechanismExpressionEvidence[];
  readonly provenance: CareerExpressionProvenance;
}

/**
 * Career mechanism expression evidence.
 * Per spec §8: evidence record for an expression.
 *
 * DIVERGENCE FROM LEGACY:
 * - Legacy CareerExpressionEvidence (careerExpression.ts C8 layer): mode/strength/weight-based,
 *   with fields: id, mode, role, statement, weight, planets, houses.
 * - This CareerMechanismExpressionEvidence: mechanism-source-based, with fields: evidenceId, sourceMechanismId,
 *   sourceEvidenceIds, source10HIds, source10LIds, ruleId, role.
 *
 * evidenceId: Unique identifier for this evidence record.
 * sourceMechanismId: ID of the mechanism candidate that is the source of this evidence.
 * sourceEvidenceIds: IDs of the mechanism evidence records that support this expression.
 * source10HIds: IDs of 10H foundation records that refined this expression (optional context).
 * source10LIds: IDs of 10L foundation records that refined this expression (optional context).
 * ruleId: ID of the expression rule that produced this candidate.
 * role: Role of this evidence (ESTABLISHING or REFINING).
 *   ESTABLISHING means the evidence establishes the expression candidate, not the natal mechanism.
 */
export interface CareerMechanismExpressionEvidence {
  readonly evidenceId: string;
  readonly sourceMechanismId: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly source10HIds?: readonly string[];
  readonly source10LIds?: readonly string[];
  readonly ruleId: string;
  readonly role: 'ESTABLISHING' | 'REFINING';
}

/**
 * Career expression provenance.
 * Per spec §8: provenance tracking for an expression.
 *
 * Tracks the chain from expression → mechanism → pattern → relationship.
 * This enables traceability of how an expression was derived.
 */
export interface CareerExpressionProvenance {
  readonly mechanismIds: readonly string[];
  readonly patternIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceStages: readonly string[];
}

/**
 * Career expression analysis result.
 * Per spec §8: result of expression resolution.
 *
 * DIVERGENCE FROM LEGACY:
 * - Legacy CareerExpressionAnalysis (careerExpression.ts C8 layer): expressions, primaryExpression,
 *   statement.
 * - This CareerExpressionAnalysisResult: expressions, status, sourceMechanismIds, missingInputs,
 *   provenance.
 *
 * expressions: The set of expression candidates derived from mechanisms.
 * status: COMPLETE (all required inputs present), PARTIAL (some optional inputs missing),
 *   INSUFFICIENT_DATA (required inputs missing).
 * sourceMechanismIds: IDs of all mechanism candidates used in this resolution.
 * missingInputs: List of missing input types (e.g., 'career10HFoundation', 'career10LFoundation').
 * unmappedMechanismTypes: Mechanism types with no matching rule (distinguishes no-rule from insufficient-data).
 * provenance: Aggregate provenance for the entire analysis.
 */
export interface CareerExpressionAnalysisResult {
  readonly expressions: readonly CareerExpressionCandidate[];
  readonly status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly sourceMechanismIds: readonly string[];
  readonly missingInputs: readonly string[];
  readonly unmappedMechanismTypes: readonly CareerMechanismType[];
  readonly provenance: CareerExpressionProvenance;
}

/**
 * Per P2-11C Gate 2: Canonical C8 result with candidate/qualification separation.
 *
 * This result type retains each candidate's qualification status, provenance, and a trace list
 * SEPARATE from directional evidence.
 *
 * Key distinctions from legacy CareerExpressionAnalysisResult:
 * - Each expression candidate carries qualificationStatus (QUALIFIED/CANDIDATE/UNRESOLVED/NOT_APPLICABLE)
 * - direction and strength are UNAVAILABLE for CANDIDATE expressions (no upstream rule signal)
 * - trace list is separate from directional evidence (trace visible even when no directional evidence emitted)
 * - QUALIFIED expressions must carry authorizing ruleIds (enforced via CareerExpressionQualification union)
 * - Candidates with no authoritative qualification rule stay CANDIDATE with UNAVAILABLE direction/strength
 *
 * Invariants:
 * - A QUALIFIED expression must have non-empty ruleIds and direction/strength other than UNAVAILABLE
 * - A CANDIDATE expression has empty ruleIds and direction/strength UNAVAILABLE
 * - Trace is always present for each candidate (for observability)
 * - Directional evidence is only emitted for QUALIFIED expressions
 */
export interface CareerExpressionCanonicalResult {
  readonly expressions: readonly CareerExpressionCanonicalCandidate[];
  readonly status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly sourceMechanismIds: readonly string[];
  readonly missingInputs: readonly string[];
  readonly unmappedMechanismTypes: readonly CareerMechanismType[];
  readonly provenance: CareerExpressionProvenance;
}

/**
 * Per P2-11C Gate 2: Canonical expression candidate with qualification tracking.
 *
 * Extends CareerExpressionCandidate with:
 * - qualificationStatus: The qualification status of this expression
 * - direction: Canonical direction (UNAVAILABLE for CANDIDATE)
 * - strength: Canonical strength (UNAVAILABLE for CANDIDATE)
 * - qualification: The qualification details (discriminated union)
 * - trace: Trace messages for observability (separate from directional evidence)
 *
 * Invariants:
 * - QUALIFIED: direction/strength are set, qualification has non-empty ruleIds
 * - CANDIDATE: direction/strength are UNAVAILABLE, qualification has empty ruleIds
 * - UNRESOLVED/NOT_APPLICABLE: direction/strength are UNAVAILABLE, qualification has empty ruleIds
 */
export interface CareerExpressionCanonicalCandidate extends CareerExpressionCandidate {
  readonly qualificationStatus: CareerExpressionQualificationStatus;
  readonly direction: CareerExpressionCanonicalDirection;
  readonly strength: CareerExpressionCanonicalStrength;
  readonly qualification: CareerExpressionQualification;
  readonly trace: readonly string[];
}

/**
 * Career expression resolver input.
 * Per spec §8: input for expression resolution.
 *
 * careerMechanismCandidates: The mechanism candidates to resolve into expressions.
 * careerMechanismRefinements: Optional refined mechanisms (e.g., from dispositor refinement).
 * career10HFoundation: Optional 10H foundation for context refinement (never establishes expressions).
 * career10LFoundation: Optional 10L foundation for context refinement (never establishes expressions).
 */
export interface CareerExpressionResolverInput {
  readonly careerMechanismCandidates: readonly CareerMechanismCandidate[];
  readonly careerMechanismRefinements?: readonly CareerMechanismCandidate[];
  readonly career10HFoundation?: Career10HFoundation;
  readonly career10LFoundation?: Career10LFoundation;
}
