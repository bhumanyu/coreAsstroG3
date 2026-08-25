import type { Planet } from '../../../types';
import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import type { CareerDashaEffect } from '../../career/careerDasha/careerDashaSynthesisTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';

export type TimingDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type TimingRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'TRIGGER'
  | 'MODIFIER';

export type TimingEffect =
  | 'ACTIVATES'
  | 'MODIFIES'
  | 'CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'INSUFFICIENT_DATA';

export type TimingSourceCategory =
  | 'CAREER_HOUSE_TRANSIT'
  | 'CAREER_LORD_TRANSIT'
  | 'DASHA_LORD_TRANSIT'
  | 'CAREER_KARAKA_TRANSIT'
  | 'WEALTH_HOUSE_TRANSIT'
  | 'WEALTH_LORD_TRANSIT'
  | 'WEALTH_KARAKA_TRANSIT';

export interface CareerTransitFactor {
  readonly id: string;
  readonly planet: Planet;
  readonly category: TimingSourceCategory;
  readonly direction: TimingDirection;
  readonly weight: number;
  readonly statement: string;
  readonly houses?: readonly number[];
  readonly natalEvidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
}

export type CareerTimingFactor = CareerTransitFactor;
export type WealthTimingFactor = WealthTransitFactor;
export type WealthDimensionTimingSynthesis = WealthTransitDimensionSynthesis;

export interface CareerTransitSynthesis {
  readonly transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  readonly confidence: number;
  readonly factors: readonly CareerTransitFactor[];
  readonly summary: string;
}

export interface CareerTimingSynthesis {
  readonly natalPromise: DomainStrength;
  readonly dashaEffect: CareerDashaEffect;
  readonly transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  readonly overallEffect: TimingEffect;
  readonly confidence: number;
  readonly factors: readonly CareerTransitFactor[];
  readonly summary: string;
}

export interface WealthTransitFactor {
  readonly id: string;
  readonly planet: Planet;
  readonly category: TimingSourceCategory;
  readonly direction: TimingDirection;
  readonly weight: number;
  readonly statement: string;
  readonly dimension: WealthDimension;
  readonly houses?: readonly number[];
  readonly natalEvidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
}

export interface WealthTransitDimensionSynthesis {
  readonly dimension: WealthDimension;
  readonly natalPromise: DomainStrength;
  readonly dashaEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  readonly transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  readonly overallEffect: TimingEffect;
  readonly confidence: number;
  readonly factors: readonly WealthTransitFactor[];
  readonly summary: string;
}

export interface WealthTimingSynthesis {
  readonly dimensions: Record<WealthDimension, WealthTransitDimensionSynthesis>;
  readonly overallSummary: string;
}
