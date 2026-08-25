import type {
  ConfidenceLevel,
  TimingActivationEffect,
  TransitTriggerEffect,
  ManifestationMode,
  DomainStrength,
  VargaRelationship
} from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import { Planet } from '../../types';
import { WealthEvidenceFamily } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';

import type { WealthTimingSynthesis } from '../timing/careerWealthTiming/careerWealthTimingTypes';

export { WealthEvidenceFamily };

export type WealthDimension =
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION';

export const WEALTH_DIMENSION_HOUSES: Readonly<Record<WealthDimension, number>> = Object.freeze({
  ACCUMULATION: 2,
  GAINS: 11,
  FORTUNE: 9,
  SPECULATION: 5
});

export const WEALTH_HOUSES: readonly number[] = Object.freeze(
  Object.values(WEALTH_DIMENSION_HOUSES)
);

export const WEALTH_DIMENSION_KARAKAS: Readonly<Record<WealthDimension, readonly Planet[]>> = Object.freeze({
  ACCUMULATION: Object.freeze([Planet.JUPITER, Planet.VENUS]),
  GAINS: Object.freeze([Planet.JUPITER]),
  FORTUNE: Object.freeze([Planet.JUPITER]),
  SPECULATION: Object.freeze([Planet.VENUS, Planet.MERCURY])
});

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
  readonly period?: 'MD' | 'AD' | 'PD' | string;
  readonly level?: 'MD' | 'AD' | 'PD' | 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | string;
  readonly dimension?: WealthDimension;
  readonly effect: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly statement?: string;
  readonly source?: string;
  readonly periodKey?: string;
  readonly planet?: Planet;
  readonly active?: boolean;
}

export interface WealthPeriodDimensionEffects {
  readonly accumulation: TimingActivationEffect;
  readonly gains: TimingActivationEffect;
  readonly fortune: TimingActivationEffect;
  readonly speculation: TimingActivationEffect;
}

export interface WealthPeriodTimingActivation {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly dimensions: WealthPeriodDimensionEffects;
  readonly evidenceIds: readonly string[];
  readonly effect?: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds?: readonly string[];
  readonly statement?: string;
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
  readonly status?: 'SUPPORTED' | 'POSSIBLE' | 'CHALLENGED' | 'MIXED' | 'INSUFFICIENT_DATA';
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
  readonly periodTimingActivations?: readonly WealthPeriodTimingActivation[];
  readonly wealthTimingSynthesis?: WealthTimingSynthesis;
}
