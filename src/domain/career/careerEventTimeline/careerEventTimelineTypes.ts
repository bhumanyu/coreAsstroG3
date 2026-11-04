import type { CareerAnalyticalAxes } from '../careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerFinalSynthesisResult } from '../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerEventsAnalysis, CareerEvent, CareerEventTiming } from '../careerEvents/careerEventTypes';
import type { CareerTrajectoryAnalysis } from '../careerTrajectory/careerTrajectoryTypes';
import type { CareerDashaCanonicalAnalysis } from '../careerDasha/careerDashaCanonicalTypes';
import type { CareerOutcomeAnalysis } from '../careerOutcomeQualification/careerOutcomeTypes';

export const CAREER_EVENT_TIMELINE_VERSION = 'B06-EVENT-SPECIFIC-TIMELINE-v1' as const;

export type CareerEventSpecificType =
  | 'CAREER_ENTRY_START'
  | 'JOB_CHANGE_TRANSITION'
  | 'PROMOTION_ROLE_EXPANSION'
  | 'LEADERSHIP_RESPONSIBILITY'
  | 'ENTREPRENEURSHIP_BUSINESS_INITIATION'
  | 'FOREIGN_REMOTE_OPPORTUNITY'
  | 'CHALLENGE_INTERRUPTION'
  | 'RECOVERY_REENTRY'
  | 'PEAK_CONSOLIDATION'
  | 'RETIREMENT_TRANSITION';

export type CareerEventEvidenceRequirement =
  | 'D1_NATAL_PROMISE'
  | 'EVENT_SPECIFIC_D1_EXPRESSION'
  | 'EVENT_SPECIFIC_RULE_PROVENANCE'
  | 'LINKED_C9_SUPPORT_ACTIVATION'
  | 'LINKED_C9_CHALLENGE_ACTIVATION'
  | 'C11_NATAL_COUNTER_INDICATION'
  | 'D10_SAME_EXPRESSION_QUALIFICATION'
  | 'PRIOR_CHALLENGE_WINDOW'
  | 'SUBSEQUENT_SUPPORT_ACTIVATION'
  | 'VALIDATED_SUSTAINABILITY_EVIDENCE'
  | 'USER_CONFIRMED_ACTIVE_CAREER_CONTEXT'
  | 'SOURCE_DATED_TEMPORAL_ORDER';

export interface CareerEventSpecificRuleContract {
  readonly eventType: CareerEventSpecificType;
  readonly validationStatus: 'UNVALIDATED';
  readonly requiredEvidence: readonly CareerEventEvidenceRequirement[];
  readonly validationGap: string;
  readonly releaseEnabled: false;
}

export type CareerEventTimelineStatus = 'GENERIC_WINDOWS_ONLY' | 'PARTIAL' | 'UNAVAILABLE';

export interface CareerEventTimelineWindow {
  readonly windowId: string;
  readonly sourceEventId: string;
  readonly genericType: CareerEvent['eventType'];
  readonly status: 'GENERIC_CANDIDATE_WINDOW';
  readonly specificEventInference: 'NOT_MADE';
  readonly timing: CareerEventTiming;
  readonly opportunityId: string | null;
  readonly activationId: string;
  readonly qualificationBasis:
    | 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION'
    | 'B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION';
  readonly evidence: {
    /** Semantic identity keys, kept separate from occurrence IDs. */
    readonly semanticIdentityIds: readonly string[];
    /** Source occurrence IDs from B01/B02/C9. */
    readonly occurrenceIds: readonly string[];
    readonly rootIdentityKeys: readonly string[];
    readonly ruleIds: readonly string[];
  };
  readonly limitations: readonly string[];
}

export interface CareerEventSpecificCandidate {
  readonly candidateId: string;
  readonly eventType: CareerEventSpecificType;
  readonly status: 'CANDIDATE';
  readonly sourceWindowId: string;
  readonly timing: CareerEventTiming;
  readonly evidenceOccurrenceIds: readonly string[];
  readonly semanticIdentityIds: readonly string[];
  readonly rootIdentityKeys: readonly string[];
  readonly ruleIds: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly limitations: readonly string[];
  readonly guarantee: 'NONE';
  readonly numericProbabilityAvailable: false;
}

export interface CareerEventTimelineAnalysis {
  readonly reasoningVersion: 'B06';
  readonly methodVersion: typeof CAREER_EVENT_TIMELINE_VERSION;
  readonly status: CareerEventTimelineStatus;
  /** Registry is descriptive; no event type is release-enabled until individually validated. */
  readonly taxonomy: readonly CareerEventSpecificRuleContract[];
  /** Empty until an event-specific evidence contract has passed validation. */
  readonly eventCandidates: readonly CareerEventSpecificCandidate[];
  /** Existing generic P2-09B windows retained only with B01/B02 natal-linked qualification. */
  readonly genericWindows: readonly CareerEventTimelineWindow[];
  /** References to explicit B02 USER_REPORTED facts; no chart-generated facts enter this list. */
  readonly observedOutcomeReportIds: readonly string[];
  readonly diagnostics: readonly string[];
  readonly guaranteedEventsAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly statement: string;
}

export interface CareerEventTimelineInput {
  readonly axes: CareerAnalyticalAxes;
  readonly finalSynthesis: CareerFinalSynthesisResult;
  readonly trajectory: CareerTrajectoryAnalysis;
  readonly events: CareerEventsAnalysis;
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly outcomeAnalysis: CareerOutcomeAnalysis;
}
