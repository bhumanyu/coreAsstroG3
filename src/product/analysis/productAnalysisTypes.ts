/**
 * Canonical ProductAnalysis Aggregate Types (P-UI-02)
 *
 * Strict projection layer over computational engines.
 * NO engine objects (Horoscope, DomainInterpretation, DashaInterpretation)
 * are placed directly on ProductAnalysis.
 */

import type { ProductMethodology } from '../../core/analysis/AnalysisContext';
import type {
  CareerFinalConfidence,
  CareerFinalDirection,
  CareerFinalStatus,
  CareerFinalStrength,
  CareerFinalTimingStatus
} from '../../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  SynthesisAxisStatus
} from '../../domain/careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import type { WealthDimension } from '../../domain/wealth/wealthTypes';
import type {
  CareerDashaActivationDiagnosticCode,
  CareerDashaExpressionAnalysisStatus
} from '../../domain/career/careerDasha/careerDashaActivationTypes';
import type { CareerProfessionAnalysis } from '../../domain/career/careerProfession/careerProfessionTypes';
import type { CareerPatternClassification } from '../../domain/career/careerPattern/careerPatternTypes';
import type {
  CareerPatternDeferredDimension,
  CareerPatternParticipantQualification,
  CareerPatternQualificationDimensions,
  CareerPatternQualificationStatus,
  DecisionBlockingReason
} from '../../domain/career/careerPatternQualification/careerPatternQualificationTypes';
import type { CareerPlanetaryConditionResult } from '../../domain/career/careerPlanetaryCondition';

export type ProductStatus = 'READY' | 'PARTIAL' | 'ERROR';
export type ProductAnalysisStatus = ProductStatus;

export type ProductConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE';

/**
 * Temporal relation of a period relative to analysis.asOf.
 * Computed using interval semantics: before start → FUTURE, [start,end) → CURRENT, ≥ end → PAST.
 * UNKNOWN indicates invalid/unparseable date strings.
 */
export type ProductTemporalRelation = 'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN';

export type ProductAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'CONDITIONAL' | 'PARTIAL';

export type ProductDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' | 'UNAVAILABLE';

export type ProductEvidenceRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MODIFIER'
  | 'REFINEMENT'
  | 'CONFLICTING'
  | 'NEUTRAL';

export interface ProductWarning {
  readonly code: string;
  readonly message: string;
  readonly severity?: 'INFO' | 'WARNING' | 'ERROR';
  readonly domain?: string;
}

export interface ProductBirth {
  readonly name?: string;
  readonly placeOfBirth?: string;
  /** Source: dateTimeStr from BirthDetails */
  readonly dateTime: string;
  /** Source: timeZone from BirthDetails */
  readonly timezone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ayanamsa: string;
}

export type { ProductMethodology };

export type PromiseStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNAVAILABLE';

export type ConclusionStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED'
  | 'UNAVAILABLE';

export type ActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'DOES_NOT_ACTIVATE'
  | 'CHALLENGES'
  | 'STRONGLY_SUPPORTS'
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';

export type TransitEffect =
  | 'TRIGGER'
  | 'MODIFIER'
  | 'CHALLENGE'
  | 'NO_MATERIAL_TRIGGER'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';

export interface ProductChartSummary {
  readonly ascendantSign?: string;
  readonly ascendantDegree?: number;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly isAvailable?: boolean;
}

export interface ProductEvidence {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly source: string;
  readonly sourceType?: string;
  readonly phase?: string;
  readonly dimension?: string;
  readonly house?: number;
  readonly houses?: readonly number[];
  readonly planet?: string;
  readonly ruleId?: string;
  readonly derivedFromIds?: readonly string[];
}

export interface CareerPromiseProduct {
  readonly status?: ConclusionStatus | string;
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
  readonly dominantManifestations?: readonly string[];
}

export interface CareerExpressionProduct {
  readonly analysisStatus?: 'EXECUTED' | 'ABSENT';
  readonly primaryStyle?: string;
  readonly leadershipPotential?: string;
  readonly secondaryTraits?: readonly string[];
  readonly coverageSummary?: ProductCareerExpressionCoverageSummary;
  readonly candidates?: readonly {
    readonly expressionId: string;
    readonly expressionType: string;
    readonly qualificationStatus: 'QUALIFIED' | 'CANDIDATE' | 'UNRESOLVED' | 'NOT_APPLICABLE';
  }[];
}

export interface ProductCareerExpressionCoverageSummary {
  readonly mechanismCandidateCount: number;
  readonly patternCandidateCount?: number;
  readonly patternCandidateRecordCount?: number;
  readonly distinctCandidateIdCount?: number;
  readonly conflictedCandidateCount?: number;
  readonly conflictedQualificationCount?: number;
  readonly qualificationResultMissingCount?: number;
  readonly qualifiedPatternCount?: number;
  readonly eligiblePatternCount?: number;
  readonly invalidRolePatternCount?: number;
  readonly roleAssignmentSkippedPatternCount?: number;
  readonly resolvedMechanismCount?: number;
  readonly networkResolutionStatus?: 'RESOLVED' | 'MISSING' | 'INCOMPLETE' | 'NOT_REQUIRED';
  readonly expressionCount: number;
  readonly expressionsWithEvidenceCount: number;
  readonly evidenceCount: number;
  readonly evidenceWithPlanetAttributionCount: number;
}

export interface ProductCareerOrchestrationQuarantineRecord {
  readonly patternId: string;
  readonly stage: 'PATTERN' | 'QUALIFICATION';
  readonly reason: 'CONFLICTING_CANDIDATE_PAYLOAD' | 'CONFLICTING_QUALIFICATION_VERDICTS';
  readonly rejectedRecordCount: number;
  readonly differingFields: readonly string[];
  readonly relatedIds: readonly string[];
}

