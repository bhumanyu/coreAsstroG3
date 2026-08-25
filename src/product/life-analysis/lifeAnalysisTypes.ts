import type { ConfidenceLevel } from '../../domain/interpretation/DomainInterpretationTypes';
import type { Planet } from '../../types';
import type {
  DomainId,
  DomainStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect
} from '../../domain/interpretation';
import type {
  LifeAnalysisStatus,
  SynthesisDomainStrength,
  CrossDomainConflictType,
  CrossDomainSeverity,
  LifeAnalysisConfidence
} from '../../domain/synthesis';
import type { WealthDimensionStatus } from '../../domain/wealth/wealthTypes';
import type { CareerManifestationSynthesis } from '../../domain/career/manifestation/careerManifestationSynthesisTypes';
import type { WealthManifestationSynthesis } from '../../domain/wealth/manifestation/wealthManifestationTypes';
import type { AiExplanationResult } from '../../ai';
import type { WhyExperienceViewModel } from './lifeAnalysisEvidenceTypes';
import type {
  DashaInterpretationProduct,
  DashaPlanetProduct,
  DashaPairProduct,
  DashaLevel,
  DashaInterpretationStatus
} from './dasha/dashaInterpretationProductTypes';
import type {
  DashaCareerHierarchySynthesis,
  DashaWealthHierarchySynthesis
} from './dashaHierarchyTypes';

export * from './lifeAnalysisEvidenceTypes';
export * from './dasha/dashaInterpretationProductTypes';
export * from './dashaHierarchyTypes';

export type LifeAnalysisActiveDashaViewModel = DashaInterpretationProduct;

export type LifeAnalysisProductStatus = 'LOADING' | 'READY' | 'PARTIAL' | 'ERROR';

export type TimingAvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface CareerPeriodTimingProduct {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect: TimingActivationEffect | string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerTimingProduct {
  readonly status: TimingAvailabilityStatus;
  readonly asOf?: string;
  readonly mahadasha?: CareerPeriodTimingProduct;
  readonly antardasha?: CareerPeriodTimingProduct;
  readonly pratyantardasha?: CareerPeriodTimingProduct;
}

export interface WealthPeriodTimingProduct {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect?: TimingActivationEffect | string;
  readonly dimensions: {
    readonly accumulation: TimingActivationEffect | string;
    readonly gains: TimingActivationEffect | string;
    readonly fortune: TimingActivationEffect | string;
    readonly speculation: TimingActivationEffect | string;
  };
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
}

export interface WealthTimingProduct {
  readonly status: TimingAvailabilityStatus;
  readonly asOf?: string;
  readonly mahadasha?: WealthPeriodTimingProduct;
  readonly antardasha?: WealthPeriodTimingProduct;
  readonly pratyantardasha?: WealthPeriodTimingProduct;
}

export interface LifeAnalysisOverallViewModel {
  readonly status: LifeAnalysisStatus;
  readonly statement: string;
  readonly strongestDomainNames: readonly string[];
  readonly challengedDomainNames: readonly string[];
}

export interface LifeAnalysisDomainSummaryViewModel {
  readonly domain: 'CAREER' | 'WEALTH' | DomainId;
  readonly displayName: string;
  readonly status: LifeAnalysisStatus | string;
  readonly strength: SynthesisDomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly conclusion: string;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export interface LifeAnalysisCareerDetailViewModel {
  readonly natalPromise: DomainStrength;
  readonly d10Relationship: VargaRelationship;
  readonly currentDashaEffect: TimingActivationEffect | string;
  readonly currentTransitEffect: TransitTriggerEffect | string;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly dominantManifestations?: readonly string[];
  readonly headline?: string;
  readonly statement?: string;
  readonly timing?: CareerTimingProduct;
  readonly currentTimingEffect?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly dashaHierarchy?: DashaCareerHierarchySynthesis;
  readonly manifestationSynthesis?: readonly CareerManifestationSynthesis[];
}

export interface LifeAnalysisWealthDetailViewModel {
  readonly natalPromise: DomainStrength;
  readonly d2Relationship: VargaRelationship;
  readonly currentDashaEffect: TimingActivationEffect | string;
  readonly currentTransitEffect: TransitTriggerEffect | string;
  readonly overallStatus: WealthDimensionStatus | string;
  readonly accumulationStatus: WealthDimensionStatus | string;
  readonly gainsStatus: WealthDimensionStatus | string;
  readonly fortuneStatus: WealthDimensionStatus | string;
  readonly speculationStatus: WealthDimensionStatus | string;
  readonly dominantManifestations?: readonly string[];
  readonly headline?: string;
  readonly statement?: string;
  readonly timing?: WealthTimingProduct;
  readonly dimensionTiming?: {
    readonly accumulation: TimingActivationEffect | string;
    readonly gains: TimingActivationEffect | string;
    readonly fortune: TimingActivationEffect | string;
    readonly speculation: TimingActivationEffect | string;
  };
  readonly currentTimingEffect?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly dashaHierarchy?: DashaWealthHierarchySynthesis;
  readonly manifestationSynthesis?: WealthManifestationSynthesis;
}

export interface LifeAnalysisTimingDomainEffect {
  readonly domain: DomainId | string;
  readonly effect: string;
}

export interface LifeAnalysisTimingViewModel {
  readonly source: 'DASHA' | 'TRANSIT';
  readonly title: string;
  readonly period?: string;
  readonly domains: readonly LifeAnalysisTimingDomainEffect[];
  readonly statement: string;
  readonly evidenceCount: number;
  readonly isConflict: boolean;
}

export interface LifeAnalysisConflictViewModel {
  readonly type: CrossDomainConflictType;
  readonly severity: CrossDomainSeverity;
  readonly domains: readonly string[];
  readonly statement: string;
  readonly evidenceCount: number;
}

export interface LifeAnalysisEvidenceViewModel {
  readonly id: string;
  readonly role: 'SUPPORTING' | 'CHALLENGING' | 'CONFLICTING' | 'NEUTRAL';
  readonly statement: string;
  readonly source: string;
  readonly domain?: string;
}

export interface LifeAnalysisCompletenessViewModel {
  readonly overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly label: string;
}

export interface LifeAnalysisViewModel {
  readonly status: 'READY' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly overall: LifeAnalysisOverallViewModel;
  readonly strongestDomains: readonly LifeAnalysisDomainSummaryViewModel[];
  readonly domains: readonly LifeAnalysisDomainSummaryViewModel[];
  readonly sharedTiming: readonly LifeAnalysisTimingViewModel[];
  readonly conflicts: readonly LifeAnalysisConflictViewModel[];
  readonly confidence: LifeAnalysisConfidence;
  readonly completeness: LifeAnalysisCompletenessViewModel;
  readonly evidence: readonly LifeAnalysisEvidenceViewModel[];
  readonly why: WhyExperienceViewModel;
  readonly careerWhy?: WhyExperienceViewModel;
  readonly wealthWhy?: WhyExperienceViewModel;
  readonly careerDetail?: LifeAnalysisCareerDetailViewModel;
  readonly wealthDetail?: LifeAnalysisWealthDetailViewModel;
  readonly activeDasha?: LifeAnalysisActiveDashaViewModel;
}

export interface LifeAnalysisProductState {
  readonly status: LifeAnalysisProductStatus;
  readonly analysis?: LifeAnalysisViewModel;
  readonly aiExplanation?: AiExplanationResult;
  readonly errorMessage?: string;
}
