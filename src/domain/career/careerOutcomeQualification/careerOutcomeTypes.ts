import type { CareerAnalyticalAxes } from '../careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerFinalSynthesisResult } from '../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerEventsAnalysis, CareerEventTiming } from '../careerEvents/careerEventTypes';
import type { CareerTrajectoryAnalysis } from '../careerTrajectory/careerTrajectoryTypes';
import type { CareerProfessionAnalysis } from '../careerProfession/careerProfessionTypes';
import type { CareerDashaCanonicalAnalysis } from '../careerDasha/careerDashaCanonicalTypes';

/**
 * B02 outcome vocabulary is deliberately broad and mode-aligned.
 * It describes the career domain of a candidate window, not a guaranteed event
 * such as promotion, job change, compensation increase, or business success.
 */
export type CareerOutcomeCandidateType =
  | 'CAREER_GROWTH_OR_EXPANSION'
  | 'ROLE_OR_AUTHORITY_EXPANSION'
  | 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'
  | 'TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT'
  | 'INDEPENDENT_OR_BUSINESS_ACTIVITY'
  | 'PUBLIC_OR_INSTITUTIONAL_CAREER'
  | 'GENERAL_CAREER_OPPORTUNITY';

/**
 * Concrete outcomes are represented only as explicitly supplied user-reported facts.
 * These values are never inferred from natal, Dasha, D10, trajectory, or event candidates.
 */
export type CareerObservedOutcomeType =
  | 'PROMOTION'
  | 'JOB_CHANGE'
  | 'ROLE_CHANGE'
  | 'LEADERSHIP_APPOINTMENT'
  | 'COMPENSATION_CHANGE'
  | 'BUSINESS_LAUNCH'
  | 'BUSINESS_EXPANSION'
  | 'RECOGNITION'
  | 'LAYOFF_OR_JOB_LOSS'
  | 'CAREER_BREAK'
  | 'OTHER';

export interface CareerObservedOutcomeInput {
  /** Stable identifier supplied by the caller; never generated from a chart. */
  readonly reportId: string;
  readonly outcomeType: CareerObservedOutcomeType;
  readonly statement: string;
  readonly source: 'USER_REPORTED';
  /** Date supplied by the user. Omit when the exact date is not known. */
  readonly occurredAt?: string;
  /** Optional date/time when the fact was entered or reported. */
  readonly reportedAt?: string;
  /** Optional user-supplied reference, kept verbatim. */
  readonly sourceReference?: string;
}

export type CareerOutcomeAnalysisStatus =
  | 'CANDIDATES_AVAILABLE'
  | 'CONDITIONAL'
  | 'PARTIAL'
  | 'UNRESOLVED'
  | 'INSUFFICIENT';

export type CareerOutcomeCandidateQualification =
  | 'SUPPORTED_CANDIDATE'
  | 'CONDITIONALLY_SUPPORTED_CANDIDATE';

export interface CareerOutcomeCounterIndication {
  readonly source: 'NATAL' | 'EXPRESSION' | 'D10' | 'DASHA' | 'TRANSIT';
  readonly direction: 'CHALLENGE' | 'MIXED';
  readonly severity: 'LOW' | 'MODERATE' | 'HIGH';
  /** C11 semantic identity references. */
  readonly evidenceIdentityIds: readonly string[];
}

export interface CareerOutcomeExecutionConditions {
  readonly professionAnalysisStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'NOT_PROVIDED';
  readonly d10Qualification: 'QUALIFIED' | 'PARTIAL' | 'UNAVAILABLE';
  /** Practical execution is not derivable from a horoscope. */
  readonly practicalExecution: 'NOT_ASSESSED';
  readonly requiredChecks: readonly [
    'SKILLS_AND_EXPERIENCE_FIT',
    'REAL_WORLD_OPPORTUNITY',
    'USER_ACTION_AND_EXECUTION',
    'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'
  ];
}

export interface CareerOutcomeCandidate {
  readonly candidateId: string;
  readonly outcomeType: CareerOutcomeCandidateType;
  /** Candidate only; never an observed or guaranteed outcome. */
  readonly status: 'CANDIDATE';
  readonly qualification: CareerOutcomeCandidateQualification;
  readonly qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION';
  readonly sourceEventId: string;
  readonly opportunityId: string;
  readonly activationId: string;
  readonly timing: CareerEventTiming;
  readonly supportingEvidence: {
    readonly natalPromiseOccurrenceIds: readonly string[];
    readonly activationOccurrenceIds: readonly string[];
    /** P2-09B semantic evidence identities, not occurrence IDs. */
    readonly candidateEventEvidenceIds: readonly string[];
    readonly ruleIds: readonly string[];
  };
  readonly executionConditions: CareerOutcomeExecutionConditions;
  readonly counterIndications: {
    readonly severity: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
    readonly evidenceOccurrenceIds: readonly string[];
    readonly conflicts: readonly CareerOutcomeCounterIndication[];
  };
  readonly guarantee: 'NONE';
}

export interface CareerObservedOutcomeRecord extends CareerObservedOutcomeInput {}

export interface CareerOutcomeAnalysis {
  readonly reasoningVersion: 'B02';
  readonly methodVersion: 'B02-OUTCOME-QUALIFICATION-v1';
  readonly status: CareerOutcomeAnalysisStatus;
  readonly candidateOutcomes: readonly CareerOutcomeCandidate[];
  /** Kept separate from candidateOutcomes; copied only from explicit caller input. */
  readonly observedOutcomes: readonly CareerObservedOutcomeRecord[];
  readonly diagnostics: readonly string[];
  readonly guaranteedOutcomeAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly statement: string;
}

export interface CareerOutcomeAnalysisInput {
  readonly axes: CareerAnalyticalAxes;
  readonly finalSynthesis: CareerFinalSynthesisResult;
  readonly trajectory: CareerTrajectoryAnalysis;
  readonly events: CareerEventsAnalysis;
  /** Canonical C9 records resolve each P2-09B activation identity to its occurrence ID. */
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly profession?: CareerProfessionAnalysis;
  /** Facts explicitly supplied by a user or trusted caller; never derived from chart data. */
  readonly observedOutcomes?: readonly CareerObservedOutcomeInput[];
}
