/**
 * Wealth View Model & Selectors (P-UI-05)
 *
 * Pure presentation projection over the canonical ProductAnalysis aggregate.
 * Does NOT perform any domain, astrology, D2, Dasha, transit, speculative-risk,
 * or strength calculations. Reconciles strictly over the canonical types
 * from productAnalysisTypes.ts.
 */

import type {
  ProductAnalysis,
  ProductStatus,
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  ProductAvailability,
  ProductWarning,
  PromiseStrength,
  ConclusionStatus,
  ActivationEffect,
  TransitEffect
} from './productAnalysisTypes';

export interface WealthHeroViewModel {
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly status: ProductStatus;
  readonly confidence: ProductConfidence;
  readonly warnings?: readonly ProductWarning[];
}

export interface WealthOverallViewModel {
  readonly promise: PromiseStrength | string;
  readonly status: ConclusionStatus | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
}

export interface WealthDimensionItemViewModel {
  readonly id: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly label: string;
  readonly houseLabel: string;
  readonly status: ConclusionStatus | string;
  readonly statement?: string;
}

export interface WealthDimensionsViewModel {
  readonly accumulation: WealthDimensionItemViewModel;
  readonly gains: WealthDimensionItemViewModel;
  readonly fortune: WealthDimensionItemViewModel;
  readonly speculation: WealthDimensionItemViewModel;
  readonly items: readonly WealthDimensionItemViewModel[];
}

export interface WealthD2ViewModel {
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE' | string;
  readonly statement?: string;
}

