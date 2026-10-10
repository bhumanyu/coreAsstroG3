import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerExpressionType
} from '../careerExpression/careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismType
} from '../careerMechanism/careerMechanismTypes';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';
import type {
  CareerD10CanonicalAnalysis
} from '../careerD10/careerD10CanonicalTypes';
import type {
  DomainEvidence
} from '../../interpretation/DomainEvidence';

/**
 * P2-10A Career Domain/Profession Model Types
 *
 * This module defines the canonical profession MODEL only — no resolution rules,
 * no domain mapping (that's P2-10B), no refinement adapters.
 *
 * Career professions are broad professional-domain candidates and profession families
 * derived from already-computed canonical career outputs (expressions, mechanisms,
 * 10H/10L foundations, D10 qualification, DomainEvidence). This layer does NOT
 * recalculate astrology, does NOT map a planet directly to a job title, and does NOT
 * let D10/Dasha/timing create candidates.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - d10/ (except careerD10 canonical types for qualification-only)
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 *
 * Profession ≠ job title: These types do NOT contain exact job titles
 * like SOFTWARE_ENGINEER, BANKER, DOCTOR, etc. Those belong to a later synthesis layer.
 * This module produces broad professional-domain candidates (e.g., TECHNOLOGY, FINANCE)
 * and profession families (e.g., TECHNICAL_LEADERSHIP, FINANCIAL_SERVICES).
 */

/**
 * Career profession domains.
 * Per spec §3: broad professional-domain candidates.
 * These are high-level domain classifications, not exact job titles.
 *
 * Starting vocabulary from spec §3 (only add domains that rules actually emit):
 * - TECHNOLOGY: Technology and software-related domains
 * - FINANCE: Financial services and banking domains
 * - HEALTHCARE: Healthcare and medical domains
 * - EDUCATION: Education and teaching domains
 * - LEADERSHIP: Leadership and management domains
 * - COMMUNICATION: Communication and media domains
 * - RESEARCH: Research and analysis domains
 * - SERVICE: Service-oriented domains
 * - INSTITUTIONAL: Institutional and government domains
 * - FOREIGN: Foreign and international domains
 * - REMOTE: Remote and distributed work domains
 *
 * NOTE: Only add profession domains that are actually emitted by rules in careerProfessionRules.ts.
 */
export type CareerProfessionDomain =
  | 'TECHNOLOGY'
  | 'FINANCE'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'LEADERSHIP'
  | 'COMMUNICATION'
  | 'RESEARCH'
  | 'SERVICE'
  | 'INSTITUTIONAL'
  | 'FOREIGN'
  | 'REMOTE';

/**
 * Career profession families.
 * Per spec §3: profession families within domains.
 * These are sub-classifications of domains that group related profession types.
 *
 * Starting vocabulary from spec §3 (only add families that rules actually emit):
 * - TECHNICAL_LEADERSHIP: Leadership roles in technology
 * - FINANCIAL_SERVICES: Financial service roles
 * - MEDICAL_PRACTICE: Medical practice roles
 * - ACADEMIC_TEACHING: Academic and teaching roles
 * - EXECUTIVE_MANAGEMENT: Executive management roles
 * - MEDIA_COMMUNICATION: Media and communication roles
 * - ANALYTICAL_RESEARCH: Analytical research roles
 * - PUBLIC_SERVICE: Public service roles
 * - GOVERNMENT_ADMINISTRATION: Government administration roles
 * - INTERNATIONAL_BUSINESS: International business roles
 * - DISTRIBUTED_TEAMWORK: Distributed teamwork roles
 *
 * NOTE: Only add profession families that are actually emitted by rules in careerProfessionRules.ts.
 */
export type CareerProfessionFamily =
  | 'TECHNICAL_LEADERSHIP'
  | 'FINANCIAL_SERVICES'
  | 'MEDICAL_PRACTICE'
  | 'ACADEMIC_TEACHING'
  | 'EXECUTIVE_MANAGEMENT'
  | 'MEDIA_COMMUNICATION'
  | 'ANALYTICAL_RESEARCH'
  | 'PUBLIC_SERVICE'
  | 'GOVERNMENT_ADMINISTRATION'
  | 'INTERNATIONAL_BUSINESS'
  | 'DISTRIBUTED_TEAMWORK';

