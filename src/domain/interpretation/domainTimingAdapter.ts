import type { DomainInterpretation } from './DomainInterpretation';
import type { CareerTimingActivation, CareerConclusionData } from '../career/careerTypes';
import type { WealthPeriodTimingActivation, WealthConclusionData } from '../wealth/wealthTypes';
import type { TimingActivationEffect } from './DomainInterpretationTypes';
import type {
  CareerTimingProduct,
  CareerPeriodTimingProduct,
  WealthTimingProduct,
  WealthPeriodTimingProduct,
  TimingAvailabilityStatus,
  TraceabilityStatus
} from '../../product/life-analysis/lifeAnalysisTypes';
import type { DashaEvidenceTally } from '../../product/analysis/productAnalysisTypes';
import type { CareerDashaCanonicalEvidence } from '../career/careerDasha/careerDashaCanonicalTypes';
import { formatCanonicalDashaPeriodStatement } from '../career/careerDasha/careerDashaPeriodStatement';
import { indexDashaPeriodActivations } from '../../product/life-analysis/dashaHierarchyUtils';
import type { DomainEvidence } from './DomainEvidence';
import { UNRESOLVED_IDENTITY_SENTINEL } from './DomainEvidence';

export interface PeriodCanonicalEvidenceResult {
  readonly evidenceIds: readonly string[];
  readonly traceability: TraceabilityStatus;
}

/**
 * Maps CW-02 factor IDs to canonical CAREER_DASHA:* evidence IDs for a given period.
 *
 * Per-period timing evidenceIds reference emitted DomainEvidence occurrence IDs, not semantic
 * identity keys or legacy CW-02 factor IDs. Canonical C9 evidence is available in
 * interpretation.evidence filtered by source 'DASHA'.
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

  // Keep references aligned with DomainEvidence.id; identityKey is a grouping key, not an emitted ID.
  if (canonicalEvidence.length > 0) {
    const evidenceIds = canonicalEvidence
      .map((e: DomainEvidence) => e.id.trim())
      .filter(id => id.length > 0 && id !== UNRESOLVED_IDENTITY_SENTINEL)
      .sort((a, b) => a.localeCompare(b));

    // If every matching record has an invalid occurrence ID, treat as DEGRADED.
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
 * Builds the user-facing career timing projection from canonical C9.
 * Legacy CW-09 timing is not used as a fallback when C9 is unavailable.
 */
export function buildNormalizedCareerTiming(
  career?: DomainInterpretation,
  asOf?: string
): CareerTimingProduct | undefined {
  if (!career) return undefined;

  const canonicalDasha = career.conclusionData?.internalArtifacts?.canonicalDashaAnalysis;
  if (canonicalDasha) {
    // Display-only tally of canonical C9 evidence counts by direction.
    // Counts evidence items — never weighted scores — and never feeds the
    // predicate-driven period verdict. MIXED/UNAVAILABLE directions are not
    // counted in any bucket; missing evidence is not negative evidence.
    const tallyLevelEvidence = (
      items: readonly CareerDashaCanonicalEvidence[]
    ): DashaEvidenceTally | undefined => {
      if (items.length === 0) {
        return undefined;
      }
      const tally: { supportingCount: number; challengingCount: number; neutralCount: number } = {
        supportingCount: 0,
        challengingCount: 0,
        neutralCount: 0
      };
      for (const item of items) {
        if (item.direction === 'SUPPORT') {
          tally.supportingCount += 1;
        } else if (item.direction === 'CHALLENGE') {
          tally.challengingCount += 1;
        } else if (item.direction === 'NEUTRAL') {
          tally.neutralCount += 1;
        }
      }
      return tally;
    };

    const mapCanonicalPeriod = (level: 'MD' | 'AD' | 'PD'): CareerPeriodTimingProduct => {
      const period =
        level === 'MD' ? canonicalDasha.md :
          level === 'AD' ? canonicalDasha.ad : canonicalDasha.pd;
      const levelEvidence = canonicalDasha.evidence.filter(
        (item: CareerDashaCanonicalEvidence) => item.level === level
      );
      const evidenceTally = tallyLevelEvidence(levelEvidence);
      const evidence = mapPeriodToCanonicalEvidenceIds(career, level, period.planet);
      return {
        period: level,
        planet: period.planet,
        effect: period.effect,
        evidenceIds: evidence.evidenceIds,
        traceability: evidence.traceability,
        conditionAssessment: period.conditionAssessment,
        afflictionAssessed: period.afflictionAssessed,
        statement: formatCanonicalDashaPeriodStatement(period, levelEvidence.length),
        ...(evidenceTally ? { evidenceTally } : {}),
        ...(period.start ? { start: period.start } : {}),
        ...(period.end ? { end: period.end } : {})
      };
    };
    const mahadasha = mapCanonicalPeriod('MD');
    const antardasha = mapCanonicalPeriod('AD');
    const pratyantardasha = mapCanonicalPeriod('PD');
    const hasAvailablePeriod = [mahadasha, antardasha, pratyantardasha].some(
      period => period.planet !== undefined &&
        period.effect !== 'UNKNOWN' &&
        period.effect !== 'INSUFFICIENT_DATA'
    );

    return {
      status: hasAvailablePeriod ? 'AVAILABLE' : 'UNAVAILABLE',
      asOf: asOf ?? career.asOf ?? career.generatedAt,
      mahadasha,
      antardasha,
      pratyantardasha
    };
  }

  return {
    status: 'UNAVAILABLE',
    asOf: asOf ?? career.asOf ?? career.generatedAt
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
