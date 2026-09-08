/**
 * Overview View Model & Selectors (P-UI-03)
 *
 * Pure projection layer over canonical ProductAnalysis.
 * INVARIANT: Selectors must NOT call any astrological computation engines.
 */

import type {
  ProductAnalysis,
  ProductStatus,
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  ProductEvidence,
  ProductDashaPeriod,
  ProductWarning
} from './productAnalysisTypes';
import { selectDashaHierarchy, selectAllEvidence } from './productAnalysisSelectors';

export interface OverviewOverall {
  readonly status: ProductStatus;
  readonly confidence: ProductConfidence;
  readonly summary: string;
}

export interface OverviewChart {
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
}

export interface OverviewDomain {
  readonly name: string;
  readonly strength: string;
  readonly confidence: ProductConfidence;
  readonly summary: string;
  readonly topEvidence: readonly ProductEvidence[];
}

export interface OverviewDasha {
  readonly md?: ProductDashaPeriod;
  readonly ad?: ProductDashaPeriod;
  readonly pd?: ProductDashaPeriod;
  readonly periods: readonly ProductDashaPeriod[];
  readonly summary?: string;
  readonly availability: boolean;
  readonly currentPeriodLabel: string;
}

export interface OverviewFinding {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly evidenceIds: readonly string[];
}

