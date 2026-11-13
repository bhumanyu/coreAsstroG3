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
  ProductEvidenceRole,
  ProductEvidence,
  ProductWarning
} from './productAnalysisTypes';
import { selectAllEvidence } from './productAnalysisSelectors';
import { selectUnifiedConfidenceProjection } from './confidenceCompletenessProjection';
import {
  buildUserFacingAssessment,
  combineUserFacingAssessments,
  ENGLISH_USER_FACING_COPY,
  type UserFacingCopyProvider,
  type UserFacingAssessment
} from '../life-analysis/userFacingInterpretation';
import {
  buildUserFacingEvidence,
  type UserFacingEvidence
} from '../life-analysis/evidencePresentation';

export interface OverviewOverall {
  readonly status: ProductStatus;
  readonly confidence: ProductConfidence;
  readonly summary: string;
  readonly assessment: UserFacingAssessment;
}

export interface OverviewChart {
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
}

export interface OverviewDomain {
  readonly strength: string;
  readonly status?: string;
  readonly confidence: ProductConfidence;
  readonly summary: string;
  readonly assessment: UserFacingAssessment;
  readonly topEvidence: readonly UserFacingEvidence[];
}

export interface OverviewFinding extends UserFacingEvidence {
  readonly evidenceIds: readonly string[];
}

export interface OverviewQualification {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OverviewViewModel {
  readonly confidenceCompleteness: import('./productAnalysisTypes').ProductUnifiedConfidenceProjection;
  readonly overall: OverviewOverall;
  readonly chart: OverviewChart;
  readonly career: OverviewDomain;
  readonly wealth: OverviewDomain;
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
  limit = 3,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): readonly UserFacingEvidence[] {
  const indexed = evidence.map((e, index) => ({ e, index }));
  indexed.sort((a, b) => {
    const pA = EVIDENCE_ROLE_PRIORITY[a.e.role] ?? 99;
    const pB = EVIDENCE_ROLE_PRIORITY[b.e.role] ?? 99;
    if (pA !== pB) {
      return pA - pB;
    }
    return a.index - b.index;
  });
  return indexed
    .slice(0, limit)
    .map((item) => buildUserFacingEvidence(item.e, copy));
}

/**
 * Derives overall synthesis confidence based on availability completeness.
 *
 * NOTE: This measures "ANALYSIS COMPLETENESS" (availability signals of sub-analyses
 * such as dasha, varga, and transit), NOT astrological truth or certainty.
 *
 * Checks the 4 validated, confidence-bearing availability signals:
 * 1. career.activation.dasha.status === 'UNAVAILABLE'
 * 2. career.d10.relationship === 'UNAVAILABLE'
 * 3. career.activation.transit.status === 'UNAVAILABLE'
 * 4. wealth.activation.dasha.status === 'UNAVAILABLE'
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
  // D2 is intentionally gated as UNAVAILABLE and is not a required confidence layer.

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
  limit = 5,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): readonly OverviewFinding[] {
  const allEvidence = selectAllEvidence(analysis);
  const prioritized = selectTopEvidence(allEvidence, limit, copy);
  return prioritized.map((e) => ({ ...e, evidenceIds: e.derivedFromIds }));
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
export function selectOverviewViewModel(
  analysis: ProductAnalysis,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): OverviewViewModel {
  const careerAssessment = buildUserFacingAssessment({
    outcome: analysis.career.synthesis?.finalStatus,
    natalDirection: analysis.career.synthesis?.natalDirection,
    natalStrength: analysis.career.synthesis?.natalStrength,
    dashaDirection: analysis.career.synthesis?.dashaDirection,
    timingStatus: analysis.career.synthesis?.timingStatus,
    confidence: analysis.career.synthesis?.confidence,
    details: [
      { label: 'Final outcome', status: analysis.career.synthesis?.finalStatus },
      { label: 'Integrated direction', status: analysis.career.synthesis?.finalDirection },
      { label: 'Integrated strength', status: analysis.career.synthesis?.finalStrength }
    ],
    copy
  });
  const wealthAssessment = buildUserFacingAssessment({
    overallStatus: analysis.wealth.synthesis?.overallStatus,
    natalStrength: analysis.wealth.synthesis?.natalStrength,
    natalPromiseStatus: analysis.wealth.synthesis?.promiseStatus,
    dashaDirection: analysis.wealth.synthesis?.dashaDirection,
    timingStatus: analysis.wealth.synthesis?.timingStatus,
    confidence: analysis.wealth.synthesis?.confidence,
    details: Object.entries(analysis.wealth.synthesis?.dimensionStatuses ?? {}).map(
      ([label, status]) => ({ label, status })
    ),
    copy
  });
  const overallAssessment = combineUserFacingAssessments(careerAssessment, wealthAssessment, copy);

  const overall: OverviewOverall = {
    status: analysis.status,
    confidence: deriveOverallConfidence(analysis),
    summary: overallAssessment.summary,
    assessment: overallAssessment
  };

  const chart: OverviewChart = {
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra
  };

  const careerDomain: OverviewDomain = {
    strength: analysis.career.promise.strength,
    status: analysis.career.status ?? analysis.career.promise.status,
    confidence: analysis.career.promise.confidence,
    summary: careerAssessment.summary,
    assessment: careerAssessment,
    topEvidence: selectTopEvidence(analysis.career.evidence, 3, copy)
  };

  const wealthDomain: OverviewDomain = {
    strength: analysis.wealth.overall.promise,
    status: analysis.wealth.overall.status,
    confidence: analysis.wealth.overall.confidence,
    summary: wealthAssessment.summary,
    assessment: wealthAssessment,
    topEvidence: selectTopEvidence(analysis.wealth.evidence, 3, copy)
  };

  return {
    confidenceCompleteness: selectUnifiedConfidenceProjection(analysis),
    overall,
    chart,
    career: careerDomain,
    wealth: wealthDomain,
    findings: selectOverviewFindings(analysis, 5, copy),
    qualifications: selectOverviewQualifications(analysis),
    totalEvidenceCount: selectAllEvidence(analysis).length,
    warnings: analysis.warnings
  };
}
