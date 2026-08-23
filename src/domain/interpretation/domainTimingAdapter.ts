import type { DomainInterpretation } from './DomainInterpretation';
import type { CareerTimingActivation, CareerConclusionData } from '../career/careerTypes';
import type { WealthPeriodTimingActivation, WealthConclusionData } from '../wealth/wealthTypes';
import type { TimingActivationEffect } from './DomainInterpretationTypes';
import type {
  CareerTimingProduct,
  WealthTimingProduct,
  WealthPeriodTimingProduct,
  TimingAvailabilityStatus
} from '../../product/life-analysis/lifeAnalysisTypes';
import { indexDashaPeriodActivations } from '../../product/life-analysis/dashaHierarchyUtils';

/**
 * Safely extract CareerConclusionData from a domain interpretation.
 */
export function getCareerConclusionData(
  interpretation?: DomainInterpretation
): CareerConclusionData | undefined {
  if (!interpretation) return undefined;
  if (interpretation.conclusionData && typeof interpretation.conclusionData === 'object') {
    return interpretation.conclusionData as CareerConclusionData;
  }
  return undefined;
}

/**
 * Safely extract WealthConclusionData from a domain interpretation.
 */
export function getWealthConclusionData(
  interpretation?: DomainInterpretation
): WealthConclusionData | undefined {
  if (!interpretation) return undefined;
  if (interpretation.conclusionData && typeof interpretation.conclusionData === 'object') {
    return interpretation.conclusionData as WealthConclusionData;
  }
  return undefined;
}

/**
 * Safely extract CareerTimingActivation array from domain interpretation.
 */
export function getCareerTimingActivations(
  interpretation?: DomainInterpretation
): readonly CareerTimingActivation[] | undefined {
  if (!interpretation) return undefined;
  if (Array.isArray(interpretation.timingActivations) && interpretation.timingActivations.length > 0) {
    return interpretation.timingActivations as readonly CareerTimingActivation[];
  }
  return undefined;
}

/**
 * Safely extract WealthPeriodTimingActivation array from domain interpretation.
 */
export function getWealthPeriodTimingActivations(
  interpretation?: DomainInterpretation
): readonly WealthPeriodTimingActivation[] | undefined {
  if (!interpretation) return undefined;
  if (Array.isArray(interpretation.periodTimingActivations) && interpretation.periodTimingActivations.length > 0) {
    return interpretation.periodTimingActivations;
  }
  const cd = getWealthConclusionData(interpretation);
  if (cd?.periodTimingActivations && cd.periodTimingActivations.length > 0) {
    return cd.periodTimingActivations;
  }
  return undefined;
}

/**
 * Builds a standardized CareerTimingProduct from a domain interpretation.
 */
export function buildNormalizedCareerTiming(
  career?: DomainInterpretation,
  asOf?: string
): CareerTimingProduct | undefined {
  if (!career) return undefined;

  const careerDasha = career.conclusionData?.careerDashaSynthesis;
  if (careerDasha && careerDasha.combined.combinedEffect !== 'INSUFFICIENT_DATA') {
    const timingAsOf = asOf ?? careerDasha.asOf;
    return {
      status: 'AVAILABLE',
      asOf: timingAsOf,
      mahadasha: {
        period: 'MD',
        planet: careerDasha.md.planet,
        effect: careerDasha.md.effect,
        evidenceIds: careerDasha.md.factors.map((f) => f.id),
        statement: careerDasha.md.summary
      },
      antardasha: {
        period: 'AD',
        planet: careerDasha.ad.planet,
        effect: careerDasha.ad.effect,
        evidenceIds: careerDasha.ad.factors.map((f) => f.id),
        statement: careerDasha.ad.summary
      },
      pratyantardasha: {
        period: 'PD',
        planet: careerDasha.pd.planet,
        effect: careerDasha.pd.effect,
        evidenceIds: careerDasha.pd.factors.map((f) => f.id),
        statement: careerDasha.pd.summary
      }
    };
  }

  const activations = getCareerTimingActivations(career);
  if (!activations || activations.length === 0) {
    return { status: 'UNAVAILABLE', asOf };
  }

  const { md, ad, pd } = indexDashaPeriodActivations(activations);

  const hasAnyData = [md, ad, pd].some(
    (p) => p && p.effect !== 'INSUFFICIENT_DATA' && p.effect !== 'UNKNOWN'
  );
  const status: TimingAvailabilityStatus = hasAnyData ? 'AVAILABLE' : 'UNAVAILABLE';

  return {
    status,
    asOf,
    ...(md
      ? {
          mahadasha: {
            period: 'MD',
            planet: md.planet,
            effect: md.effect,
            evidenceIds: md.evidenceIds ?? [],
            statement: md.statement
          }
        }
      : {}),
    ...(ad
      ? {
          antardasha: {
            period: 'AD',
            planet: ad.planet,
            effect: ad.effect,
            evidenceIds: ad.evidenceIds ?? [],
            statement: ad.statement
          }
        }
      : {}),
    ...(pd
      ? {
          pratyantardasha: {
            period: 'PD',
            planet: pd.planet,
            effect: pd.effect,
            evidenceIds: pd.evidenceIds ?? [],
            statement: pd.statement
          }
        }
      : {})
  };
}