/**
 * Career profession basis.
 * Per spec §3: what establishes a profession candidate.
 * Tracks the primary evidence that establishes the candidate.
 */
export type CareerProfessionBasis =
  | 'EXPRESSION'
  | 'MECHANISM'
  | '10H_FOUNDATION'
  | '10L_FOUNDATION'
  | 'D10_QUALIFICATION'
  | 'DOMAIN_EVIDENCE';

/**
 * Career profession D10 status.
 * Per spec §3: D10 qualification status for a profession candidate.
 * D10 only qualifies existing candidates; it never creates them.
 *
 * QUALIFIED: D10 qualification is available and supports this candidate.
 * NOT_PROVIDED: D10 data is not provided (input missing).
 * UNAVAILABLE: D10 data is provided but no qualification matches this candidate.
 * NOT_APPLICABLE: D10 qualification is not applicable to this candidate.
 */
export type CareerProfessionD10Status =
  | 'QUALIFIED'
  | 'NOT_PROVIDED'
  | 'UNAVAILABLE'
  | 'NOT_APPLICABLE';

/**
 * Career profession evidence.
 * Per spec §3: evidence record for a profession candidate.
 *
 * evidenceId: Unique identifier for this evidence record.
 * basis: What establishes this evidence (EXPRESSION, MECHANISM, etc.).
 * sourceIds: IDs of the source records that produced this evidence.
 * ruleId: ID of the profession rule that produced this candidate.
 * statement: Human-readable statement of the evidence.
 * linkage: Linkage completeness metadata for expression-based evidence. COMPLETE if all
 *   sourceMechanismIds resolve to pattern mechanisms, PARTIAL if only some resolve.
 * resolvedMechanismIds: Source mechanism IDs that resolved to pattern mechanisms.
 * unresolvedMechanismIds: Source mechanism IDs that did not resolve to pattern mechanisms.
 *
 * Provenance discipline: evidenceIds, sourceIds, ruleIds are in separate namespaces.
 * Do not fabricate source IDs. Carry real upstream source IDs where they genuinely exist,
 * otherwise leave empty rather than inventing.
 */
export interface CareerProfessionEvidence {
  readonly evidenceId: string;
  readonly basis: CareerProfessionBasis;
  readonly sourceIds: readonly string[];
  readonly ruleId: string;
  readonly statement: string;
  readonly linkage?: 'COMPLETE' | 'PARTIAL';
  readonly resolvedMechanismIds?: readonly string[];
  readonly unresolvedMechanismIds?: readonly string[];
}

/**
 * Career profession candidate.
 * Per spec §3: canonical profession record derived from career outputs.
 *
 * candidateId: Unique identifier for this profession candidate.
 * Includes source-pattern set so candidates from distinct patterns are not collapsed.
 * domain: The broad professional-domain candidate.
 * family: The profession family within the domain.
 * basis: What establishes this candidate (EXPRESSION, MECHANISM, etc.).
 * expressionTypes: The expression types that contributed to this candidate.
 * mechanismTypes: The mechanism types that contributed to this candidate.
 * patternIds: The pattern IDs from which this candidate was derived (pattern-scoped).
 * d10Status: D10 qualification status for this candidate.
 * evidence: Evidence records linking this candidate to its sources.
 * domainEvidenceIds: IDs of DomainEvidence records that support this candidate.
 * relatedEvidenceIds: IDs of related evidence records (for traceability).
 * ruleId: ID of the profession rule that produced this candidate.
 *
 * Invariant: D10 can only qualify an existing candidate; it never creates one.
 * Missing/unavailable D10 is NOT_PROVIDED/UNAVAILABLE, not negative evidence.
 */
