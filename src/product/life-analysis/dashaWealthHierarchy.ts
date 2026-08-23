import type { WealthPeriodTimingActivation } from '../../domain/wealth/wealthTypes';
import type {
  DashaWealthHierarchySynthesis,
  DashaWealthDimensionHierarchy
} from './dashaHierarchyTypes';
import {
  combineTimingHierarchy,
  buildHierarchyEvidence,
  formatEffectLabel
} from './dashaHierarchyUtils';

const WEALTH_DIMENSIONS = [
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
] as const;

function buildWealthSummary(
  md: WealthPeriodTimingActivation,
  ad: WealthPeriodTimingActivation,
  pd: WealthPeriodTimingActivation,
  dimensions: readonly DashaWealthDimensionHierarchy[]
): string {
  const mdPlanet = md.planet ? `${md.planet}` : 'Mahadasha lord';
  const adPlanet = ad.planet ? `${ad.planet}` : 'Antardasha lord';
  const pdPlanet = pd.planet ? `${pd.planet}` : 'Pratyantardasha lord';

  const dimSummaries = dimensions
    .map(
      (d) =>
        `${d.dimension.charAt(0) + d.dimension.slice(1).toLowerCase()}: ${formatEffectLabel(d.overallEffect)}`
    )
    .join(', ');

  return `${mdPlanet} establishes the primary wealth context across 4 dimensions, modified by ${adPlanet} and triggered by ${pdPlanet}: ${dimSummaries}.`;
}

/**
 * Deterministic aggregation layer for Wealth Dasha timing hierarchy (MD > AD > PD).
 * Synthesizes each of the 4 dimensions (Accumulation, Gains, Fortune, Speculation) independently.
 */
export function synthesizeWealthDashaHierarchy(
  md: WealthPeriodTimingActivation,
  ad: WealthPeriodTimingActivation,
  pd: WealthPeriodTimingActivation
): DashaWealthHierarchySynthesis {
  const { evidence, evidenceIds } = buildHierarchyEvidence(
    md.evidenceIds ?? [],
    ad.evidenceIds ?? [],
    pd.evidenceIds ?? []
  );

  const dimensionHierarchies: DashaWealthDimensionHierarchy[] = WEALTH_DIMENSIONS.map((dim) => {
    const key = dim.toLowerCase() as 'accumulation' | 'gains' | 'fortune' | 'speculation';

    const primaryEffect = md.dimensions?.[key] ?? 'INSUFFICIENT_DATA';
    const modifierEffect = ad.dimensions?.[key] ?? 'INSUFFICIENT_DATA';
    const triggerEffect = pd.dimensions?.[key] ?? 'INSUFFICIENT_DATA';

    const { overallEffect, confidence } = combineTimingHierarchy(
      primaryEffect,
      modifierEffect,
      triggerEffect
    );

    return Object.freeze({
      dimension: dim,
      primary: primaryEffect,
      modifier: modifierEffect,
      trigger: triggerEffect,
      overallEffect,
      confidence,
      evidence,
      evidenceIds
    });
  });

  const frozenDimensions = Object.freeze(dimensionHierarchies);
  const summary = buildWealthSummary(md, ad, pd, frozenDimensions);

  return Object.freeze({
    dimensions: frozenDimensions,
    evidence,
    evidenceIds,
    summary
  });
}