/**
 * Builds a standardized WealthTimingProduct from a domain interpretation.
 */
export function buildNormalizedWealthTiming(
  wealth?: DomainInterpretation,
  asOf?: string
): WealthTimingProduct | undefined {
  if (!wealth) return undefined;
  const periodActivations = getWealthPeriodTimingActivations(wealth);
  if (!periodActivations || periodActivations.length === 0) {
    return { status: 'UNAVAILABLE', asOf };
  }

  const { md, ad, pd } = indexDashaPeriodActivations(periodActivations);

  const hasAnyData = [md, ad, pd].some(
    (p) => p && p.effect !== 'INSUFFICIENT_DATA' && p.effect !== 'UNKNOWN'
  );
  const status: TimingAvailabilityStatus = hasAnyData ? 'AVAILABLE' : 'UNAVAILABLE';

  const mapPeriod = (p?: WealthPeriodTimingActivation): WealthPeriodTimingProduct | undefined => {
    if (!p) return undefined;
    return {
      period: p.period,
      planet: p.planet,
      effect: p.effect,
      dimensions: {
        accumulation: p.dimensions?.accumulation ?? 'INSUFFICIENT_DATA',
        gains: p.dimensions?.gains ?? 'INSUFFICIENT_DATA',
        fortune: p.dimensions?.fortune ?? 'INSUFFICIENT_DATA',
        speculation: p.dimensions?.speculation ?? 'INSUFFICIENT_DATA'
      },
      evidenceIds: p.evidenceIds ?? [],
      statement: p.statement
    };
  };

  const mahadasha = mapPeriod(md);
  const antardasha = mapPeriod(ad);
  const pratyantardasha = mapPeriod(pd);

  return {
    status,
    asOf,
    ...(mahadasha ? { mahadasha } : {}),
    ...(antardasha ? { antardasha } : {}),
    ...(pratyantardasha ? { pratyantardasha } : {})
  };
}

/**
 * Summarizes the active MD/AD career timing effect into a high-level outcome.
 */
export function deriveCareerTimingEffect(
  timing?: CareerTimingProduct
): 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' {
  if (!timing || timing.status !== 'AVAILABLE') return 'NEUTRAL';
  const mdEffect = timing.mahadasha?.effect;
  const adEffect = timing.antardasha?.effect;

  const effects = [mdEffect, adEffect].filter(Boolean) as string[];
  const hasSupport = effects.some((e) => e === 'ACTIVATES' || e === 'PARTIALLY_ACTIVATES' || e === 'SUPPORT');
  const hasChallenge = effects.some((e) => e === 'CHALLENGES' || e === 'CHALLENGE');

  if (hasSupport && hasChallenge) return 'MIXED';
  if (hasSupport) return 'SUPPORT';
  if (hasChallenge) return 'CHALLENGE';
  return 'NEUTRAL';
}

/**
 * Derives the active MD per-dimension timing effects for Wealth.
 */
export function deriveWealthDimensionTiming(
  timing?: WealthTimingProduct
): {
  readonly accumulation: TimingActivationEffect | string;
  readonly gains: TimingActivationEffect | string;
  readonly fortune: TimingActivationEffect | string;
  readonly speculation: TimingActivationEffect | string;
} | undefined {
  if (!timing || timing.status !== 'AVAILABLE') return undefined;
  const md = timing.mahadasha;
  if (!md || !md.dimensions) return undefined;
  return {
    accumulation: md.dimensions.accumulation,
    gains: md.dimensions.gains,
    fortune: md.dimensions.fortune,
    speculation: md.dimensions.speculation
  };
}

/**
 * Summarizes the active MD/AD wealth timing effect into a high-level outcome.
 */
export function deriveWealthTimingEffect(
  timing?: WealthTimingProduct
): 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' {
  if (!timing || timing.status !== 'AVAILABLE') return 'NEUTRAL';
  const md = timing.mahadasha;
  const ad = timing.antardasha;

  const dimensionEffects = md?.dimensions
    ? [md.dimensions.accumulation, md.dimensions.gains, md.dimensions.fortune, md.dimensions.speculation]
    : [];
  const periodEffects = [md?.effect, ad?.effect].filter(Boolean);
  const allEffects = [...dimensionEffects, ...periodEffects] as string[];

  const hasSupport = allEffects.some((e) => e === 'ACTIVATES' || e === 'PARTIALLY_ACTIVATES' || e === 'SUPPORT');
  const hasChallenge = allEffects.some((e) => e === 'CHALLENGES' || e === 'CHALLENGE');

  if (hasSupport && hasChallenge) return 'MIXED';
  if (hasSupport) return 'SUPPORT';
  if (hasChallenge) return 'CHALLENGE';
  return 'NEUTRAL';
}
