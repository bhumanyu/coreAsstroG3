import type {
  ConfidenceLevel,
  TimingActivationEffect,
  ManifestationMode,
  DomainStrength,
  VargaRelationship
} from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { Planet } from '../../types';
import type { CareerDashaSynthesis } from './careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis } from '../timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerManifestationSynthesis } from './manifestation/careerManifestationSynthesisTypes';
import type { CareerWealthFinalSynthesis } from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import type { ReasoningTraceGraph } from '../careerWealth/reasoningTrace';
import type { CanonicalCareerFoundation } from './orchestration/canonicalCareerContracts';
import type { CareerTrajectoryAnalysis } from './careerTrajectory/careerTrajectoryTypes';
import type { CareerEventsAnalysis } from './careerEvents/careerEventTypes';
import type { CareerOutcomeAnalysis } from './careerOutcomeQualification/careerOutcomeTypes';
import type { CareerEventTimelineAnalysis } from './careerEventTimeline/careerEventTimelineTypes';
import type { CareerProfessionAnalysis } from './careerProfession/careerProfessionTypes';
import type {
  CareerNatalAnalysis
} from './careerNatalAnalysis';
import type {
  CareerExpressionAnalysis
} from './careerExpression';
import type {
  CareerExpressionCanonicalResult
} from './careerExpression/careerExpressionTypes';
import type {
  CareerMechanismCandidate
} from './careerMechanism/careerMechanismTypes';
import type {
  CareerDashaCanonicalAnalysis
} from './careerDasha/careerDashaCanonicalTypes';
import type {
  CareerDashaActivationDiagnosticTrace
} from './careerDasha/careerDashaActivationTypes';
import type {
  CareerFinalSynthesisResult
} from './careerFinalSynthesis/careerFinalSynthesisTypes';

/**
 * C8 stage attribution is valid only when every field is present. Precedence:
 * missing networks, missing qualification results, incomplete network/qualification
 * evaluation, no discovered patterns, no eligible patterns (all were UNQUALIFIED),
 * role-assignment errors, skipped role assignments, then mechanism resolution for
 * eligible patterns. Missing qualification results must not be inferred as explicit
 * UNQUALIFIED results.
 * Skipped patterns are distinct from ERROR-severity role-assignment failures.
 */
export interface CareerC8ExpressionCoverage {
  readonly mechanismCandidateCount: number;
  readonly patternCandidateCount: number;
  readonly qualificationResultMissingCount: number;
  readonly qualifiedPatternCount: number;
  readonly eligiblePatternCount: number;
  readonly invalidRolePatternCount: number;
  readonly roleAssignmentSkippedPatternCount: number;
  readonly resolvedMechanismCount: number;
  readonly networkResolutionStatus: 'RESOLVED' | 'MISSING' | 'INCOMPLETE' | 'NOT_REQUIRED';
  readonly expressionCount: number;
  readonly expressionsWithEvidenceCount: number;
  readonly evidenceCount: number;
  readonly evidenceWithPlanetAttributionCount: number;
}

export interface CareerAvailabilityDiagnosticTrace {
  readonly c8ExpressionCoverage?: CareerC8ExpressionCoverage;
  readonly structuralPrimarySupportPassedToC9?: number;
  readonly c9ExpressionTrace?: CareerDashaActivationDiagnosticTrace['expressionTrace'];
  readonly c9PlanetContextResolution?: CareerDashaActivationDiagnosticTrace['planetContextResolution'];
  readonly c9LevelResultsBeforeHierarchy?: CareerDashaActivationDiagnosticTrace['levels'];
  readonly natalPromiseDirectionPassedToProfessionRanking?: CareerFinalSynthesisResult['natalDirection'];
}

export type CareerManifestationMode =
  | 'LEADERSHIP'
  | 'MANAGEMENT'
  | 'TECHNICAL_SPECIALIZATION'
  | 'SERVICE_EMPLOYMENT'
  | 'AUTHORITY'
  | 'INDEPENDENT_WORK'
  | 'BUSINESS_ENTREPRENEURSHIP'
  | 'PUBLIC_INSTITUTIONAL'
  | 'SPECIALIZATION'
  | 'EMPLOYMENT'
  | 'ENTREPRENEURSHIP';

