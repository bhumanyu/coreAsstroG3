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
import type { CareerWealthFinalSynthesis } from '../../domain/careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
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

export type {
  DomainId,
  DomainStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect,
  ConfidenceLevel
};
export type {
  LifeAnalysisStatus,
  SynthesisDomainStrength,
  CrossDomainConflictType,
  CrossDomainSeverity,
  LifeAnalysisConfidence
};
export type { WealthDimensionStatus };

export type LifeAnalysisActiveDashaViewModel = DashaInterpretationProduct;

export type LifeAnalysisProductStatus = 'LOADING' | 'READY' | 'PARTIAL' | 'ERROR';

export type TimingAvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface LifeAnalysisQualification {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly description: string;
}

export interface CareerPeriodTimingProduct {
  readonly period?: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect: TimingActivationEffect;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerTimingProduct {
  readonly status?: TimingAvailabilityStatus;
  readonly asOf?: string;
  readonly mahadasha?: CareerPeriodTimingProduct;
  readonly antardasha?: CareerPeriodTimingProduct;
  readonly pratyantardasha?: CareerPeriodTimingProduct;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly transitEffect?: TransitTriggerEffect;
  readonly transitStatement?: string;
}

export interface WealthPeriodTimingProduct {
  readonly period?: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect?: TimingActivationEffect;
  readonly dimensions: {
    readonly accumulation: TimingActivationEffect;
    readonly gains: TimingActivationEffect;
    readonly fortune: TimingActivationEffect;
    readonly speculation: TimingActivationEffect;
  };
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
}

export interface WealthTimingProduct {
  readonly status?: TimingAvailabilityStatus;
  readonly asOf?: string;
  readonly mahadasha?: WealthPeriodTimingProduct;
  readonly antardasha?: WealthPeriodTimingProduct;
  readonly pratyantardasha?: WealthPeriodTimingProduct;
  readonly currentActivation?: string;
  readonly transitEffect?: TransitTriggerEffect;
  readonly transitStatement?: string;
}

export interface LifeAnalysisOverallViewModel {
  readonly status: LifeAnalysisStatus;
  readonly statement: string;
  readonly headline?: string;
  readonly strongestDomainNames: readonly string[];
  readonly challengedDomainNames: readonly string[];
}

export interface LifeAnalysisDomainSummaryViewModel {
  readonly domain: 'CAREER' | 'WEALTH' | DomainId;
  readonly displayName: string;
  readonly status: LifeAnalysisStatus;
  readonly strength: SynthesisDomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly conclusion: string;
  readonly headline?: string;
  readonly statement?: string;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export interface LifeAnalysisCareerDetailViewModel {
  readonly natalPromise: DomainStrength;
  readonly d10Relationship: VargaRelationship;
  readonly currentDashaEffect: TimingActivationEffect;
  readonly currentTransitEffect: TransitTriggerEffect;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly dominantManifestations?: readonly string[];
  readonly manifestations?: readonly string[];
  readonly headline?: string;
  readonly statement?: string;
  readonly promiseHeadline?: string;
  readonly promiseStatement?: string;
  readonly status?: DomainStrength;
  readonly capacityLevel?: string;
  readonly actionableTakeaways?: readonly string[];
  readonly d10Statement?: string;
  readonly qualifications?: readonly LifeAnalysisQualification[];
  readonly timing?: CareerTimingProduct;
  readonly currentTimingEffect?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly dashaHierarchy?: DashaCareerHierarchySynthesis;
  readonly manifestationSynthesis?: readonly CareerManifestationSynthesis[];
  readonly finalSynthesis?: CareerWealthFinalSynthesis;
}

export interface LifeAnalysisWealthDetailViewModel {
  readonly natalPromise: DomainStrength;
  readonly d2Relationship: VargaRelationship;
  readonly currentDashaEffect: TimingActivationEffect;
  readonly currentTransitEffect: TransitTriggerEffect;
  readonly overallStatus: WealthDimensionStatus;
  readonly accumulationStatus: WealthDimensionStatus;
  readonly gainsStatus: WealthDimensionStatus;
  readonly fortuneStatus: WealthDimensionStatus;
  readonly speculationStatus: WealthDimensionStatus;
  readonly dominantManifestations?: readonly string[];
  readonly headline?: string;
  readonly statement?: string;
  readonly promiseHeadline?: string;
  readonly promiseStatement?: string;
  readonly status?: DomainStrength;
  readonly accumulation?: { readonly status?: WealthDimensionStatus; readonly statement?: string };
  readonly gains?: { readonly status?: WealthDimensionStatus; readonly statement?: string };
  readonly fortune?: { readonly status?: WealthDimensionStatus; readonly statement?: string };
  readonly speculation?: { readonly status?: WealthDimensionStatus; readonly statement?: string };
  readonly d2Statement?: string;
  readonly qualifications?: readonly LifeAnalysisQualification[];
  readonly timing?: WealthTimingProduct;
  readonly dimensionTiming?: {
    readonly accumulation: TimingActivationEffect;
    readonly gains: TimingActivationEffect;
    readonly fortune: TimingActivationEffect;
    readonly speculation: TimingActivationEffect;
  };
  readonly currentTimingEffect?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly dashaHierarchy?: DashaWealthHierarchySynthesis;
  readonly manifestationSynthesis?: WealthManifestationSynthesis;
  readonly finalSynthesis?: CareerWealthFinalSynthesis;
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
