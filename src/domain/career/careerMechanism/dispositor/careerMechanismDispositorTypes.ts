import type {
  CareerMechanism,
  CareerMechanismCandidate
} from '../careerMechanismTypes';
import type { Planet } from '../../../../types';

/**
 * P2-07E Career Mechanism Dispositor Refinement Types
 *
 * This module defines the type system for dispositor-based refinement of career mechanism
 * candidates. It consumes the existing careerDispositor engine to refine mechanism types
 * based on terminal planet analysis.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerD10
 * - careerDasha
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 */

/**
 * Status of dispositor-based refinement.
 */
export type DispositorRefinementStatus =
  | 'REFINED'
  | 'UNCHANGED'
  | 'INSUFFICIENT_DATA';

/**
 * Normalized view of a dispositor chain for mechanism refinement.
 * Maps the existing careerDispositor termination enum onto a normalized view.
 *
 * Termination mapping:
 * - CAREER_TERMINAL / NON_CAREER_TERMINAL → TERMINAL
 * - SELF_DISPOSITOR → SELF_DISPOSITOR
 * - CYCLE → CYCLE
 * - MUTUAL_RECEPTION → MUTUAL_RECEPTION
 * - UNAVAILABLE → INSUFFICIENT_DATA
 * - Depth limit → DEPTH_LIMIT
 *
 * chainId and provenanceIds reuse the dispositor engine's own identity/provenance — never mint new ones.
 */
export interface CareerDispositorChain {
  readonly startPlanetId: Planet;
  readonly chain: readonly Planet[];
  readonly terminalPlanetId?: Planet;
  readonly depth: number;
  readonly outcome:
  | 'TERMINAL'
  | 'SELF_DISPOSITOR'
  | 'CYCLE'
  | 'MUTUAL_RECEPTION'
  | 'DEPTH_LIMIT'
  | 'INSUFFICIENT_DATA';
  readonly chainId: string;
  readonly provenanceIds: readonly string[];
}

/**
 * Context for a dispositor chain in mechanism refinement.
 *
 * sourceEvidenceIds carries the specific evidence responsible for the start planet being
 * career-relevant (e.g. the 10L evidence), NOT the whole candidate evidence list.
 */
export interface CareerDispositorContext {
  readonly startPlanetId: Planet;
  readonly chain: readonly Planet[];
  readonly sourceEvidenceIds: readonly string[];
  readonly relevantHouseIds: readonly number[];
  readonly sufficientData: boolean;
}

/**
 * Input for a career mechanism dispositor rule.
 */
export interface CareerMechanismDispositorRuleInput {
  readonly mechanismType: string;
  readonly participantIds: readonly string[];
  readonly context: CareerDispositorContext;
}

/**
 * Result from a career mechanism dispositor rule.
 */
export interface CareerMechanismDispositorRuleResult {
  readonly mechanismTypes: readonly string[];
  readonly explanation: string;
  readonly evidence: readonly string[];
}

/**
 * A dispositor-based refinement rule for career mechanisms.
 * Rules only refine an existing mechanismType; they never emit a mechanism for an absent candidate.
 */
export interface CareerMechanismDispositorRule {
  readonly ruleId: string;
  readonly description: string;

  /**
   * Checks if this rule applies to the given input.
   */
  applies(input: CareerMechanismDispositorRuleInput): boolean;

  /**
   * Refines the mechanism based on dispositor context.
   * Returns refined mechanism types, explanation, and evidence IDs.
   */
  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult;
}

/**
 * Input for dispositor-based mechanism refinement.
 * Accepts ONLY an existing CareerMechanismCandidate; there is no planet-only entry point
 * (structural guarantee that refinement never manufactures natal promise).
 */
export interface CareerMechanismDispositorRefinementInput {
  readonly candidate: CareerMechanismCandidate;
  readonly dispositorContexts: readonly CareerDispositorContext[];
}

/**
 * Result of dispositor-based mechanism refinement.
 * Refined mechanism types become separate CareerMechanism records, one per mechanism type,
 * preserving candidate identity. NOT one mechanism carrying multiple types.
 */
export interface CareerMechanismDispositorRefinementResult {
  readonly status: DispositorRefinementStatus;
  readonly originalCandidateId: string;
  readonly mechanisms: readonly CareerMechanism[];
  readonly evidence: readonly string[];
  readonly provenance: {
    readonly originalProvenance: Record<string, readonly string[]>;
    readonly newEvidenceIds: readonly string[];
    readonly sourceStages: readonly string[];
  };
  readonly explanation: string;
}
