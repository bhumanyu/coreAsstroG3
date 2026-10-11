import type { DomainInterpretation } from './DomainInterpretation';
import type { CareerTimingActivation, CareerConclusionData } from '../career/careerTypes';
import type { WealthPeriodTimingActivation, WealthConclusionData } from '../wealth/wealthTypes';
import type { TimingActivationEffect } from './DomainInterpretationTypes';
import type {
  CareerTimingProduct,
  WealthTimingProduct,
  WealthPeriodTimingProduct,
  TimingAvailabilityStatus,
  TraceabilityStatus
} from '../../product/life-analysis/lifeAnalysisTypes';
import { indexDashaPeriodActivations } from '../../product/life-analysis/dashaHierarchyUtils';
import type { DomainEvidence } from './DomainEvidence';
import { resolveSemanticIdentity, UNRESOLVED_IDENTITY_SENTINEL } from './DomainEvidence';

export interface PeriodCanonicalEvidenceResult {
  readonly evidenceIds: readonly string[];
  readonly traceability: TraceabilityStatus;
}

/**
 * Maps CW-02 factor IDs to canonical CAREER_DASHA:* evidence IDs for a given period.
 *
 * Per-period timing evidenceIds should reference canonical C9 evidence (CAREER_DASHA:* namespace)
 * that exists in context.evidence, not the CW-02 factor IDs (CW09_* namespace).
 * Canonical C9 evidence is available in interpretation.evidence filtered by source 'DASHA'.
 *
 * Returns both the canonical evidence IDs and a traceability status:
 * - RESOLVED: Canonical evidence was found and IDs are valid
 * - DEGRADED: No canonical evidence found (projection failed or legitimately absent)
 *
 * This allows consumers to distinguish between an empty evidenceIds array due to
 * degraded traceability vs. a legitimately unavailable period.
 *
 * @param interpretation - The domain interpretation containing canonical evidence
 * @param period - The period ('MD', 'AD', or 'PD')
 * @param planet - The planet for the period
 * @param legacyFactorIds - The CW-02 factor IDs (unused, kept for API compatibility)
 * @returns Object with evidenceIds and traceability status
 */
export function mapPeriodToCanonicalEvidenceIds(
  interpretation?: DomainInterpretation,
  period?: 'MD' | 'AD' | 'PD',
  planet?: string,
  legacyFactorIds?: readonly string[]
): PeriodCanonicalEvidenceResult {
  if (!interpretation || !period || !planet) {
    return { evidenceIds: [], traceability: 'DEGRADED' };
  }

  // Find canonical DASHA evidence for this period and planet
  const canonicalEvidence = interpretation.evidence.filter((e: DomainEvidence) => {
    // Must be DASHA source and DASHA_ACTIVATION phase
    if (e.source !== 'DASHA' || e.phase !== 'DASHA_ACTIVATION') {
      return false;
    }

    // Check if timing information matches the period and planet
    if (!e.timing) {
      return false;
    }

    // Match period level and planet
    return e.timing.level === period && e.timing.planet === planet;
  });

  // If canonical evidence exists, use its semantic identity IDs and mark as RESOLVED
  // Semantic identity (identityKey) is used for cross-layer matching, falling back to occurrence ID
  if (canonicalEvidence.length > 0) {
    const evidenceIds = canonicalEvidence
      .map((e: DomainEvidence) => resolveSemanticIdentity(e))
      .filter((id) => id !== UNRESOLVED_IDENTITY_SENTINEL) // Filter out unresolved markers
      .sort((a, b) => a.localeCompare(b)); // Ensure deterministic output

    // If all evidence resolved to the unresolved marker, treat as DEGRADED
    if (evidenceIds.length === 0) {
      return { evidenceIds: [], traceability: 'DEGRADED' };
    }

    return {
      evidenceIds,
      traceability: 'RESOLVED'
    };
  }

  // Return empty array with DEGRADED status if canonical evidence is not available
  // Legacy CW09_* IDs won't exist in context.evidence after Gate 5 cutover
  return { evidenceIds: [], traceability: 'DEGRADED' };
}

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

    // Map legacy factor IDs to canonical evidence IDs
    const mdResult = mapPeriodToCanonicalEvidenceIds(
      career,
      'MD',
      careerDasha.md.planet,
      careerDasha.md.factors.map((f: { id: string }) => f.id)
    );
    const adResult = mapPeriodToCanonicalEvidenceIds(
      career,
      'AD',
      careerDasha.ad.planet,
      careerDasha.ad.factors.map((f: { id: string }) => f.id)
    );
    const pdResult = mapPeriodToCanonicalEvidenceIds(
      career,
      'PD',
      careerDasha.pd.planet,
      careerDasha.pd.factors.map((f: { id: string }) => f.id)
    );

    return {
      status: 'AVAILABLE',
      asOf: timingAsOf,
      mahadasha: {
        period: 'MD',
        planet: careerDasha.md.planet,
        effect: careerDasha.md.effect,
        evidenceIds: mdResult.evidenceIds,
        traceability: mdResult.traceability,
        statement: careerDasha.md.summary,
        ...(careerDasha.md.start ? { start: careerDasha.md.start } : {}),
        ...(careerDasha.md.end ? { end: careerDasha.md.end } : {})
      },
      antardasha: {
        period: 'AD',
        planet: careerDasha.ad.planet,
        effect: careerDasha.ad.effect,
        evidenceIds: adResult.evidenceIds,
        traceability: adResult.traceability,
        statement: careerDasha.ad.summary,
        ...(careerDasha.ad.start ? { start: careerDasha.ad.start } : {}),
        ...(careerDasha.ad.end ? { end: careerDasha.ad.end } : {})
      },
      pratyantardasha: {
        period: 'PD',
        planet: careerDasha.pd.planet,
        effect: careerDasha.pd.effect,
        evidenceIds: pdResult.evidenceIds,
        traceability: pdResult.traceability,
        statement: careerDasha.pd.summary,
        ...(careerDasha.pd.start ? { start: careerDasha.pd.start } : {}),
        ...(careerDasha.pd.end ? { end: careerDasha.pd.end } : {})
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

  // Map legacy factor IDs to canonical evidence IDs for each period
  const mdResult = mapPeriodToCanonicalEvidenceIds(career, 'MD', md?.planet, md?.evidenceIds);
  const adResult = mapPeriodToCanonicalEvidenceIds(career, 'AD', ad?.planet, ad?.evidenceIds);
  const pdResult = mapPeriodToCanonicalEvidenceIds(career, 'PD', pd?.planet, pd?.evidenceIds);

  return {
    status,
    asOf,
    ...(md
      ? {
        mahadasha: {
          period: 'MD',
          planet: md.planet,
          effect: md.effect,
          evidenceIds: mdResult.evidenceIds,
          traceability: mdResult.traceability,
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
          evidenceIds: adResult.evidenceIds,
          traceability: adResult.traceability,
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
          evidenceIds: pdResult.evidenceIds,
          traceability: pdResult.traceability,
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

    // Map legacy factor IDs to canonical evidence IDs for this period
    const result = mapPeriodToCanonicalEvidenceIds(wealth, p.period, p.planet, p.evidenceIds);

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
      evidenceIds: result.evidenceIds,
      traceability: result.traceability,
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