export interface D10ProductResult {
  /**
   * Dasamsa relationship semantics per spec §29:
   * NEVER represented as a strength percentage.
   */
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE';
  readonly statement?: string;
}

/**
 * Per-level counts of canonical C9 dasha evidence items by direction.
 * Display-only tally of evidence counts — NOT weighted scores. The period
 * verdict (effect/direction) remains predicate-driven and authoritative;
 * these counts may legitimately diverge from it. A tally is present only
 * when at least one directional evidence record (SUPPORT, CHALLENGE, or
 * NEUTRAL) exists; MIXED/UNAVAILABLE-only evidence is not a tally.
 */
export interface DashaEvidenceTally {
  readonly supportingCount: number;
  readonly challengingCount: number;
  readonly neutralCount: number;
}

export interface ProductDashaPeriod {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly role: ProductEvidenceRole;
  readonly direction: ProductDirection;
  readonly effect: ActivationEffect | string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
  readonly conditionAssessment?: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
  readonly afflictionAssessed?: boolean;
  readonly expressionAnalysisStatus?: CareerDashaExpressionAnalysisStatus;
  readonly diagnostics?: readonly CareerDashaActivationDiagnosticCode[];
  readonly evidenceTally?: DashaEvidenceTally;
}

/**
 * Selectable antardasha option for period selection UI.
 * Nested within ProductSelectableMahadasha.
 */
export interface ProductSelectableAntardasha {
  readonly id: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly string[];
  readonly temporalRelation: ProductTemporalRelation;
}

/**
 * Selectable mahadasha option for period selection UI.
 * Contains nested antardashas.
 */
export interface ProductSelectableMahadasha {
  readonly id: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly string[];
  readonly temporalRelation: ProductTemporalRelation;
  readonly antardashas: readonly ProductSelectableAntardasha[];
}

/**
 * Dash period options for period selection UI.
 * Projected from listSelectableMdAdPeriods(report) with temporalRelation computed.
 */
export interface ProductDashaPeriodOptions {
  readonly mahadashas: readonly ProductSelectableMahadasha[];
  readonly diagnostics: readonly string[];
}