export const CAREER_PRIMARY_HOUSES: ReadonlySet<number> = new Set([10]);
export const CAREER_SUPPORTING_HOUSES: ReadonlySet<number> = new Set([6, 2, 11]);
export const CAREER_CHALLENGING_HOUSES: ReadonlySet<number> = new Set([8, 12]);
export const CAREER_PRIMARY_LORDS: ReadonlySet<string> = new Set(['10L']);
export const CAREER_SUPPORTING_LORDS: ReadonlySet<string> = new Set(['6L', '2L', '11L']);
export const CAREER_CHALLENGING_LORDS: ReadonlySet<string> = new Set(['8L', '12L']);

export interface CareerHousePortfolio {
  readonly primary: readonly number[];
  readonly supporting: readonly number[];
  readonly challenging: readonly number[];
  /** Engine-specific product policy for contextual pattern evidence; not a general astrological classification. */
  readonly secondary?: readonly number[];
}

export const CAREER_HOUSE_PORTFOLIO: CareerHousePortfolio = Object.freeze({
  primary: Object.freeze([10]),
  supporting: Object.freeze([6, 2, 11]),
  challenging: Object.freeze([8, 12]),
  secondary: Object.freeze([1, 3, 5, 7, 9])
});

export const CAREER_D10_HOUSE_PORTFOLIO: CareerHousePortfolio = Object.freeze({
  primary: CAREER_HOUSE_PORTFOLIO.primary,
  supporting: CAREER_HOUSE_PORTFOLIO.supporting,
  challenging: CAREER_HOUSE_PORTFOLIO.challenging,
  secondary: Object.freeze([])
});

export function getCareerHousePortfolio(): CareerHousePortfolio {
  return CAREER_HOUSE_PORTFOLIO;
}

export type CareerHouseDirection = 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'SECONDARY' | 'NEUTRAL';

export function classifyCareerHouse(
  house: number,
  portfolio: CareerHousePortfolio = CAREER_HOUSE_PORTFOLIO
): CareerHouseDirection {
  if (portfolio.primary.includes(house)) {
    return 'PRIMARY';
  }
  if (portfolio.supporting.includes(house)) {
    return 'SUPPORTING';
  }
  if (portfolio.challenging.includes(house)) {
    return 'CHALLENGING';
  }
  if (portfolio.secondary?.includes(house)) {
    return 'SECONDARY';
  }
  return 'NEUTRAL';
}

