import type { Horoscope } from '../../types';
import type { DomainInterpretation } from '../../domain/interpretation';
import {
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming
} from '../../domain/interpretation/domainTimingAdapter';
import { mapActiveDasha } from '../life-analysis/dasha/activeDashaMapper';
import type {
  DashaTimingViewModel,
  DashaTimingStatus,
  DashaTimelinePeriodProduct,
  DashaBirthAnchorProduct,
  DashaCurrentPeriodProduct,
  DashaCurrentPeriodsProduct,
  CareerTimingProduct,
  WealthTimingProduct
} from './dashaTimingTypes';

/**
 * Options for building the Dasha & Timing product view model.
 */
export interface BuildDashaTimingViewModelOptions {
  readonly asOf?: string;
}

/**
 * Builds a dedicated, pure product-layer DashaTimingViewModel from upstream
 * deterministic horoscope and domain timing outputs.
 *
 * Invariants:
 * - Deterministic: Never computes or recalculates Vimshottari or Active Dasha.
 * - Reuses D03 Active Dasha Mapper (mapActiveDasha) and D05 Domain Timing Adapters.
 * - Does not call `new Date()` for period selection; `asOf` is propagated from upstream.
 * - Free of internal engine or raw ASTRO data types.
 */
export function buildDashaTimingViewModel(
  horoscope: Horoscope,
  careerTiming?: CareerTimingProduct | DomainInterpretation,
  wealthTiming?: WealthTimingProduct | DomainInterpretation,
  options?: BuildDashaTimingViewModelOptions
): DashaTimingViewModel {
  const asOf = options?.asOf ?? horoscope.dashaInterpretation?.current?.at;

  // 1. Resolve Timeline from deterministic horoscope
  const rawMahadashas =
    horoscope.dashaInterpretation?.mahadashas ??
    horoscope.vimshottari?.mahadashas ??
    horoscope.fullNatalAnalysis?.vimshottari?.mahadashas;

  const rawAnchor =
    horoscope.dashaInterpretation?.birthAnchor ??
    horoscope.vimshottari?.birthAnchor ??
    horoscope.fullNatalAnalysis?.vimshottari?.birthAnchor;

  let birthAnchor: DashaBirthAnchorProduct | undefined;
  if (rawAnchor && rawAnchor.nakshatra && rawAnchor.nakshatraLord) {
    birthAnchor = {
      nakshatra: String(rawAnchor.nakshatra),
      nakshatraLord: rawAnchor.nakshatraLord,
      nakshatraProgress: rawAnchor.nakshatraProgress,
      remainingFraction: rawAnchor.remainingFraction,
      balanceYears: rawAnchor.balanceYears,
      balanceMonths: rawAnchor.balanceMonths,
      balanceDays: rawAnchor.balanceDays
    };
  }

  const hasTimeline = Array.isArray(rawMahadashas) && rawMahadashas.length > 0;
  const periods: readonly DashaTimelinePeriodProduct[] = hasTimeline
    ? rawMahadashas.map((m: any, idx: number) => ({
        planet: m.planet,
        start: m.start,
        end: m.end,
        durationYears: m.durationYears,
        index: idx + 1,
        antardashas: Array.isArray(m.antardashas)
          ? m.antardashas.map((a: any) => ({
              planet: a.planet,
              start: a.start,
              end: a.end,
              durationYears: a.durationYears
            }))
          : undefined
      }))
    : [];

  const timelineAvailability = hasTimeline ? 'AVAILABLE' : 'UNAVAILABLE';

  // 2. Resolve Active Dasha Interpretation via D03 mapActiveDasha
  const rawCurrent = horoscope.dashaInterpretation?.current;
  const interpretation = mapActiveDasha(rawCurrent);

  let current: DashaCurrentPeriodsProduct | undefined;

  if (interpretation && interpretation.status === 'AVAILABLE') {
    const mapCurrentPeriod = (
      period?: (typeof interpretation)['mahadasha'],
      level?: 'MD' | 'AD' | 'PD'
    ): DashaCurrentPeriodProduct | undefined => {
      if (!period || !level) return undefined;
      return {
        level,
        planet: period.planet,
        start: period.start,
        end: period.end,
        placement: period.placement,
        ownedHouses: period.ownedHouses,
        functionalRoles: period.functionalRoles,
        functionalNature: period.functionalNature,
        dignity: period.dignity,
        state: period.state,
        confidence: period.confidence
      };
    };

    const mahadasha = mapCurrentPeriod(interpretation.mahadasha, 'MD');
    const antardasha = mapCurrentPeriod(interpretation.antardasha, 'AD');
    const pratyantardasha = mapCurrentPeriod(interpretation.pratyantardasha, 'PD');

    if (mahadasha || antardasha || pratyantardasha) {
      current = {
        mahadasha,
        antardasha,
        pratyantardasha,
        pair: interpretation.pair
      };
    }
  }

  // 3. Resolve Career & Wealth Timing (Reuse pre-computed or adapt DomainInterpretation)
  let resolvedCareerTiming: CareerTimingProduct | undefined;
  if (careerTiming) {
    if ('status' in careerTiming) {
      resolvedCareerTiming = careerTiming as CareerTimingProduct;
    } else {
      resolvedCareerTiming = buildNormalizedCareerTiming(
        careerTiming as DomainInterpretation,
        asOf
      );
    }
  }

  let resolvedWealthTiming: WealthTimingProduct | undefined;
  if (wealthTiming) {
    if ('status' in wealthTiming) {
      resolvedWealthTiming = wealthTiming as WealthTimingProduct;
    } else {
      resolvedWealthTiming = buildNormalizedWealthTiming(
        wealthTiming as DomainInterpretation,
        asOf
      );
    }
  }

  // 4. Determine overall aggregation availability status
  let availability: DashaTimingStatus = 'UNAVAILABLE';
  if (timelineAvailability === 'AVAILABLE' && current) {
    availability = 'AVAILABLE';
  } else if (timelineAvailability === 'AVAILABLE') {
    availability = 'PARTIAL';
  }

  return {
    availability,
    asOf,
    timeline: {
      availability: timelineAvailability,
      birthAnchor,
      periods
    },
    ...(current ? { current } : {}),
    ...(interpretation ? { interpretation } : {}),
    ...(resolvedCareerTiming ? { career: resolvedCareerTiming } : {}),
    ...(resolvedWealthTiming ? { wealth: resolvedWealthTiming } : {}),
    generatedAt: new Date().toISOString()
  };
}
