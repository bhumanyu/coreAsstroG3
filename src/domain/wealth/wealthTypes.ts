import type {
  ConfidenceLevel,
  TimingActivationEffect,
  TransitTriggerEffect,
  ManifestationMode,
  DomainStrength,
  VargaRelationship
} from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import { WealthEvidenceFamily } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';

export { WealthEvidenceFamily };

export type WealthDimension =
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION';

export type WealthDimensionStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED'
  | 'INSUFFICIENT_DATA';

export type WealthManifestationMode =
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION';

export interface WealthTimingActivation {
  readonly period?: 'MD' | 'AD' | 'PD';
  readonly dimension?: WealthDimension;
  readonly effect: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface WealthDimensionInterpretation {
  readonly dimension: WealthDimension;
  readonly status: WealthDimensionStatus;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly dashaEffect: TimingActivationEffect;
}

export interface WealthDataCompleteness {
  readonly primaryFactors: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  readonly d2: 'AVAILABLE' | 'UNAVAILABLE';
  readonly dasha: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  readonly transit: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
}

export interface WealthEvidenceClassification {
  readonly primary: readonly DomainEvidence[];
  readonly supporting: readonly DomainEvidence[];
  readonly challenging: readonly DomainEvidence[];
  readonly modifiers: readonly DomainEvidence[];
}

export interface WealthManifestation {
  readonly mode: ManifestationMode;
  readonly confidence: ConfidenceLevel;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface WealthConclusionData {
  readonly overallStatus: WealthDimensionStatus;
  readonly accumulationStatus: WealthDimensionStatus;
  readonly gainsStatus: WealthDimensionStatus;
  readonly fortuneStatus: WealthDimensionStatus;
  readonly speculationStatus: WealthDimensionStatus;
  readonly mainStrengths: readonly string[];
  readonly mainChallenges: readonly string[];
  readonly d2Relationship: VargaRelationship;
  readonly accumulationDashaEffect: TimingActivationEffect;
  readonly gainsDashaEffect: TimingActivationEffect;
  readonly fortuneDashaEffect: TimingActivationEffect;
  readonly speculationDashaEffect: TimingActivationEffect;
  readonly dominantManifestations: readonly WealthManifestationMode[];
  readonly headline: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
}