export interface WealthDashaPeriodViewModel {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly role: ProductEvidenceRole;
  readonly direction: ProductDirection;
  readonly effect: ActivationEffect | string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface WealthDashaViewModel {
  readonly status: ProductAvailability;
  readonly currentActivation?: string;
  readonly periods: readonly WealthDashaPeriodViewModel[];
  readonly md?: WealthDashaPeriodViewModel;
  readonly ad?: WealthDashaPeriodViewModel;
  readonly pd?: WealthDashaPeriodViewModel;
}

export interface WealthTransitViewModel {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface WealthSpeculativeRiskViewModel {
  readonly level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'UNAVAILABLE' | string;
  readonly description?: string;
}

export interface WealthQualificationViewModel {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  readonly description: string;
}

export interface WealthEvidenceViewModel {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly source: string;
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
}

export interface WealthConclusionViewModel {
  readonly headline?: string;
  readonly statement?: string;
  readonly confidence: ProductConfidence;
  readonly integratedSynthesisAvailable: boolean;
  /**
   * Count of evidence items on the role dimension where role is PRIMARY.
   * Note: Role and direction are orthogonal dimensions. A PRIMARY item that
   * also has direction CHALLENGE will be counted in both primaryEvidenceCount
   * and challengingEvidenceCount.
   */
  readonly primaryEvidenceCount: number;
  /**
   * Count of evidence items on the direction dimension where direction is SUPPORT.
   * Note: Orthogonal to primaryEvidenceCount.
   */
  readonly supportingEvidenceCount: number;
  /**
   * Count of evidence items on the direction dimension where direction is CHALLENGE.
   * Note: Orthogonal to primaryEvidenceCount.
   */
  readonly challengingEvidenceCount: number;
  // Aliases for consistency with spec terminology
  readonly primaryDriverCount: number;
  readonly supportingFactorCount: number;
  readonly challengingFactorCount: number;
}

export interface WealthViewModel {
  readonly hero: WealthHeroViewModel;
  readonly overall: WealthOverallViewModel;
  readonly dimensions: WealthDimensionsViewModel;
  readonly d2: WealthD2ViewModel;
  readonly dasha: WealthDashaViewModel;
  readonly transit: WealthTransitViewModel;
  readonly speculativeRisk?: WealthSpeculativeRiskViewModel;
  readonly qualifications: readonly WealthQualificationViewModel[];
  readonly evidence: readonly WealthEvidenceViewModel[];
  readonly conclusion: WealthConclusionViewModel;
  readonly warnings: readonly ProductWarning[];
}

export const DASHA_LEVEL_ORDER: Record<string, number> = {
  MD: 0,
  AD: 1,
  PD: 2
};

/**
 * Pure projection selector: ProductAnalysis -> WealthViewModel
 *
 * Invariant: Performs no domain calculations, no strength derivation from D2/transit,
 * and maintains role vs direction independence.
 */
export function selectWealthViewModel(analysis: ProductAnalysis): WealthViewModel {
  const wealth = analysis.wealth;

  const hero: WealthHeroViewModel = {
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra,
    status: analysis.status,
    confidence: wealth.overall.confidence,
    warnings: analysis.warnings
  };

  const overall: WealthOverallViewModel = {
    promise: wealth.overall.promise,
    status: wealth.overall.status,
    confidence: wealth.overall.confidence,
    headline: wealth.overall.headline,
    statement: wealth.overall.statement
  };

  const accumulation: WealthDimensionItemViewModel = {
    id: 'ACCUMULATION',
    label: 'Accumulation',
    houseLabel: '2nd House (Liquid Capital & Assets)',
    status: wealth.dimensions.accumulation.status,
    statement: wealth.dimensions.accumulation.statement
  };

  const gains: WealthDimensionItemViewModel = {
    id: 'GAINS',
    label: 'Gains & Inflow',
    houseLabel: '11th House (Income & Profit Streams)',
    status: wealth.dimensions.gains.status,
    statement: wealth.dimensions.gains.statement
  };

  const fortune: WealthDimensionItemViewModel = {
    id: 'FORTUNE',
    label: 'Fortune & Luck',
    houseLabel: '9th House (Lakshmi Sthana & Prosperity)',
    status: wealth.dimensions.fortune.status,
    statement: wealth.dimensions.fortune.statement
  };

  const speculation: WealthDimensionItemViewModel = {
    id: 'SPECULATION',
    label: 'Speculation & Venture',
    houseLabel: '5th House (Risk Capital & Investments)',
    status: wealth.dimensions.speculation.status,
    statement: wealth.dimensions.speculation.statement
  };

  const dimensions: WealthDimensionsViewModel = {
    accumulation,
    gains,
    fortune,
    speculation,
    items: [accumulation, gains, fortune, speculation]
  };

  const d2: WealthD2ViewModel = {
    relationship: wealth.d2.relationship,
    statement: wealth.d2.statement
  };

  const rawPeriods = wealth.activation.dasha.periods ?? [];
  const sortedPeriods = [...rawPeriods].sort(
    (a, b) => (DASHA_LEVEL_ORDER[a.level] ?? 99) - (DASHA_LEVEL_ORDER[b.level] ?? 99)
  );

  const periods: WealthDashaPeriodViewModel[] = sortedPeriods.map((p) => ({
    level: p.level,
    planet: p.planet,
    role: p.role,
    direction: p.direction,
    effect: p.effect,
    evidenceIds: p.evidenceIds ?? [],
    statement: p.statement,
    start: p.start,
    end: p.end
  }));

  const dasha: WealthDashaViewModel = {
    status: wealth.activation.dasha.status,
    currentActivation: wealth.activation.dasha.statement,
    periods,
    md: periods.find((p) => p.level === 'MD'),
    ad: periods.find((p) => p.level === 'AD'),
    pd: periods.find((p) => p.level === 'PD')
  };

  const transit: WealthTransitViewModel = {
    status: wealth.activation.transit.status,
    effect: wealth.activation.transit.effect,
    statement: wealth.activation.transit.statement
  };

  const speculativeRisk: WealthSpeculativeRiskViewModel | undefined = wealth.speculativeRisk
    ? {
        level: wealth.speculativeRisk.level,
        description: wealth.speculativeRisk.description
      }
    : undefined;

  const qualifications: WealthQualificationViewModel[] = (wealth.qualifications ?? []).map(
    (q) => ({
      type: q.type,
      severity: q.severity,
      description: q.description
    })
  );

  const evidence: WealthEvidenceViewModel[] = (wealth.evidence ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    statement: e.statement,
    direction: e.direction,
    role: e.role,
    source: e.source,
    ruleId: e.ruleId,
    derivedFromIds: e.derivedFromIds ?? []
  }));

  const primaryCount = evidence.filter((e) => e.role === 'PRIMARY').length;
  const supportingCount = evidence.filter((e) => e.direction === 'SUPPORT').length;
  const challengingCount = evidence.filter((e) => e.direction === 'CHALLENGE').length;

  const conclusion: WealthConclusionViewModel = {
    headline: wealth.synthesis?.headline ?? wealth.overall.headline,
    statement: wealth.synthesis?.statement ?? wealth.overall.statement,
    confidence: wealth.overall.confidence,
    integratedSynthesisAvailable: Boolean(wealth.synthesis),
    primaryEvidenceCount: primaryCount,
    supportingEvidenceCount: supportingCount,
    challengingEvidenceCount: challengingCount,
    primaryDriverCount: primaryCount,
    supportingFactorCount: supportingCount,
    challengingFactorCount: challengingCount
  };

  return {
    hero,
    overall,
    dimensions,
    d2,
    dasha,
    transit,
    speculativeRisk,
    qualifications,
    evidence,
    conclusion,
    warnings: analysis.warnings ?? []
  };
}