export interface CareerProfessionCandidate {
  readonly candidateId: string;
  readonly domain: CareerProfessionDomain;
  readonly family: CareerProfessionFamily;
  readonly basis: CareerProfessionBasis;
  readonly expressionTypes: readonly CareerExpressionType[];
  readonly mechanismTypes: readonly CareerMechanismType[];
  readonly patternIds: readonly string[];
  readonly d10Status: CareerProfessionD10Status;
  readonly evidence: readonly CareerProfessionEvidence[];
  readonly domainEvidenceIds: readonly string[];
  readonly relatedEvidenceIds: readonly string[];
  readonly ruleId: string;
}

/**
 * Career profession analysis status.
 * Per spec §3: lifecycle status of a profession analysis.
 *
 * COMPLETE: All required inputs present and analysis complete.
 * PARTIAL: Some optional inputs missing but analysis can proceed.
 * INSUFFICIENT_DATA: Required inputs missing.
 */
export type CareerProfessionAnalysisStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'INSUFFICIENT_DATA';

/**
 * Career profession analysis result.
 * Per spec §3: result of profession resolution.
 *
 * candidates: The set of profession candidates derived from career outputs.
 * status: COMPLETE, PARTIAL, or INSUFFICIENT_DATA.
 * unresolvedExpressionTypes: Expression types with no matching profession rule.
 * mappedTypes: Expression types actually consumed by emitted candidates.
 * missingInputs: List of missing input types.
 * provenance: Aggregate provenance for the entire analysis.
 */
export interface CareerProfessionAnalysis {
  readonly candidates: readonly CareerProfessionCandidate[];
  readonly status: CareerProfessionAnalysisStatus;
  readonly unresolvedExpressionTypes: readonly CareerExpressionType[];
  readonly mappedTypes: readonly CareerExpressionType[];
  readonly missingInputs: readonly string[];
  readonly provenance: CareerProfessionProvenance;
}

/**
 * Career profession provenance.
 * Per spec §3: provenance tracking for a profession analysis.
 *
 * expressionIds: IDs of expression candidates used in this analysis.
 * mechanismIds: IDs of mechanism candidates used in this analysis.
 * patternIds: IDs of patterns used in this analysis.
 * evidenceIds: IDs of evidence records used in this analysis.
 * sourceIds: IDs of source records used in this analysis.
 * ruleIds: IDs of rules used in this analysis.
 *
 * Provenance discipline: evidenceIds, sourceIds, ruleIds are in separate namespaces.
 */
export interface CareerProfessionProvenance {
  readonly expressionIds: readonly string[];
  readonly mechanismIds: readonly string[];
  readonly patternIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Career profession refinement.
 * Per spec §3: refinement adapter for profession candidates.
 * This is a placeholder for future refinement adapters (D9, dispositor, sign-element,
 * career-house). These are not implemented in this pass.
 */
export interface CareerProfessionRefinement {
  readonly refinementType: string;
  readonly candidateId: string;
  readonly refinements: readonly unknown[];
}

/**
 * Career profession input.
 * Per spec §3: input for profession resolution.
 *
 * expressions: Career expression analysis result from P2-08A.
 * mechanisms: Career mechanism candidates from P2-07C/P2-07D.
 * career10HFoundation: 10H foundation from P2-07F (optional context).
 * career10LFoundation: 10L foundation from P2-07G (optional context).
 * careerD10CanonicalAnalysis: D10 canonical analysis from P2-08D (qualification-only).
 * domainEvidence: Domain evidence records from P2-08E (optional context).
 *
 * D10 contract: D10 only qualifies existing candidates; it never creates them.
 * Missing D10 is NOT_PROVIDED, not negative evidence.
 */
export interface CareerProfessionInput {
  readonly expressions: CareerExpressionAnalysisResult;
  readonly mechanisms: readonly CareerMechanismCandidate[];
  readonly career10HFoundation?: Career10HFoundation;
  readonly career10LFoundation?: Career10LFoundation;
  readonly careerD10CanonicalAnalysis?: CareerD10CanonicalAnalysis;
  readonly domainEvidence?: readonly DomainEvidence[];
}
