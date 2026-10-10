import type {
  CareerFinalSynthesisResult
} from '../careerFinalSynthesis/careerFinalSynthesisTypes';

import type {
  DomainEvidence
} from '../../interpretation/DomainEvidence';

/**
 * P2-09A Career Trajectory Layer
 *
 * A deterministic downstream module that converts the authoritative C11 CareerFinalSynthesisResult
 * plus existing DomainEvidence into a long-term career trajectory classification.
 *
 * This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology,
 * must NOT wire itself into CareerDomainInterpreterV2.ts, and must NOT consume the deferred
 * canonicalCareerEvidenceMapper or legacy C4 evidence.
 */

/**
 * Long-term career trajectory pattern classification.
 *
 * Derived from natalDirection and natalStrength ONLY (C11 fields).
 * Dasha/D10/transit/currentPressure/timing must never influence this classification.
 */
export type CareerTrajectoryPattern =
  | 'GROWTH_CAPABLE'
  | 'CONDITIONAL_GROWTH'
  | 'NON_LINEAR'
  | 'CONSTRAINED'
  | 'INSUFFICIENT_DATA';

/**
 * Current career phase classification.
 *
 * Mapped from C11 timingStatus (CareerFinalTimingStatus).
 */
export type CareerTrajectoryCurrentPhase =
  | 'ACTIVE'
  | 'PARTIALLY_ACTIVE'
  | 'CHALLENGED'
  | 'NOT_ACTIVE'
  | 'UNKNOWN';

/**
 * Career opportunity extracted from C11 expressions.
 *
 * Copies mode/direction/strength/qualified verbatim from finalSynthesis.expressions entries.
 * No normalization, no promotion of unqualified expressions.
 *
 * EVIDENCE CONSISTENCY: The evidenceIds array preserves C11 expression references verbatim.
 * Expression-level evidenceIds are checked against the supplied evidence set, and any missing
 * IDs are surfaced in unresolvedEvidenceIds. This check is for consistency reporting only;
 * the copied IDs are not modified. Note: IDs that exist in the evidence set but are not
 * referenced at the top level (expression-only) are not surfaced as unresolved — only
 * genuinely missing IDs are reported.
 */
export interface CareerTrajectoryOpportunity {
  readonly mode: string;
  readonly direction: string;
  readonly strength: string;
  readonly qualified: boolean;
  readonly evidenceIds: readonly string[];
}

/**
 * Career trajectory analysis result.
 *
 * Output contract for the P2-09A Career Trajectory layer.
 */
export interface CareerTrajectoryAnalysis {
  readonly reasoningVersion: 'P2-09A';

  readonly domain: 'CAREER';

  /**
   * Long-term trajectory pattern derived from natalDirection/natalStrength ONLY.
   */
  readonly longTermPattern: CareerTrajectoryPattern;

  /**
   * Current phase mapped from C11 timingStatus.
   */
  readonly currentPhase: CareerTrajectoryCurrentPhase;

  /**
   * Current status from C11 finalStatus.
   */
  readonly currentStatus: CareerFinalSynthesisResult['finalStatus'];

  /**
   * Opportunities extracted from C11 expressions (qualified and unqualified).
   */
  readonly opportunities: readonly CareerTrajectoryOpportunity[];

  /**
   * All evidence IDs referenced by C11 (deduplicated and sorted).
   */
  readonly evidenceIds: readonly string[];

  /**
   * Evidence IDs referenced by C11 but not present in the supplied evidence set.
   */
  readonly unresolvedEvidenceIds: readonly string[];

  /**
   * Source IDs from C11 (deduplicated and sorted).
   */
  readonly sourceIds: readonly string[];

  /**
   * Rule IDs from C11 (deduplicated and sorted).
   */
  readonly ruleIds: readonly string[];

  /**
   * Whether dated forecast events are available.
   * Always false in this implementation (deferred capability).
   */
  readonly datedForecastAvailable: false;

  /**
   * Human-readable summary statement.
   */
  readonly statement: string;
}

/**
 * Input contract for career trajectory analysis.
 *
 * Consumes authoritative C11 output and existing DomainEvidence.
 */
export interface CareerTrajectoryInput {
  /**
   * Authoritative C11 final synthesis result.
   */
  readonly finalSynthesis: CareerFinalSynthesisResult;

  /**
   * Existing domain evidence set for reference resolution.
   * Evidence supplied but NOT referenced by C11 must never become a trajectory signal.
   */
  readonly evidence: ReadonlySet<DomainEvidence>;
}
