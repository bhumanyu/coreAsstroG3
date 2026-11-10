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
import { createUnavailableWealthFinancialDataSet, validateWealthFinancialDataSet, type WealthFinancialDatum } from '../../domain/wealth/wealthFinancialData';
import { WEALTH_LIFECYCLE_RULE_CATALOGUE, type WealthLifecycleAnalysis } from '../../domain/wealth/wealthLifecycleTypes';
import { selectUnifiedConfidenceProjection } from './confidenceCompletenessProjection';

export interface WealthHeroViewModel {
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly status: ProductStatus;
  readonly confidence: ProductConfidence;
  readonly warnings?: readonly ProductWarning[];
}


export type WealthFinancialPresentationGroup = 'ASTROLOGICAL_INDICATION' | 'FINANCIAL_FACT' | 'UNAVAILABLE';

export interface WealthFinancialItemViewModel {
  readonly id: string;
  readonly concept: WealthFinancialDatum<unknown>['concept'];
  readonly label: string;
  readonly group: WealthFinancialPresentationGroup;
  readonly availability: 'AVAILABLE' | 'UNAVAILABLE';
  readonly sourceClassification: WealthFinancialDatum<unknown>['sourceClassification'];
  readonly value?: unknown;
  readonly currency?: string;
  readonly unit?: string;
  readonly period?: string;
  readonly asOf?: string;
  readonly provenanceLabel: string;
  readonly provenanceDetails: readonly string[];
  readonly unavailableReason?: string;
}

export interface WealthFinancialDataViewModel {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
  readonly data: readonly WealthFinancialDatum<unknown>[];
  readonly items: readonly WealthFinancialItemViewModel[];
  readonly factCount: number;
  readonly indicationCount: number;
  readonly unavailableCount: number;
  readonly classificationValid: boolean;
}

const FINANCIAL_CONCEPT_LABELS: Record<WealthFinancialDatum['concept'], string> = {
  INCOME: 'Income',
  SAVINGS: 'Savings',
  ASSETS: 'Assets',
  ASSET_OWNERSHIP: 'Asset ownership',
  INHERITANCE: 'Inheritance',
  DEBT_LIABILITIES: 'Debt / liabilities',
  CASH_FLOW: 'Cash flow',
  LIQUIDITY: 'Liquidity',
  NET_WORTH: 'Net worth',
  CONSUMPTION_LUXURY: 'Consumption / luxury',
  TRADING_EXPOSURE: 'Trading exposure',
  TRADING_HISTORY: 'Trading history'
};

