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
 * Career expression status.
 * Per spec §8: lifecycle status of an expression.
 * Only statuses that can actually be reached are included (no unreachable status).
 *
 * CANDIDATE: Expression derived from one or more mechanism candidates.
 * INSUFFICIENT_DATA: Missing required context to determine expression candidacy.
 *
 * Note: QUALIFIED is omitted if it cannot be reached. Expressions are either
 * candidates or insufficient data. Qualification happens at the mechanism layer.
 */
export type CareerExpressionStatus =
  | 'CANDIDATE'
  | 'INSUFFICIENT_DATA';

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
