/**
 * Canonical ProductAnalysis Selectors (P-UI-02)
 *
 * Direct projection accessors.
 * INVARIANT: Must return identical object references (no re-computation/re-creation).
 */

import type {
  ProductAnalysis,
  ProductAnalysisStatus,
  CareerProductAnalysis,
  WealthProductAnalysis,
  ProductDashaState,
  ProductDashaPeriod,
  ReasoningProductAnalysis,
  AiProductState,
  ProductChartSummary,
  ProductBirth,
  ProductWarning,
  ProductEvidence
} from './productAnalysisTypes';

export interface ProductOverviewSlice {
  readonly analysisId: string;
  readonly asOf: string;
  readonly status: ProductAnalysisStatus;
  readonly chart: ProductChartSummary;
  readonly careerPromise: CareerProductAnalysis['promise'];
  readonly wealthOverall: WealthProductAnalysis['overall'];
  readonly dashaSummary?: string;
  readonly warnings: readonly ProductWarning[];
}

/**
 * Returns the career domain projection directly by reference.
 */
export function selectCareer(analysis: ProductAnalysis): CareerProductAnalysis {
  return analysis.career;
}

/**
 * Returns the wealth domain projection directly by reference.
 */
export function selectWealth(analysis: ProductAnalysis): WealthProductAnalysis {
  return analysis.wealth;
}

/**
 * Returns the dasha timing state directly by reference.
 */
export function selectDasha(analysis: ProductAnalysis): ProductDashaState {
  return analysis.dasha;
}

/**
 * Returns the reasoning domain projection directly by reference.
 */
export function selectReasoning(analysis: ProductAnalysis): ReasoningProductAnalysis {
  return analysis.reasoning;
}

/**
 * Returns the AI state directly by reference.
 */
export function selectAi(analysis: ProductAnalysis): AiProductState {
  return analysis.ai;
}

/**
 * Returns the chart summary directly by reference.
 */
export function selectChart(analysis: ProductAnalysis): ProductChartSummary {
  return analysis.chart;
}

/**
 * Returns the birth details projection directly by reference.
 */
export function selectBirth(analysis: ProductAnalysis): ProductBirth {
  return analysis.birth;
}

/**
 * Returns the warnings array directly by reference.
 */
export function selectWarnings(analysis: ProductAnalysis): readonly ProductWarning[] {
  return analysis.warnings;
}

/**
 * Derives the overall status of the analysis.
 */
export function deriveOverallStatus(analysis: ProductAnalysis): ProductAnalysisStatus {
  return analysis.status;
}

/**
 * Returns a high-level overview projection slice.
 */
export function selectOverview(analysis: ProductAnalysis): ProductOverviewSlice {
  return {
    analysisId: analysis.analysisId,
    asOf: analysis.asOf,
    status: analysis.status,
    chart: analysis.chart,
    careerPromise: analysis.career.promise,
    wealthOverall: analysis.wealth.overall,
    dashaSummary: analysis.dasha.summary,
    warnings: analysis.warnings
  };
}

/**
 * Collects all unique evidence items across all domains.
 */
export function selectAllEvidence(analysis: ProductAnalysis): readonly ProductEvidence[] {
  const seen = new Set<string>();
  const all: ProductEvidence[] = [];

  const add = (e: ProductEvidence) => {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      all.push(e);
    }
  };

  for (const e of analysis.career.evidence) {
    add(e);
  }
  for (const e of analysis.wealth.evidence) {
    add(e);
  }

  return all;
}

/**
 * Looks up a single evidence item by ID across all domains.
 */
export function selectEvidenceById(
  analysis: ProductAnalysis,
  id: string
): ProductEvidence | undefined {
  for (const e of analysis.career.evidence) {
    if (e.id === id) return e;
  }
  for (const e of analysis.wealth.evidence) {
    if (e.id === id) return e;
  }
  return undefined;
}

/**
 * Returns a map of requested IDs to their corresponding evidence items.
 */
export function selectEvidenceByIds(
  analysis: ProductAnalysis,
  ids: readonly string[]
): Map<string, ProductEvidence> {
  const idSet = new Set(ids);
  const result = new Map<string, ProductEvidence>();

  for (const e of analysis.career.evidence) {
    if (idSet.has(e.id) && !result.has(e.id)) {
      result.set(e.id, e);
    }
  }
  for (const e of analysis.wealth.evidence) {
    if (idSet.has(e.id) && !result.has(e.id)) {
      result.set(e.id, e);
    }
  }

  return result;
}

/**
 * Returns the current active dasha periods ordered by hierarchy: MD -> AD -> PD.
 * Filters out periods that are undefined.
 */
export function selectDashaHierarchy(analysis: ProductAnalysis): readonly ProductDashaPeriod[] {
  const hierarchy: ProductDashaPeriod[] = [];
  const { current } = analysis.dasha;

  if (current.mahadasha) hierarchy.push(current.mahadasha);
  if (current.antardasha) hierarchy.push(current.antardasha);
  if (current.pratyantardasha) hierarchy.push(current.pratyantardasha);

  return hierarchy;
}

export * from './overviewViewModel';