function projectFinancialDatum(datum: WealthFinancialDatum<unknown>): WealthFinancialItemViewModel {
  const isUnavailable = datum.availability === 'UNAVAILABLE';
  const group: WealthFinancialPresentationGroup = isUnavailable
    ? 'UNAVAILABLE'
    : datum.sourceClassification === 'ASTROLOGICAL_INDICATOR'
      ? 'ASTROLOGICAL_INDICATION'
      : 'FINANCIAL_FACT';
  const provenanceDetails: string[] = [];
  if (datum.userReportedProvenance) {
    provenanceDetails.push('Reported by user');
    provenanceDetails.push('Report reference: ' + datum.userReportedProvenance.reportId);
    provenanceDetails.push('Reported at: ' + datum.userReportedProvenance.reportedAt);
    if (datum.userReportedProvenance.label) provenanceDetails.push('Label: ' + datum.userReportedProvenance.label);
    if (datum.userReportedProvenance.sourceNote) provenanceDetails.push('Source note: ' + datum.userReportedProvenance.sourceNote);
  }
  if (datum.calculationProvenance) {
    provenanceDetails.push('Formula: ' + datum.calculationProvenance.formulaId + ' (' + datum.calculationProvenance.formulaVersion + ')');
    provenanceDetails.push(datum.calculationProvenance.formulaDescription);
    provenanceDetails.push('Calculated at: ' + datum.calculationProvenance.calculatedAt);
    provenanceDetails.push('Input references: ' + datum.calculationProvenance.inputs.map(item => item.concept + ' [' + item.datumId + ']').join(', '));
  }
  if (datum.connectedSourceProvenance) {
    provenanceDetails.push('Provider: ' + datum.connectedSourceProvenance.providerId);
    provenanceDetails.push('Source type: ' + datum.connectedSourceProvenance.sourceType);
    provenanceDetails.push('Retrieved at: ' + datum.connectedSourceProvenance.retrievedAt);
    if (datum.connectedSourceProvenance.externalReference) provenanceDetails.push('External reference: ' + datum.connectedSourceProvenance.externalReference);
  }
  if (datum.sourceClassification === 'ASTROLOGICAL_INDICATOR') {
    provenanceDetails.push('Chart-derived indication; not a real-world financial record.');
  }
  return {
    id: datum.id,
    concept: datum.concept,
    label: FINANCIAL_CONCEPT_LABELS[datum.concept],
    group,
    availability: datum.availability,
    sourceClassification: datum.sourceClassification,
    ...(datum.availability === 'AVAILABLE' ? { value: datum.value } : {}),
    ...(datum.currency ? { currency: datum.currency } : {}),
    ...(datum.unit ? { unit: datum.unit } : {}),
    ...(datum.period ? { period: datum.period } : {}),
    ...(datum.asOf ? { asOf: datum.asOf } : {}),
    provenanceLabel: datum.sourceClassification.replaceAll('_', ' '),
    provenanceDetails,
    ...(datum.unavailableReason ? { unavailableReason: datum.unavailableReason } : {})
  };
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

export interface WealthLifecycleViewModel {
  readonly status: 'CANDIDATES_AVAILABLE' | 'CONDITIONAL' | 'PARTIAL' | 'UNRESOLVED' | 'INSUFFICIENT' | 'BLOCKED';
  readonly candidateCount: number;
  readonly candidates: readonly { readonly id: string; readonly type: string; readonly status: string; readonly timingLabel: string; readonly limitations: readonly string[] }[];
  readonly diagnostics: readonly { readonly code: string; readonly eventType?: string; readonly message: string }[];
  readonly observedFactCount: number;
  readonly guarantee: 'NONE';
  readonly actualFinancialEventsInferred: false;
  readonly finalAuthority: 'CW-05';
  readonly statement: string;
}
export interface WealthSpeculativePropensityViewModel {
  readonly status: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'MIXED' | 'CHALLENGED' | 'INSUFFICIENT_DATA';
  readonly label: string;
  readonly description?: string;
  readonly source: 'ASTROLOGICAL_INDICATION';
  readonly adviceAvailable: false;
}
export interface WealthRiskAndSuitabilityViewModel {
  readonly actualExposure: 'AVAILABLE' | 'UNAVAILABLE';
  readonly tradingHistory: 'AVAILABLE' | 'UNAVAILABLE';
  readonly suitability: 'UNAVAILABLE';
  readonly suitabilityReason: string;
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
  readonly confidenceCompleteness: import('./productAnalysisTypes').ProductUnifiedConfidenceProjection;
  readonly hero: WealthHeroViewModel;
  readonly overall: WealthOverallViewModel;
  readonly financialData: WealthFinancialDataViewModel;
  readonly lifecycle: WealthLifecycleViewModel;
  readonly dimensions: WealthDimensionsViewModel;
  readonly d2: WealthD2ViewModel;
  readonly dasha: WealthDashaViewModel;
  readonly transit: WealthTransitViewModel;
  readonly speculativePropensity: WealthSpeculativePropensityViewModel;
  readonly riskAndSuitability: WealthRiskAndSuitabilityViewModel;
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
const PROHIBITED_PROPENSITY_DESCRIPTION = /\b(?:buy|sell|hold|options?|leverage|margin|short(?:ing)?|long(?:ing)?|position\s*size|instrument|expected\s+return|profit|loss|stop\s*loss|target\s*price|portfolio\s+allocation|recommend(?:ation|ed)?|trade\s+signal)\b/i;

function sanitizePropensityDescription(value?: string): string | undefined {
  if (!value?.trim() || PROHIBITED_PROPENSITY_DESCRIPTION.test(value)) return undefined;
  return value.trim();
}

function projectWealthLifecycle(source?: WealthLifecycleAnalysis): WealthLifecycleViewModel {
  const releaseRuleAvailable = WEALTH_LIFECYCLE_RULE_CATALOGUE.some(
    rule => rule.releaseEnabled && rule.validationStatus === 'VALIDATED'
  );
  const releaseBlocked = !releaseRuleAvailable;
  const candidates = (source?.candidateWindows ?? []).map(candidate => ({
    id: candidate.candidateId,
    type: candidate.eventType.replaceAll('_', ' '),
    status: candidate.status,
    timingLabel: candidate.timing.type === 'DASHA_PERIOD_WINDOW' && candidate.timing.start && candidate.timing.end
      ? String(candidate.timing.level ?? 'DASHA') + ': ' + candidate.timing.start + ' to ' + candidate.timing.end + ' (source period only)'
      : 'Untimed candidate window',
    limitations: candidate.limitations
  }));
  return {
    status: source?.status ?? (releaseBlocked ? 'BLOCKED' : 'INSUFFICIENT'),
    candidateCount: candidates.length,
    candidates,
    diagnostics: (source?.diagnostics ?? (releaseBlocked ? WEALTH_LIFECYCLE_RULE_CATALOGUE.filter(rule => !rule.releaseEnabled || rule.validationStatus !== 'VALIDATED').map(rule => ({
      code: 'UNVALIDATED_EVENT_RULES',
      eventType: rule.eventType,
      message: rule.eventType + ' is not enabled: ' + rule.validationGap
    })) : [])).map(diagnostic => ({ code: diagnostic.code, eventType: diagnostic.eventType, message: diagnostic.message })),
    observedFactCount: source?.observedFinancialFactReportIds.length ?? 0,
    guarantee: 'NONE',
    actualFinancialEventsInferred: false,
    finalAuthority: 'CW-05',
    statement: source?.statement ?? (releaseBlocked
      ? 'C04 lifecycle candidate generation is blocked: no event-specific rule has passed its independent validation and release gate. No candidate window is emitted. C01 financial facts remain separate, and CW-05 remains the final Wealth authority.'
      : 'C04 lifecycle analysis is unavailable. No financial event is inferred; CW-05 remains the final Wealth authority.')
  };
}
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

  const sourceFinancialData = wealth.financialData ?? createUnavailableWealthFinancialDataSet();
  const isValidFinancialData = validateWealthFinancialDataSet(sourceFinancialData);
  const normalizedFinancialData = isValidFinancialData ? sourceFinancialData : createUnavailableWealthFinancialDataSet('Financial source data failed C01 validation.');
  const financialItems = normalizedFinancialData.data.map(projectFinancialDatum);
  const financialData: WealthFinancialDataViewModel = {
    status: normalizedFinancialData.status,
    data: normalizedFinancialData.data,
    items: financialItems,
    factCount: financialItems.filter(item => item.group === 'FINANCIAL_FACT').length,
    indicationCount: financialItems.filter(item => item.group === 'ASTROLOGICAL_INDICATION').length,
    unavailableCount: financialItems.filter(item => item.group === 'UNAVAILABLE').length,
    classificationValid: isValidFinancialData
  };
  const lifecycle = projectWealthLifecycle(wealth.lifecycle);

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
    houseLabel: '2nd House (Astrological accumulation indication)',
    status: wealth.dimensions.accumulation.status,
    statement: wealth.dimensions.accumulation.statement
  };

  const gains: WealthDimensionItemViewModel = {
    id: 'GAINS',
    label: 'Gains & Inflow',
    houseLabel: '11th House (Astrological gains indication)',
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
    houseLabel: '5th House (Astrological speculation indication)',
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

  // D2 availability is owned by the canonical product analysis mapper (A08/C02B).
  // This view model only projects that declaration; it must not independently gate or upgrade it.
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

  const rawPropensityStatus = wealth.speculativePropensity?.status ?? 'INSUFFICIENT_DATA';
  const allowedPropensityStatuses = ['VERY_STRONG', 'STRONG', 'MODERATE', 'MIXED', 'CHALLENGED', 'INSUFFICIENT_DATA'] as const;
  const propensityStatus = (allowedPropensityStatuses as readonly string[]).includes(rawPropensityStatus)
    ? rawPropensityStatus as typeof allowedPropensityStatuses[number]
    : 'INSUFFICIENT_DATA';
  const propensityLabels = {
    VERY_STRONG: 'Very strong indication',
    STRONG: 'Strong indication',
    MODERATE: 'Moderate indication',
    MIXED: 'Mixed indication',
    CHALLENGED: 'Challenged indication',
    INSUFFICIENT_DATA: 'Insufficient data'
  } as const;
  const speculativePropensity: WealthSpeculativePropensityViewModel = {
    status: propensityStatus,
    label: propensityLabels[propensityStatus],
    // Persisted ProductAnalysis content is untrusted too; fail closed at the final presentation boundary.
    description: sanitizePropensityDescription(wealth.speculativePropensity?.description),
    source: 'ASTROLOGICAL_INDICATION',
    adviceAvailable: false
  };
  const hasExplicitFinancialSource = (concept: 'TRADING_EXPOSURE' | 'TRADING_HISTORY'): boolean =>
    normalizedFinancialData.data.some((datum) =>
      datum.concept === concept &&
      datum.availability === 'AVAILABLE' &&
      (datum.sourceClassification === 'USER_REPORTED_FINANCIAL_FACT' ||
        datum.sourceClassification === 'CONNECTED_FINANCIAL_SOURCE')
    );
  // Availability is projected only from validated C01 source facts; never trust a precomputed flag.
  const riskAndSuitability: WealthRiskAndSuitabilityViewModel = {
    actualExposure: hasExplicitFinancialSource('TRADING_EXPOSURE') ? 'AVAILABLE' : 'UNAVAILABLE',
    tradingHistory: hasExplicitFinancialSource('TRADING_HISTORY') ? 'AVAILABLE' : 'UNAVAILABLE',
    suitability: 'UNAVAILABLE',
    suitabilityReason: 'Suitability requires a separately governed model; neither chart-derived propensity nor factual exposure data is a suitability assessment.'
  };

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
    confidenceCompleteness: selectUnifiedConfidenceProjection(analysis),
    hero,
    overall,
    financialData,
    lifecycle,
    dimensions,
    d2,
    dasha,
    transit,
    speculativePropensity,
    riskAndSuitability,
    qualifications,
    evidence,
    conclusion,
    warnings: analysis.warnings ?? []
  };
}
