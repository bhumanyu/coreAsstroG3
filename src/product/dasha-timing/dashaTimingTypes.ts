import type { Planet } from '../../types';
import type {
  DashaInterpretationProduct,
  DashaPlanetProduct,
  DashaPairProduct
} from '../life-analysis/dasha/dashaInterpretationProductTypes';
import type {
  CareerTimingProduct,
  WealthTimingProduct,
  TimingAvailabilityStatus
} from '../life-analysis/lifeAnalysisTypes';

export type DashaTimingStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL';

export interface DashaBirthAnchorProduct {
  readonly nakshatra: string;
  readonly nakshatraLord: Planet;
  readonly nakshatraProgress?: number;
  readonly remainingFraction?: number;
  readonly balanceYears?: number;
  readonly balanceMonths?: number;
  readonly balanceDays?: number;
}

export interface DashaTimelineSubPeriodProduct {
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly durationYears?: number;
}

export interface DashaTimelinePeriodProduct {
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly durationYears?: number;
  readonly index?: number;
  readonly antardashas?: readonly DashaTimelineSubPeriodProduct[];
}

export interface DashaTimelineProduct {
  readonly availability: TimingAvailabilityStatus | DashaTimingStatus;
  readonly birthAnchor?: DashaBirthAnchorProduct;
  readonly periods: readonly DashaTimelinePeriodProduct[];
}

export interface DashaCurrentPeriodProduct {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly placement?: {
    readonly sign: string;
    readonly house: number;
  };
  readonly ownedHouses?: readonly number[];
  readonly functionalRoles?: readonly string[];
  readonly functionalNature?: string;
  readonly dignity?: string;
  readonly state?: string;
  readonly confidence?: string;
}

export interface DashaCurrentPeriodsProduct {
  readonly mahadasha?: DashaCurrentPeriodProduct;
  readonly antardasha?: DashaCurrentPeriodProduct;
  readonly pratyantardasha?: DashaCurrentPeriodProduct;
  readonly pair?: DashaPairProduct;
}

export interface DashaTimingEvidenceProduct {
  readonly id: string;
  readonly ruleId?: string;
  readonly statement?: string;
  readonly effect?: string;
  readonly level?: string;
  readonly source?: string;
  readonly strength?: string;
  readonly domain?: string;
}

export interface DashaTimingViewModel {
  readonly availability: DashaTimingStatus;
  readonly asOf?: string;
  readonly timeline: DashaTimelineProduct;
  readonly current?: DashaCurrentPeriodsProduct;
  readonly interpretation?: DashaInterpretationProduct;
  readonly career?: CareerTimingProduct;
  readonly wealth?: WealthTimingProduct;
  readonly evidence: readonly DashaTimingEvidenceProduct[];
  readonly generatedAt: string;
}

export type {
  DashaInterpretationProduct,
  DashaPlanetProduct,
  DashaPairProduct,
  CareerTimingProduct,
  WealthTimingProduct,
  TimingAvailabilityStatus
};
