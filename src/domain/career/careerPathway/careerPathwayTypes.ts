import type {
  CareerOutcomeAnalysis,
  CareerOutcomeCandidate,
  CareerOutcomeCandidateQualification
} from '../careerOutcomeQualification/careerOutcomeTypes';

export type CareerPathwayMode = 'EMPLOYMENT_SERVICE' | 'INDEPENDENT_BUSINESS';
export type CareerPathwayModeStatus =
  | 'SUPPORTED_CANDIDATE'
  | 'CONDITIONAL_CANDIDATE'
  | 'NOT_IDENTIFIED';
export type CareerPathwayVerdict =
  | 'DUAL_POTENTIAL'
  | 'CONDITIONAL_DUAL_POTENTIAL'
  | 'EMPLOYMENT_POTENTIAL_IDENTIFIED'
  | 'INDEPENDENT_POTENTIAL_IDENTIFIED'
  | 'NO_MODE_CANDIDATE'
  | 'UNRESOLVED'
  | 'INSUFFICIENT_DATA';

export interface CareerPathwayCandidateReference {
  readonly candidateId: string;
  readonly qualification: CareerOutcomeCandidateQualification;
  readonly sourceEventId: string;
  readonly opportunityId: string;
  readonly activationId: string;
  readonly timing: CareerOutcomeCandidate['timing'];
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly counterIndicationSeverity: CareerOutcomeCandidate['counterIndications']['severity'];
}

export interface CareerPathwayModeAssessment {
  readonly mode: CareerPathwayMode;
  readonly status: CareerPathwayModeStatus;
  readonly candidates: readonly CareerPathwayCandidateReference[];
  readonly candidateCount: number;
  readonly supportedCandidateCount: number;
  readonly conditionalCandidateCount: number;
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly practicalExecution: 'NOT_ASSESSED';
  readonly financialReadiness: 'NOT_ASSESSED';
  readonly personalPreference: 'NOT_ASSESSED';
}

export interface CareerPathwayAnalysis {
  readonly reasoningVersion: 'B05';
  readonly methodVersion: 'B05-DUAL-POTENTIAL-v1';
  readonly sourceReasoningVersion: 'B02';
  readonly sourceMethodVersion: string;
  readonly status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'UNRESOLVED' | 'INSUFFICIENT_DATA';
  readonly verdict: CareerPathwayVerdict;
  readonly employment: CareerPathwayModeAssessment;
  readonly independent: CareerPathwayModeAssessment;
  readonly otherCareerCandidateCount: number;
  readonly confidence: {
    readonly status: 'NOT_ASSESSED';
    readonly reason: string;
  };
  readonly guaranteedOutcomeAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly suitabilityAvailable: false;
  readonly diagnostics: readonly string[];
  readonly statement: string;
  readonly limitations: readonly string[];
}

export interface CareerPathwayAnalysisInput {
  readonly outcomeAnalysis?: CareerOutcomeAnalysis;
}
