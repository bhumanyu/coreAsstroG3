import type {
  CareerTrajectoryAnalysis
} from '../careerTrajectory/careerTrajectoryTypes';

import type {
  CareerDashaCanonicalAnalysis
} from '../careerDasha/careerDashaCanonicalTypes';

/**
 * P2-09B Career Events & Timing Layer
 *
 * A deterministic downstream module that consumes canonical C11 (CareerFinalSynthesisResult)
 * and C9 (CareerDashaCanonicalAnalysis) to produce evidence-traceable career event candidates
 * and source-backed timing windows.
 *
 * This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology,
 * must NOT wire itself into CareerDomainInterpreterV2.ts, and must NOT call AI.
 *
 * EVT-01: Opportunity-window candidates require an existing qualified trajectory opportunity
 * AND an activating period. Dasha cannot manufacture an opportunity.
 *
 * EVT-02: Periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL effect/direction produce NO event.
 * Missing evidence is not negative evidence.
 *
 * EVT-03: Use source dates as-is; never infer/interpolate/extend. Missing/partial dates → UNTIMED.
 * Malformed or start>end dates → throw.
 */

/**
 * Restricted event type vocabulary.
 *
 * Only these event types are emitted — no outcome-asserting names like PROMOTION/JOB_LOSS/SALARY_INCREASE.
 */
export type CareerEventType =
  | 'CAREER_OPPORTUNITY_WINDOW'
  | 'CAREER_CHALLENGE_WINDOW'
  | 'CAREER_CONDITIONAL_WINDOW';

/**
 * Event status.
 *
 * All events are CANDIDATE in this implementation — this layer produces candidates, not finalized predictions.
 */
export type CareerEventStatus = 'CANDIDATE';

/**
 * Timing window type for an event.
 */
export type CareerEventTimingType =
  | 'DASHA_PERIOD_WINDOW'
  | 'UNTIMED';

/**
 * Timing window with source-backed dates.
 *
 * When timing is available from Dasha periods, the dates are preserved verbatim from the source.
 * When dates are missing or invalid, the event is UNTIMED.
 */
export interface CareerEventTiming {
  readonly type: CareerEventTimingType;

  /**
   * Start date from source (ISO format or YYYY-MM-DD).
   * Present only for DASHA_PERIOD_WINDOW.
   */
  readonly start?: string;

  /**
   * End date from source (ISO format or YYYY-MM-DD).
   * Present only for DASHA_PERIOD_WINDOW.
   */
  readonly end?: string;
}

/**
 * Career event candidate.
 *
 * Represents a potential career event with evidence traceability and timing information.
 * Events are deterministic and derived from trajectory opportunities and Dasha activations.
 */
export interface CareerEvent {
  /**
   * Stable event ID derived from domain inputs (no UUID/timestamp).
   * Format: 'CAREER_EVENT:{eventType}:{sourceKey}'
   */
  readonly eventId: string;

  /**
   * Event type from restricted vocabulary.
   */
  readonly eventType: CareerEventType;

  /**
   * Event status (always CANDIDATE).
   */
  readonly status: CareerEventStatus;

  /**
   * Timing window information.
   */
  readonly timing: CareerEventTiming;

  /**
   * Evidence IDs supporting this event.
   * These are semantic identity IDs (Dasha evidence identityKey and trajectory opportunity evidenceIds).
   * Never mixed with occurrence IDs, source IDs, rule IDs, or event IDs.
   */
  readonly evidenceIds: readonly string[];

  /**
   * Rule IDs that generated this event.
   * Stable identifiers (e.g., 'P2-09B-EVT-01', 'P2-09B-EVT-02', 'P2-09B-EVT-03').
   * Kept separate from evidenceIds for clear provenance.
   */
  readonly ruleIds: readonly string[];

  /**
   * Human-readable statement.
   */
  readonly statement: string;
}

/**
 * Career events analysis result.
 *
 * Output contract for the P2-09B Career Events & Timing layer.
 */
export interface CareerEventsAnalysis {
  readonly reasoningVersion: 'P2-09B';

  readonly domain: 'CAREER';

  /**
   * Whether dated forecast events are available.
   * False in this implementation (all events are UNTIMED or use Dasha period windows).
   */
  readonly guaranteedEventsAvailable: false;

  /**
   * Career event candidates.
   * Sorted by eventId with deterministic code-point comparison.
   */
  readonly events: readonly CareerEvent[];

  /**
   * All evidence IDs referenced by events (deduplicated and sorted).
   */
  readonly evidenceIds: readonly string[];

  /**
   * Human-readable summary statement.
   */
  readonly statement: string;
}

/**
 * Input contract for career events analysis.
 *
 * Consumes P2-09A trajectory analysis and C9 Dasha canonical analysis.
 */
export interface CareerEventsInput {
  /**
   * P2-09A Career trajectory analysis.
   */
  readonly trajectory: CareerTrajectoryAnalysis;

  /**
   * C9 Career Dasha canonical analysis.
   */
  readonly dasha: CareerDashaCanonicalAnalysis;
}