export interface TransitProductResult {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface CareerActivationProduct {
  readonly dasha: {
    readonly status: ProductAvailability;
    readonly periods: readonly ProductDashaPeriod[];
    readonly currentActivation?: string;
    readonly currentPressure?: string;
  };
  readonly transit: TransitProductResult;
}

export type ProductCareerAxisStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'INSUFFICIENT'
  | 'BLOCKED'
  | 'NOT_APPLICABLE';

export interface ProductCareerAxisCoverage {
  readonly status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  readonly availableSources: readonly string[];
  readonly missingSources: readonly string[];
  readonly evidenceOccurrenceCount: number;
}

export interface ProductCareerAxisConfidence {
  readonly status: 'NOT_ASSESSED';
  readonly reason: string;
}

export interface ProductCareerAnalyticalAxis<TResult> {
  readonly axis: 'PROMISE' | 'ACTIVATION' | 'SUSTAINABILITY' | 'RISK' | 'TIMING';
  readonly status: ProductCareerAxisStatus;
  readonly result: TResult | null;
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly conflictingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly coverage: ProductCareerAxisCoverage;
  readonly confidence: ProductCareerAxisConfidence;
  readonly methodVersion: string;
  readonly unavailableReason?: string;
  readonly diagnostic?: string;
  readonly diagnostics?: readonly string[];
}

export interface ProductCareerTimingCandidateWindow {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly start?: string;
  readonly end?: string;
  readonly dated: boolean;
  readonly effect: string;
  readonly direction: string;
  readonly strength: string;
  readonly activatedPromiseEvidenceIds: readonly string[];
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

export interface ProductCareerNonActivationOccurrence {
  readonly occurrenceId: string;
  readonly planet?: string;
  readonly level: 'MD' | 'AD' | 'PD';
}

export interface ProductCareerAnalyticalAxes {
  readonly version: string;
  readonly promise: ProductCareerAnalyticalAxis<{
    readonly direction: string;
    readonly strength: string;
  }>;
  readonly activation: ProductCareerAnalyticalAxis<{
    readonly direction: string;
    readonly effect: string;
    readonly strength: string;
    readonly dominantLevel: 'MD' | 'AD' | 'PD' | 'NONE';
    readonly conditionAssessment?: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
  }>;
  readonly sustainability: ProductCareerAnalyticalAxis<{
    readonly assessment: 'NOT_ASSESSED';
    readonly requiredEvidenceFamily: 'CAREER_SUSTAINABILITY';
  }>;
  readonly risk: ProductCareerAnalyticalAxis<{
    readonly assessment: 'ADVERSE_EVIDENCE_PRESENT' | 'NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES';
    readonly conflictCount: number;
    readonly nonActivationOccurrences: readonly ProductCareerNonActivationOccurrence[];
  }>;
  readonly timing: ProductCareerAnalyticalAxis<{
    readonly candidateWindows: readonly ProductCareerTimingCandidateWindow[];
    readonly untimedLevels: readonly ('MD' | 'AD' | 'PD')[];
    readonly guarantee: 'NONE';
  }>;
}

export type ProductCareerOutcomeStatus =
  | 'CANDIDATES_AVAILABLE'
  | 'CONDITIONAL'
  | 'PARTIAL'
  | 'UNRESOLVED'
  | 'INSUFFICIENT';

export interface ProductCareerObservedOutcome {
  readonly reportId: string;
  readonly outcomeType:
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
  readonly statement: string;
  readonly source: 'USER_REPORTED';
  readonly occurredAt?: string;
  readonly reportedAt?: string;
  readonly sourceReference?: string;
}

export interface ProductCareerOutcomeCandidate {
  readonly candidateId: string;
  readonly outcomeType:
    | 'CAREER_GROWTH_OR_EXPANSION'
    | 'ROLE_OR_AUTHORITY_EXPANSION'
    | 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'
    | 'TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT'
    | 'INDEPENDENT_OR_BUSINESS_ACTIVITY'
    | 'PUBLIC_OR_INSTITUTIONAL_CAREER'
    | 'GENERAL_CAREER_OPPORTUNITY';
  readonly status: 'CANDIDATE';
  readonly qualification: 'SUPPORTED_CANDIDATE' | 'CONDITIONALLY_SUPPORTED_CANDIDATE';
  readonly qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION';
  readonly sourceEventId: string;
  readonly opportunityId: string;
  readonly activationId: string;
  readonly timing: { readonly type: 'DASHA_PERIOD_WINDOW' | 'UNTIMED'; readonly start?: string; readonly end?: string };
  readonly supportingEvidence: {
    readonly natalPromiseOccurrenceIds: readonly string[];
    readonly activationOccurrenceIds: readonly string[];
    readonly candidateEventEvidenceIds: readonly string[];
    readonly ruleIds: readonly string[];
  };
  readonly executionConditions: {
    readonly professionAnalysisStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'NOT_PROVIDED';
    readonly d10Qualification: 'QUALIFIED' | 'PARTIAL' | 'UNAVAILABLE';
    readonly practicalExecution: 'NOT_ASSESSED';
    readonly requiredChecks: readonly string[];
  };
  readonly counterIndications: {
    readonly severity: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
    readonly evidenceOccurrenceIds: readonly string[];
    readonly conflicts: readonly {
      readonly source: 'NATAL' | 'EXPRESSION' | 'D10' | 'DASHA' | 'TRANSIT';
      readonly direction: 'CHALLENGE' | 'MIXED';
      readonly severity: 'LOW' | 'MODERATE' | 'HIGH';
      readonly evidenceIdentityIds: readonly string[];
    }[];
  };
  readonly guarantee: 'NONE';
}

export interface ProductCareerOutcomeAnalysis {
  readonly reasoningVersion: 'B02';
  readonly methodVersion: string;
  readonly status: ProductCareerOutcomeStatus;
  readonly candidateOutcomes: readonly ProductCareerOutcomeCandidate[];
  readonly observedOutcomes: readonly ProductCareerObservedOutcome[];
  readonly diagnostics: readonly string[];
  readonly guaranteedOutcomeAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly statement: string;
}

export type ProductCareerPathwayVerdict =
  | 'DUAL_POTENTIAL'
  | 'CONDITIONAL_DUAL_POTENTIAL'
  | 'EMPLOYMENT_POTENTIAL_IDENTIFIED'
  | 'INDEPENDENT_POTENTIAL_IDENTIFIED'
  | 'NO_MODE_CANDIDATE'
  | 'UNRESOLVED'
  | 'INSUFFICIENT_DATA';

export interface ProductCareerPathwayCandidate {
  readonly candidateId: string;
  readonly qualification: 'SUPPORTED_CANDIDATE' | 'CONDITIONALLY_SUPPORTED_CANDIDATE';
  readonly sourceEventId: string;
  readonly opportunityId: string;
  readonly activationId: string;
  readonly timing: { readonly type: 'DASHA_PERIOD_WINDOW' | 'UNTIMED'; readonly start?: string; readonly end?: string };
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly counterIndicationSeverity: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
}

export interface ProductCareerPathwayModeAssessment {
  readonly mode: 'EMPLOYMENT_SERVICE' | 'INDEPENDENT_BUSINESS';
  readonly status: 'SUPPORTED_CANDIDATE' | 'CONDITIONAL_CANDIDATE' | 'NOT_IDENTIFIED';
  readonly candidates: readonly ProductCareerPathwayCandidate[];
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

export interface ProductCareerPathwayAnalysis {
  readonly reasoningVersion: 'B05';
  readonly methodVersion: 'B05-DUAL-POTENTIAL-v1';
  readonly sourceReasoningVersion: 'B02';
  readonly sourceMethodVersion: string;
  readonly status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'UNRESOLVED' | 'INSUFFICIENT_DATA';
  readonly verdict: ProductCareerPathwayVerdict;
  readonly employment: ProductCareerPathwayModeAssessment;
  readonly independent: ProductCareerPathwayModeAssessment;
  readonly otherCareerCandidateCount?: number;
  readonly confidence: { readonly status: 'NOT_ASSESSED'; readonly reason: string };
  readonly guaranteedOutcomeAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly suitabilityAvailable: false;
  readonly diagnostics: readonly string[];
  readonly statement: string;
  readonly limitations: readonly string[];
}

export interface ProductCareerEventTimelineWindow {
  readonly windowId: string;
  readonly sourceEventId: string;
  readonly genericType: 'CAREER_OPPORTUNITY_WINDOW' | 'CAREER_CHALLENGE_WINDOW' | 'CAREER_CONDITIONAL_WINDOW';
  readonly status: 'GENERIC_CANDIDATE_WINDOW';
  readonly specificEventInference: 'NOT_MADE';
  readonly timing: { readonly type: 'DASHA_PERIOD_WINDOW' | 'UNTIMED'; readonly start?: string; readonly end?: string };
  readonly opportunityId: string | null;
  readonly activationId: string;
  readonly qualificationBasis: 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION' | 'B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION';
  readonly conditions: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly evidence: {
    readonly semanticIdentityIds: readonly string[];
    readonly occurrenceIds: readonly string[];
    readonly rootIdentityKeys: readonly string[];
    readonly ruleIds: readonly string[];
  };
  readonly limitations: readonly string[];
}

export interface ProductCareerEventSpecificTaxonomyItem {
  readonly eventType:
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
  readonly validationStatus: 'UNVALIDATED';
  readonly requiredEvidence: readonly string[];
  readonly validationGap: string;
  readonly releaseEnabled: false;
}

export interface ProductCareerEventSpecificCandidate {
  readonly candidateId: string;
  readonly eventType: ProductCareerEventSpecificTaxonomyItem['eventType'];
  readonly status: 'CANDIDATE';
  readonly sourceWindowId: string;
  readonly timing: { readonly type: 'DASHA_PERIOD_WINDOW' | 'UNTIMED'; readonly start?: string; readonly end?: string };
  readonly evidenceOccurrenceIds: readonly string[];
  readonly semanticIdentityIds: readonly string[];
  readonly rootIdentityKeys: readonly string[];
  readonly ruleIds: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly limitations: readonly string[];
  readonly guarantee: 'NONE';
  readonly numericProbabilityAvailable: false;
}

export interface ProductCareerEventTimeline {
  readonly reasoningVersion: 'B06';
  readonly methodVersion: string;
  readonly status: 'GENERIC_WINDOWS_ONLY' | 'PARTIAL' | 'UNAVAILABLE';
  readonly taxonomy: readonly ProductCareerEventSpecificTaxonomyItem[];
  readonly eventCandidates: readonly ProductCareerEventSpecificCandidate[];
  readonly genericWindows: readonly ProductCareerEventTimelineWindow[];
  readonly observedOutcomeReportIds: readonly string[];
  readonly diagnostics: readonly string[];
  readonly guaranteedEventsAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly statement: string;
}

export interface ProductQualification {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly description: string;
}

export type ProductCareerProfessionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

export interface ProductCareerProfessionScoreContribution {
  readonly referenceType: 'PROFESSION_RULE' | 'DOMAIN_EVIDENCE' | 'D10_QUALIFICATION';
  readonly referenceId: string;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly points: number;
  readonly explanation: string;
}

export interface ProductCareerProfessionRankedCandidate {
  readonly candidateId: string;
  readonly domain: string;
  readonly family: string;
  readonly rank: number;
  readonly score: number;
  readonly scoreContributions: readonly ProductCareerProfessionScoreContribution[];
  readonly confidence: ProductCareerProfessionConfidence;
  readonly confidenceReasons: readonly string[];
  readonly evidenceCoverage: {
    readonly status: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
    readonly occurrenceCount: number;
    readonly semanticIdentityCount: number;
    readonly rootIdentityCount: number;
    readonly linkedSourceCount: number;
  };
  readonly supportingCandidateIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly d10EvidenceOccurrenceIds: readonly string[];
  readonly d10Direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'UNDETERMINED';
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly semanticIdentityKeys: readonly string[];
  readonly rootIdentityKeys: readonly string[];
  readonly d10Status: 'QUALIFIED' | 'PARTIAL' | 'CONFLICTED' | 'NOT_PROVIDED' | 'UNAVAILABLE';
  readonly reasons: readonly string[];
  readonly counterEvidenceReasons: readonly string[];
  readonly alternativeExplanation: string;
}

export interface ProductCareerProfessionRanking {
  readonly policyVersion: 'B04-PROFESSION-RANKING-v1';
  readonly status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  readonly rankedCandidates: readonly ProductCareerProfessionRankedCandidate[];
  readonly diagnostics: readonly string[];
}

export interface ProductCareerPatternQualificationParticipant {
  readonly planet: CareerPatternParticipantQualification['planet'];
  readonly relevance: CareerPatternParticipantQualification['relevance'];
  readonly condition: CareerPatternParticipantQualification['condition'];
  readonly sourceCondition?: CareerPlanetaryConditionResult['condition'];
  readonly conditionAssessment?: CareerPlanetaryConditionResult['assessment'];
  readonly combustion?: CareerPlanetaryConditionResult['combustion'];
  readonly affliction?: CareerPlanetaryConditionResult['affliction'];
  readonly dignity?: CareerPlanetaryConditionResult['dignity'];
  readonly positiveFactorLabels: readonly CareerPlanetaryConditionResult['positiveFactors'][number]['type'][];
  readonly negativeFactorLabels: readonly CareerPlanetaryConditionResult['negativeFactors'][number]['type'][];
}

export interface ProductCareerPatternQualification {
  readonly patternId: string;
  readonly classification: CareerPatternClassification;
  readonly name: string;
  readonly status: CareerPatternQualificationStatus | 'DEFERRED';
  readonly explanation?: string;
  readonly dimensions?: Pick<CareerPatternQualificationDimensions, 'careerRelevance'>;
  readonly policyEvidence?: readonly {
    readonly sourceType: string;
    readonly dimension: string;
    readonly relationshipIds: readonly string[];
    readonly explanation: string;
    readonly disposition?: 'ADVERSE' | 'SUPPORTIVE';
  }[];
  readonly decisionBlockingReasons: readonly DecisionBlockingReason[];
  readonly deferredDimensions: readonly CareerPatternDeferredDimension[];
  readonly participants: readonly ProductCareerPatternQualificationParticipant[];
}

export interface CareerProductAnalysis {
  readonly status?: ConclusionStatus | string;
  /** B01: Independent, evidence-traceable analytical axes; not a parallel final score. */
  readonly analyticalAxes?: ProductCareerAnalyticalAxes;
  /** B02: Outcome candidates qualified by Promise + Activation; observed facts stay separate. */
  readonly outcomeQualification?: ProductCareerOutcomeAnalysis;
  /** B05: compares explicit B02 employment/service and independent/business candidates; not suitability. */
  readonly pathwayPotential?: ProductCareerPathwayAnalysis;
  /** B06: specific event taxonomy is gated; only qualified generic windows are projected. */
  readonly eventTimeline?: ProductCareerEventTimeline;
  /** C8 orchestration conflicts retained for audit and persistence. */
  readonly quarantineRecords?: readonly ProductCareerOrchestrationQuarantineRecord[];
  readonly promise: CareerPromiseProduct;
  readonly expression?: CareerExpressionProduct;
  readonly d10: D10ProductResult;
  readonly activation: CareerActivationProduct;
  readonly qualifications?: readonly ProductQualification[];
  readonly evidence: readonly ProductEvidence[];
  readonly synthesis?: {
    readonly headline?: string;
    /** Diagnostic-only engine prose; must never be rendered as user-facing copy. */
    readonly statement?: string;
    readonly canonicalTraceStatement?: string;
    readonly finalStatus?: CareerFinalStatus;
    readonly finalDirection?: CareerFinalDirection;
    readonly finalStrength?: CareerFinalStrength;
    readonly confidence?: CareerFinalConfidence;
    readonly natalDirection?: CareerFinalDirection;
    readonly natalStrength?: CareerFinalStrength;
    readonly dashaDirection?: CareerFinalDirection;
    readonly timingStatus?: CareerFinalTimingStatus;
  };
  readonly profession?: {
    readonly available: boolean;
    readonly status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
    readonly candidates: readonly {
      readonly candidateId: string;
      readonly domain: string;
      readonly family: string;
      readonly basis: string;
      readonly expressionTypes: readonly string[];
      readonly mechanismTypes: readonly string[];
      readonly patternIds: readonly string[];
      readonly d10Status: string;
      readonly evidenceOccurrenceIds: readonly string[];
      readonly semanticIdentityKeys: readonly string[];
      readonly rootIdentityKeys: readonly string[];
      readonly d10Qualification?: {
        readonly status: string;
        readonly direction: string;
        readonly effects: readonly string[];
        readonly evidenceOccurrenceIds: readonly string[];
        readonly counterEvidenceOccurrenceIds: readonly string[];
        readonly rootIdentityKeys: readonly string[];
      };
      readonly evidence: readonly {
        readonly evidenceId: string;
        readonly basis: string;
        readonly sourceIds: readonly string[];
        readonly ruleId: string;
        readonly statement: string;
        readonly linkage?: string;
        readonly resolvedMechanismIds?: readonly string[];
        readonly unresolvedMechanismIds?: readonly string[];
      }[];
      readonly domainEvidenceIds: readonly string[];
      readonly relatedEvidenceIds: readonly string[];
      readonly ruleId: string;
    }[];
    readonly unresolvedExpressionTypes: readonly string[];
    readonly mappedTypes: readonly string[];
    readonly missingInputs: readonly string[];
    readonly diagnostics?: readonly string[];
    readonly d10Status: string;
    readonly stageCounts?: CareerProfessionAnalysis['stageCounts'];
    readonly patternQualifications?: readonly ProductCareerPatternQualification[];
    readonly ranking: ProductCareerProfessionRanking;
  };
}

export interface WealthOverallProduct {
  readonly status: ConclusionStatus | string;
  readonly promise: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
}

export interface WealthDimensionsProduct {
  readonly accumulation: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly gains: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly fortune: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly speculation: { readonly status: ConclusionStatus | string; readonly statement?: string };
}

export interface D2ProductResult {
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE';
  readonly statement?: string;
}

export interface WealthActivationProduct {
  readonly dasha: {
    readonly status: ProductAvailability;
    readonly periods: readonly ProductDashaPeriod[];
    readonly statement?: string;
  };
  readonly transit: TransitProductResult;
}

export type AstrologicalSpeculativePropensity =
  | 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'MIXED' | 'CHALLENGED' | 'INSUFFICIENT_DATA';

export interface AstrologicalSpeculativePropensityProduct {
  readonly source: 'ASTROLOGICAL_INDICATION';
  readonly status: AstrologicalSpeculativePropensity;
  readonly description?: string;
  readonly evidenceIds: readonly string[];
  readonly adviceAvailable: false;
}

export interface WealthRiskAndSuitabilityProduct {
  readonly actualExposure: 'AVAILABLE' | 'UNAVAILABLE';
  readonly tradingHistory: 'AVAILABLE' | 'UNAVAILABLE';
  readonly suitability: 'UNAVAILABLE';
  readonly suitabilityReason: string;
}

import type { WealthFinancialDataSet } from '../../domain/wealth/wealthFinancialData';
import type { WealthLifecycleAnalysis } from '../../domain/wealth/wealthLifecycleTypes';

export interface WealthProductAnalysis {
  /** Optional for older persisted analyses; absence means real-world data is unavailable. */
  readonly financialData?: WealthFinancialDataSet;
  /** Optional C04 downstream candidate analysis. CW-05 remains final authority. */
  readonly lifecycle?: WealthLifecycleAnalysis;
  readonly overall: WealthOverallProduct;
  readonly dimensions: WealthDimensionsProduct;
  readonly d2: D2ProductResult;
  readonly activation: WealthActivationProduct;
  /** Optional for legacy persisted analyses; projection defaults to unavailable. */
  readonly speculativePropensity?: AstrologicalSpeculativePropensityProduct;
  /** Optional for legacy persisted analyses; never inferred from horoscope. */
  readonly riskAndSuitability?: WealthRiskAndSuitabilityProduct;
  readonly qualifications?: readonly ProductQualification[];
  readonly evidence: readonly ProductEvidence[];
  readonly synthesis?: {
    readonly headline?: string;
    /** Diagnostic-only engine prose; must never be rendered as user-facing copy. */
    readonly statement?: string;
    readonly overallStatus?: FinalDomainStatus;
    readonly dimensionStatuses?: Readonly<Partial<Record<WealthDimension, FinalDomainStatus>>>;
    readonly promiseStatus?: CareerWealthFinalSynthesis['promiseStatus'];
    readonly confidence?: CareerWealthFinalSynthesis['confidence'];
    readonly natalStrength?: NonNullable<CareerWealthFinalSynthesis['primaryStrength']>;
    readonly dashaDirection?: SynthesisAxisStatus;
    readonly timingStatus?: SynthesisAxisStatus;
  };
}

export interface ProductDashaState {
  readonly current: {
    readonly mahadasha?: ProductDashaPeriod;
    readonly antardasha?: ProductDashaPeriod;
    readonly pratyantardasha?: ProductDashaPeriod;
  };
  readonly asOf?: string;
  readonly summary?: string;
}

export interface ReasoningNode {
  readonly id: string;
  readonly label: string;
  readonly domain: string;
  readonly type: 'PROMISE' | 'VARGA' | 'ACTIVATION' | 'TRANSIT' | 'SYNTHESIS' | 'EVIDENCE';
  readonly direction: ProductDirection;
  readonly statement: string;
  readonly parentIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
}

export interface ReasoningProductAnalysis {
  readonly nodes: readonly ReasoningNode[];
  readonly primaryConclusions: readonly { readonly domain: string; readonly conclusion: string }[];
  readonly unresolvedQuestions?: readonly string[];
}

export interface AiProductState {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE' | 'GENERATING' | 'FAILED';
  readonly explanation?: string;
  readonly conclusion?: string;
  readonly providerInfo?: {
    readonly name?: string;
    readonly mode?: string;
  };
  readonly error?: string;
}

/**
 * Status for selected-period synthesis only.
 * Separate from ProductAnalysis.status - a failed selection must not mark a valid natal analysis as error.
 */
export type ProductSelectedPeriodStatus =
  | 'OK'
  | 'INVALID_SELECTION'
  | 'SYNTHESIS_FAILED'
  | 'UNAVAILABLE';

/**
 * Qualification status for the selected-period synthesis.
 * Distinguishes fully canonical results from partially/proxy-qualified results.
 *
 * Product contract (compatibility contract per Finding 5):
 * - CANONICAL: Career used canonical qualification mechanisms
 * - PROVISIONAL: Career used proxy direction
 * - UNAVAILABLE: Career canonical qualification could not be determined
 *
 * This is an additive field on the success value; it does not change the ok/error discriminant.
 */
export type ProductQualificationStatus = 'CANONICAL' | 'PROVISIONAL' | 'UNAVAILABLE';

/**
 * Evidence reference in the selected-period synthesis.
 * Classification is based on explicit source polarity/effect only.
 * Mixed evidence stays MIXED (maps to PARTIALLY_ACTIVATES in status).
 * For RULE references (referenceKind: 'RULE'), classification and polarity are omitted.
 *
 * Provenance tracking:
 * - stage: Distinguishes high-level domain (CAREER/WEALTH)
 * - provenanceStage: For CAREER, distinguishes source stage (EXPRESSION/QUALIFICATION/ACTIVATION)
 * - referenceKind: Distinguishes evidence-based vs rule-based references (EVIDENCE/RULE)
 */
export interface ProductSynthesisEvidenceReference {
  readonly classification?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED';
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly source?: string;
  readonly ruleId?: string;
  readonly level?: 'MD' | 'AD' | 'PD';
  readonly stage: 'CAREER' | 'WEALTH';
  readonly provenanceStage?: 'CAREER_EXPRESSION' | 'CAREER_QUALIFICATION' | 'CAREER_ACTIVATION' | 'WEALTH_NATAL_PROMISE' | 'WEALTH_DASHA_RULE';
  readonly referenceKind?: 'EVIDENCE' | 'RULE';
}

/**
 * Missing input diagnostic.
 */
export interface ProductSynthesisMissingInput {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly code: string;
  readonly description: string;
}

/**
 * Provenance tracking per analysis stage.
 */
export interface ProductSynthesisProvenance {
  readonly career: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
    readonly qualificationBasis?: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  };
  readonly wealth: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
  };
}

/**
 * Diagnostic attached to a synthesis row.
 */
export interface ProductSynthesisDiagnostic {
  readonly code: string;
  readonly message: string;
}

/**
 * Career expression row in the synthesis result.
 *
 * Status is derived from explicit C9 MD/AD activation effects across linkedLevels.
 * matchBasis is omitted if the PBA-04 row type lacks the field.
 *
 * Full PBA-04 traceability: all evidence ID collections are carried through verbatim.
 * Status is a C9 activation derivation conditioned on the row's qualification basis —
 * activation never creates natal promise.
 */
export interface ProductSynthesisCareerExpressionRow {
  readonly expressionRefKey: string;
  readonly status: ActivationEffect | string;
  readonly linkedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly matchBasis?: 'UNAMBIGUOUS' | 'AMBIGUOUS';
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
  readonly expressionEvidenceIds: readonly string[];
  readonly qualifiedEvidenceIds: readonly string[];
  readonly unqualifiedEvidenceIds: readonly string[];
  readonly mdDashaEvidenceIds: readonly string[];
  readonly adDashaEvidenceIds: readonly string[];
  readonly expressionSource: 'CALLER' | 'ADAPTER_FALLBACK';
}

/**
 * Career section in the synthesis result.
 */
export interface ProductSynthesisCareerSection {
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly expressions: readonly ProductSynthesisCareerExpressionRow[];
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
}

/**
 * Wealth dimension row in the synthesis result.
 *
 * Effect is preserved verbatim from PBA-05 dimension effect.
 * dataStatus describes input availability only, never a composite score.
 * promiseEvidenceIds and dashaRuleReferences are preserved verbatim from PBA-05 activation
 * for evidence parity with the AI context projection.
 * insufficientReason is preserved verbatim from PBA-05 activation for diagnostics (PBA-05).
 */
export interface ProductSynthesisWealthDimensionRow {
  readonly dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly effect: ActivationEffect | string;
  readonly dataStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly linkedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
  readonly promiseEvidenceIds: readonly string[];
  readonly dashaRuleReferences: readonly {
    readonly ruleId: string;
    readonly source: string;
    readonly level: 'MD' | 'AD' | 'PD';
  }[];
  readonly linkageTrace: readonly {
    readonly promiseEvidenceId: string;
    readonly dashaRuleReference: {
      readonly ruleId: string;
      readonly source: string;
      readonly level: 'MD' | 'AD' | 'PD';
    };
    readonly level: 'MD' | 'AD' | 'PD';
    readonly matchedHouse: number;
  }[];
  readonly insufficientReason:
    | 'NO_PROMISE_EVIDENCE'
    | 'PROMISE_NOT_LINKED'
    | 'LINKED'
    | 'ACTIVATION_UNAVAILABLE';
}

/**
 * Wealth section in the synthesis result.
 */
export interface ProductSynthesisWealthSection {
  readonly dimensions: Readonly<Record<'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION', ProductSynthesisWealthDimensionRow>>;
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
}

/**
 * Selected-period synthesis for ProductAnalysis.
 *
 * This is a pure projection of the PBA-06 synthesis result into the product DTO layer.
 * No recalculation, no AI-generated conclusions.
 */
export interface ProductSelectedPeriodSynthesis {
  readonly synthesisVersion: 'PBA-06-v1';
  readonly period: {
    readonly selectedPeriodId: string;
    readonly mahadashaId: string;
    readonly mahadashaPlanet: string;
    readonly antardashaId: string;
    readonly antardashaPlanet: string;
    readonly interval: { readonly start: string; readonly end: string };
    readonly analysisAsOf: string;
    readonly temporalRelation: 'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN';
  };
  readonly natalBaseline: {
    readonly career?: {
      readonly baseline: import('../../domain/career/careerTypes').CareerConclusionData;
      readonly unchanged: boolean;
    };
    readonly wealth?: {
      readonly baseline: import('../../domain/wealth/wealthTypes').WealthConclusionData;
      readonly unchanged: boolean;
    };
  };
  readonly career: ProductSynthesisCareerSection;
  readonly wealth: ProductSynthesisWealthSection;
  readonly evidence: readonly ProductSynthesisEvidenceReference[];
  readonly missingInputs: readonly ProductSynthesisMissingInput[];
  readonly provenance: ProductSynthesisProvenance;
  /**
   * Qualification status for the synthesis result.
   * Currently derived only from career.qualificationBasis; wealth has no equivalent
   * qualification-basis signal.
   * Allows users to distinguish canonical, proxy-qualified, and unavailable career results.
   */
  readonly qualificationStatus: ProductQualificationStatus;
  /**
   * AI explanation status for the selected period (PBA-09).
   * Explicitly surfaces whether AI explanation succeeded, failed, or was not requested.
   *
   * - 'OK': AI explanation succeeded and aiExplanation contains the result.
   * - 'ERROR': AI explanation failed and aiExplanation contains the error result.
   * - 'NOT_REQUESTED': AI explanation was not requested; aiExplanation is undefined.
   */
  readonly aiExplanationStatus: 'OK' | 'ERROR' | 'NOT_REQUESTED';
  /**
   * Optional AI explanation for the selected period (PBA-09).
   * When present, contains the AI explanation result.
   * AI failure does not affect the deterministic synthesis or status.
   */
  readonly aiExplanation?: import('../../ai/browser').AiExplanationResult;
}

/**
 * Selected-period result type for ProductAnalysis.
 * Discriminated union distinguishing successful synthesis from various failure modes.
 * A failed selection must not mark a valid natal analysis as error.
 */
export type ProductSelectedPeriodResult =
  | {
    readonly status: 'OK';
    readonly synthesis: ProductSelectedPeriodSynthesis;
  }
  | {
    readonly status: 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE';
    readonly error?: string;
  };

/**
 * Root Canonical ProductAnalysis Aggregate
 */
export type ProductConfidenceCoverageStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'INSUFFICIENT'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'NOT_APPLICABLE';

export type ProductConfidenceLayerState =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'NOT_APPLICABLE';

export interface ProductConfidenceDiagnostic {
  readonly code: string;
  readonly severity: 'INFO' | 'WARNING' | 'ERROR';
  readonly message: string;
  readonly evidenceIds?: readonly string[];
  readonly ruleIds?: readonly string[];
}

export interface ProductDomainConfidenceMetadata {
  /** Exact domain-owned confidence; D01 never recalculates it. */
  readonly confidence: ProductConfidence;
  readonly coverage: ProductConfidenceCoverageStatus;
  readonly layers: readonly {
    readonly id: string;
    readonly state: ProductConfidenceLayerState;
    readonly required: boolean;
    readonly reason?: string;
    readonly evidenceIds?: readonly string[];
  }[];
  readonly reasons: readonly string[];
  readonly diagnostics: readonly ProductConfidenceDiagnostic[];
  readonly evidenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  /** The domain engine that owns the confidence result. */
  readonly owner: 'C11' | 'CW-05';
  readonly metadataSource?: 'DOMAIN_CANONICAL' | 'LEGACY_PRODUCT_FALLBACK';
}

export interface ProductUnifiedConfidenceProjection {
  readonly version: 'D01-v1';
  readonly domains: Readonly<{
    readonly CAREER: ProductDomainConfidenceMetadata;
    readonly WEALTH: ProductDomainConfidenceMetadata;
  }>;
  readonly diagnostics: readonly (ProductConfidenceDiagnostic & { readonly domain: 'CAREER' | 'WEALTH' | 'PRODUCT' })[];
  readonly unavailableLayers: readonly {
    readonly domain: 'CAREER' | 'WEALTH';
    readonly layer: string;
    readonly reason: string;
  }[];
}



/**
 * D02 version provenance.
 *
 * A component is explicitly NOT_RECORDED when the active pipeline does not
 * expose an independently versioned identifier. This must never be filled
 * with a guessed/default value.
 */
export type ProductVersionRecordStatus = 'RECORDED' | 'NOT_RECORDED' | 'NOT_APPLICABLE';

export interface ProductVersionComponent {
  readonly status: ProductVersionRecordStatus;
  readonly version?: string;
  readonly reason?: string;
  readonly source?: string;
}

export interface ProductDeterministicVersionManifest {
  readonly manifestVersion: 'D02-v1';
  readonly calculationEngine: ProductVersionComponent;
  readonly referenceDatasets: Readonly<Record<string, ProductVersionComponent>>;
  readonly ruleCatalogue: ProductVersionComponent;
  readonly careerLogic: ProductVersionComponent;
  readonly wealthLogic: ProductVersionComponent;
  readonly careerSynthesis: ProductVersionComponent;
  readonly wealthSynthesis: ProductVersionComponent;
  readonly outputSchema: ProductVersionComponent;
  readonly methodology: Readonly<{
    readonly zodiacSystem: string;
    readonly houseSystem: string;
    readonly ayanamsa: string;
    readonly vargaRules: string;
    readonly dashaSystem: string;
  }>;
  /** Non-personal configuration identifiers only; never raw birth/user inputs. */
  readonly configuration: Readonly<Record<string, string | number | boolean | null>>;
  readonly inputRetention: 'RETAINED_BY_CALLER' | 'NOT_RETAINED' | 'UNKNOWN';
  /** Opaque external locator; the snapshot itself is retained outside this aggregate. */
  readonly retainedInputSnapshotRef?: string;
  readonly replay: ProductReplayAssessment;
}

export interface ProductReplayAssessment {
  readonly status: 'REPLAYABLE_WITH_RETAINED_INPUTS' | 'NOT_REPLAYABLE' | 'UNKNOWN';
  readonly requiredInputsRetained: boolean | null;
  readonly requiredCodeAvailable: boolean | null;
  readonly requiredDatasetsAvailable: boolean | null;
  readonly reasonCodes: readonly string[];
}

export interface ProductAiExplanationVersionManifest {
  readonly manifestVersion: 'D02-AI-v1';
  readonly providerId: ProductVersionComponent;
  readonly providerVersion: ProductVersionComponent;
  readonly model: ProductVersionComponent;
  readonly promptTemplate: ProductVersionComponent;
  readonly outputSchema: ProductVersionComponent;
  readonly routingMode: ProductVersionComponent;
  readonly generatedAt?: string;
  readonly task?: string;
}

export interface ProductAnalysisVersionManifest {
  readonly deterministic: ProductDeterministicVersionManifest;
  /** AI metadata belongs to each explanation execution, not to deterministic calculation identity. */
  readonly aiExplanations: readonly ProductAiExplanationVersionManifest[];
}


export type ProductDiagnosticPresentationState = 'INFO' | 'WARNING' | 'BLOCKED' | 'UNAVAILABLE' | 'CONFLICT';

export interface ProductEvidenceExperienceItem {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly sourceLabel: string;
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
  readonly resolvedRelatedEvidence: readonly { readonly id: string; readonly title: string }[];
  readonly unresolvedRelatedCount: number;
}

export interface ProductEvidenceExperienceViewModel {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly confidence: ProductConfidence;
  readonly confidenceLabel: string;
  readonly promiseStrengthLabel: string;
  readonly coverage: ProductConfidenceCoverageStatus;
  readonly coverageLabel: string;
  readonly owner: 'C11' | 'CW-05';
  readonly confidenceReasons: readonly string[];
  readonly layers: readonly {
    readonly id: string;
    readonly label: string;
    readonly state: ProductConfidenceLayerState;
    readonly stateLabel: string;
    readonly reason?: string;
    readonly required: boolean;
  }[];
  readonly diagnostics: readonly {
    readonly id: string;
    readonly state: ProductDiagnosticPresentationState;
    readonly title: string;
    readonly message: string;
    readonly technicalCode?: string;
  }[];
  readonly conflicts: readonly ProductEvidenceExperienceItem[];
  readonly evidence: readonly ProductEvidenceExperienceItem[];
  readonly missingEvidenceCount: number;
}

export interface ProductAnalysis {
  readonly analysisId: string;
  readonly asOf: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly status: ProductAnalysisStatus;
  readonly birth: ProductBirth;
  readonly methodology: ProductMethodology;
  /** Optional for old stored aggregates; absent means pre-D02/unmigrated, not inferred. */
  readonly versionManifest?: ProductAnalysisVersionManifest;
  readonly chart: ProductChartSummary;
  readonly career: CareerProductAnalysis;
  readonly wealth: WealthProductAnalysis;
  /** Optional source-owned metadata for D01; omitted on legacy persisted records. */
  readonly confidenceMetadata?: Readonly<{
    readonly career?: ProductDomainConfidenceMetadata;
    readonly wealth?: ProductDomainConfidenceMetadata;
  }>;
  readonly dasha: ProductDashaState;
  readonly reasoning: ReasoningProductAnalysis;
  readonly ai: AiProductState;
  readonly warnings: readonly ProductWarning[];
  /**
   * Optional dasha period options for period selection UI.
   * Projected from listSelectableMdAdPeriods(report) with temporalRelation computed.
   */
  readonly dashPeriodOptions?: ProductDashaPeriodOptions;
  /**
   * Optional selected-period synthesis result.
   * When present, contains either a successful synthesis or a typed failure.
   * Absence does NOT indicate an error - it means no selection was requested.
   * Natal status is never downgraded by a failed selection.
   */
  readonly selectedPeriod?: ProductSelectedPeriodResult;
}