export interface OverviewQualification {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OverviewViewModel {
  readonly overall: OverviewOverall;
  readonly chart: OverviewChart;
  readonly career: OverviewDomain;
  readonly wealth: OverviewDomain;
  readonly dasha: OverviewDasha;
  readonly findings: readonly OverviewFinding[];
  readonly qualifications: readonly OverviewQualification[];
  readonly totalEvidenceCount: number;
  readonly warnings: readonly ProductWarning[];
}

/**
 * Priority order for the 7 canonical ProductEvidenceRole types:
 * PRIMARY=1, MODIFIER=2, REFINEMENT=3, SUPPORTING=4, CHALLENGING=5, CONFLICTING=6, NEUTRAL=7.
 */
export const EVIDENCE_ROLE_PRIORITY: Record<ProductEvidenceRole, number> = {
  PRIMARY: 1,
  MODIFIER: 2,
  REFINEMENT: 3,
  SUPPORTING: 4,
  CHALLENGING: 5,
  CONFLICTING: 6,
  NEUTRAL: 7
};

/**
 * Selects top evidence items stably sorted by canonical role priority,
 * preserving original index order for items with equal priority.
 */
export function selectTopEvidence(
  evidence: readonly ProductEvidence[],
  limit = 3
): readonly ProductEvidence[] {
  const indexed = evidence.map((e, index) => ({ e, index }));
  indexed.sort((a, b) => {
    const pA = EVIDENCE_ROLE_PRIORITY[a.e.role] ?? 99;
    const pB = EVIDENCE_ROLE_PRIORITY[b.e.role] ?? 99;
    if (pA !== pB) {
      return pA - pB;
    }
    return a.index - b.index;
  });
  return indexed.slice(0, limit).map((item) => item.e);
}

/**
 * Derives overall synthesis confidence based on availability completeness.
 * Checks the 5 canonical availability signals:
 * 1. career.activation.dasha.status === 'UNAVAILABLE'
 * 2. career.d10.relationship === 'UNAVAILABLE'
 * 3. career.activation.transit.status === 'UNAVAILABLE'
 * 4. wealth.activation.dasha.status === 'UNAVAILABLE'
 * 5. wealth.d2.relationship === 'UNAVAILABLE'
 *
 * 0 unavailable -> 'HIGH'
 * 1-2 unavailable -> 'MEDIUM'
 * 3+ unavailable -> 'LOW'
 */
export function deriveOverallConfidence(analysis: ProductAnalysis): ProductConfidence {
  let unavailableCount = 0;
  if (analysis.career.activation.dasha.status === 'UNAVAILABLE') unavailableCount++;
  if (analysis.career.d10.relationship === 'UNAVAILABLE') unavailableCount++;
  if (analysis.career.activation.transit.status === 'UNAVAILABLE') unavailableCount++;
  if (analysis.wealth.activation.dasha.status === 'UNAVAILABLE') unavailableCount++;
  if (analysis.wealth.d2.relationship === 'UNAVAILABLE') unavailableCount++;

  if (unavailableCount === 0) return 'HIGH';
  if (unavailableCount <= 2) return 'MEDIUM';
  return 'LOW';
}

/**
 * Collects and prioritizes key findings across domains.
 * Deduplicates by evidence ID, stably sorts by role priority, takes top 5.
 */
export function selectOverviewFindings(
  analysis: ProductAnalysis,
  limit = 5
): readonly OverviewFinding[] {
  const allEvidence = selectAllEvidence(analysis);
  const prioritized = selectTopEvidence(allEvidence, limit);
  return prioritized.map((e) => ({
    id: e.id,
    title: e.title,
    statement: e.statement,
    direction: e.direction,
    role: e.role,
    evidenceIds: e.derivedFromIds ?? []
  }));
}

/**
 * Projects qualifications across career and wealth domains.
 * Maps ProductQualification to OverviewQualification { id: type, title: type, statement: description, severity }.
 */
export function selectOverviewQualifications(
  analysis: ProductAnalysis
): readonly OverviewQualification[] {
  const careerQuals = analysis.career.qualifications ?? [];
  const wealthQuals = analysis.wealth.qualifications ?? [];
  const combined = [...careerQuals, ...wealthQuals];

  return combined.map((q) => ({
    id: q.type,
    title: q.type,
    statement: q.description,
    severity: q.severity
  }));
}

/**
 * Builds the canonical OverviewViewModel projection over ProductAnalysis.
 */
export function selectOverviewViewModel(analysis: ProductAnalysis): OverviewViewModel {
  const overallSummary =
    analysis.career.synthesis?.statement ||
    analysis.wealth.synthesis?.statement ||
    (analysis.reasoning.primaryConclusions.length > 0
      ? analysis.reasoning.primaryConclusions.map((c) => c.conclusion).join(' ')
      : 'Comprehensive astrological synthesis across career, wealth, and planetary timing.');

  const overall: OverviewOverall = {
    status: analysis.status,
    confidence: deriveOverallConfidence(analysis),
    summary: overallSummary
  };

  const chart: OverviewChart = {
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra
  };

  const careerDomain: OverviewDomain = {
    name: 'Career & Professional Life',
    strength: analysis.career.promise.strength,
    confidence: analysis.career.promise.confidence,
    summary:
      analysis.career.promise.statement ??
      analysis.career.synthesis?.statement ??
      '',
    topEvidence: selectTopEvidence(analysis.career.evidence, 3)
  };

  const wealthDomain: OverviewDomain = {
    name: 'Wealth & Financial Assets',
    strength: analysis.wealth.overall.status,
    confidence: analysis.wealth.overall.confidence,
    summary:
      analysis.wealth.overall.statement ??
      analysis.wealth.synthesis?.statement ??
      '',
    topEvidence: selectTopEvidence(analysis.wealth.evidence, 3)
  };

  const md = analysis.dasha.current.mahadasha;
  const ad = analysis.dasha.current.antardasha;
  const pd = analysis.dasha.current.pratyantardasha;
  const periods = selectDashaHierarchy(analysis);
  const availability = Boolean(md || ad || pd);

  const planetParts = [md?.planet, ad?.planet, pd?.planet].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0
  );
  const currentPeriodLabel =
    planetParts.length > 0 ? planetParts.join(' → ') : 'Timing Unavailable';

  const dasha: OverviewDasha = {
    md,
    ad,
    pd,
    periods,
    summary: analysis.dasha.summary,
    availability,
    currentPeriodLabel
  };

  return {
    overall,
    chart,
    career: careerDomain,
    wealth: wealthDomain,
    dasha,
    findings: selectOverviewFindings(analysis, 5),
    qualifications: selectOverviewQualifications(analysis),
    totalEvidenceCount: selectAllEvidence(analysis).length,
    warnings: analysis.warnings
  };
}