export interface CareerManifestation {
  readonly mode: ManifestationMode;
  readonly confidence: ConfidenceLevel;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface CareerTimingActivation {
  readonly period?: 'MD' | 'AD' | 'PD' | string;
  readonly level?: 'MD' | 'AD' | 'PD' | 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | string;
  readonly planet?: Planet;
  readonly effect: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly statement?: string;
  readonly source?: string;
  readonly periodKey?: string;
  readonly active?: boolean;
  readonly dimension?: string;
}

export interface CareerDataCompleteness {
  readonly primaryFactors: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  readonly d10: 'AVAILABLE' | 'UNAVAILABLE';
  readonly dasha: 'AVAILABLE' | 'UNAVAILABLE';
  readonly transit: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface CareerEvidenceClassification {
  readonly primary: readonly DomainEvidence[];
  readonly supporting: readonly DomainEvidence[];
  readonly challenging: readonly DomainEvidence[];
  readonly modifiers: readonly DomainEvidence[];
}

/**
 * PBA-07: Internal canonical artifacts for selected-period synthesis.
 * Internal-only type for passing already-computed canonical artifacts to the selected-period builder.
 * Never mapped into ProductAnalysis directly - used only for projection into ProductSelectedPeriodSynthesis.
 * Reused in LifeAnalysisProductState.careerArtifacts and BuildProductSelectedPeriodSynthesisInput.careerArtifacts.
 */
export interface CareerInternalArtifacts {
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly canonicalExpression?: CareerExpressionCanonicalResult;
  readonly canonicalExpressionAnalysis?: CareerExpressionCanonicalResult;
  readonly mechanismCandidates?: readonly CareerMechanismCandidate[];
  readonly canonicalDashaAnalysis?: CareerDashaCanonicalAnalysis;
  /** Legacy CW-01 per-level timing confidence; distinct from canonical C9 data. */
  readonly cw01DashaTimingHierarchy?: import('../reasoning/reasoningTypes').TimingHierarchyResult;
  readonly careerDashaEvidence: readonly DomainEvidence[];
  readonly careerAvailabilityDiagnosticTrace?: CareerAvailabilityDiagnosticTrace;
}

export interface CareerConclusionData {
  readonly natalStatus: DomainStrength;
  readonly currentActivation: 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'INACTIVE' | 'STRONG' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
  readonly currentPressure: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG' | 'UNKNOWN';
  readonly d10Relationship: VargaRelationship;
  readonly dominantManifestations: readonly ManifestationMode[];
  readonly headline: string;
  readonly supportingSourceIds: readonly string[];
  readonly challengingSourceIds: readonly string[];
  readonly careerDashaSynthesis?: CareerDashaSynthesis;
  readonly careerTimingSynthesis?: CareerTimingSynthesis;
  readonly careerManifestationSynthesis?: readonly CareerManifestationSynthesis[];
  readonly careerFinalSynthesis?: CareerWealthFinalSynthesis;
  /** Canonical C11 result; legacy careerFinalSynthesis remains compatibility-only. */
  readonly canonicalCareerFinalSynthesis?: import('./careerFinalSynthesis/careerFinalSynthesisTypes').CareerFinalSynthesisResult;
  /** B01: Independent Career analytical axes; deliberately sibling to the immutable C11 result. */
  readonly careerAnalyticalAxes?: import('./careerFinalSynthesis/careerAnalyticalAxes').CareerAnalyticalAxes;
  readonly reasoningTraceGraph?: ReasoningTraceGraph;
  /**
   * Canonical career foundation from the orchestrator (P2-11G).
   * A composition artifact that exposes pattern/qualification/mechanism stages
   * with preserved identity keys. Not a competing conclusion to canonical C11.
   */
  readonly canonicalCareerFoundation?: CanonicalCareerFoundation;
  /**
   * Per P2-11C Gate 4 Finding 3: C11 validation status.
   * Surface validation failures at the acceptance boundary.
   */
  readonly c11ValidationStatus?: {
    readonly valid: boolean;
    readonly requiredMissing: readonly string[];
    readonly optionalMissing: readonly string[];
    readonly unreferenced: readonly string[];
    readonly diagnostic?: string;
  };
  /**
   * Gate D: Evidence continuity validation report.
   * Validates identity/provenance/reference/counting continuity from C4–C7 → foundation → C8 → C9 → C10 → C11.
   */
  readonly evidenceContinuityReport?: import('./evidenceContinuity').EvidenceContinuityReport;
  /**
   * P2-11F Gate F: Career profession analysis failure diagnostic.
   * Surfaces profession engine failures as a typed diagnostic without breaking C11 conclusion.
   * When present, careerProfessionAnalysis is undefined and the error is recorded here.
   */
  readonly professionAnalysisFailure?: {
    readonly error: string;
    readonly message: string;
  };
  /**
   * P2-11G: Career trajectory analysis (downstream consumer of C11).
   * Long-term trajectory classification derived from C11 final synthesis.
   */
  readonly careerTrajectory?: CareerTrajectoryAnalysis;
  /**
   * P2-11G: Career events analysis (downstream consumer of trajectory and C9).
   * Event candidates derived from trajectory opportunities and Dasha activations.
   */
  readonly careerEvents?: CareerEventsAnalysis;
  /** B02: Downstream outcome qualification; candidate windows and observed facts remain separate. */
  readonly careerOutcomeAnalysis?: CareerOutcomeAnalysis;
  /** B06: Event-specific taxonomy remains gated; only natal-linked generic windows are exposed. */
  readonly careerEventTimeline?: CareerEventTimelineAnalysis;
  /**
   * P2-11F Gate F: Career profession analysis (downstream consumer of C8, C10, evidence).
   * Profession candidates derived from expression analysis, mechanisms, and D10 qualification.
   */
  readonly careerProfessionAnalysis?: CareerProfessionAnalysis;
  /**
   * PBA-07: Internal canonical artifacts for selected-period synthesis.
   * Internal-only field for passing already-computed canonical artifacts to the selected-period builder.
   * Never mapped into ProductAnalysis directly - used only for projection into ProductSelectedPeriodSynthesis.
   */
  readonly internalArtifacts?: CareerInternalArtifacts;
}
