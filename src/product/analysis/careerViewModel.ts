/**
 * Career View Model & Selectors (P-UI-04)
 *
 * Pure presentation projection over the canonical ProductAnalysis aggregate.
 * Does NOT perform any domain, astrology, varga, timing, or strength calculations.
 * Reconciles strictly over the canonical types from productAnalysisTypes.ts.
 */

import type {
  ProductAnalysis,
  ProductStatus,
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  ProductAvailability,
  ProductWarning,
  ProductCareerAnalyticalAxes,
  ProductCareerExpressionCoverageSummary,
  ProductCareerOutcomeAnalysis,
  ProductCareerPathwayAnalysis,
  ProductCareerEventTimeline,
  ProductCareerProfessionRanking,
  ProductCareerPatternQualification,
  PromiseStrength,
  ActivationEffect,
  TransitEffect,
  DashaEvidenceTally
} from './productAnalysisTypes';
import type { CareerProfessionAnalysis } from '../../domain/career/careerProfession/careerProfessionTypes';
import {
  getCareerProfessionStatusCopy,
  type CareerProfessionStatus,
  type CareerProfessionStatusCopy
} from './careerQualificationPresentation';
import { selectUnifiedConfidenceProjection } from './confidenceCompletenessProjection';
import {
  buildUserFacingAssessment,
  formatFoundationDirection,
  ENGLISH_USER_FACING_COPY,
  type UserFacingCopyProvider
} from '../life-analysis/userFacingInterpretation';
import {
  buildUserFacingEvidence,
  type UserFacingEvidence
} from '../life-analysis/evidencePresentation';

export interface CareerHeroViewModel {
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly status: ProductStatus;
  readonly confidence: ProductConfidence;
  readonly warnings?: readonly ProductWarning[];
}

export interface CareerPromiseViewModel {
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
  readonly manifestations: readonly string[];
}

export interface CareerExpressionViewModel {
  readonly available: boolean;
  readonly status: 'AVAILABLE' | 'ABSENT' | 'EXECUTED_NO_CANDIDATES';
  readonly coverageSummary?: ProductCareerExpressionCoverageSummary;
  readonly primaryStyle?: string;
  readonly leadershipPotential?: string;
  readonly secondaryTraits?: readonly string[];
  readonly candidates: readonly {
    readonly expressionId: string;
    readonly expressionType: string;
    readonly qualificationStatus: 'QUALIFIED' | 'CANDIDATE' | 'UNRESOLVED' | 'NOT_APPLICABLE';
  }[];
}

export interface CareerD10ViewModel {
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE' | string;
  readonly statement?: string;
}

export interface CareerDashaPeriodViewModel {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly role: ProductEvidenceRole;
  readonly direction: ProductDirection;
  readonly effect: ActivationEffect | string;
  readonly evidenceIds: readonly string[];
  readonly evidence: readonly Pick<UserFacingEvidence, 'id' | 'title' | 'explanation'>[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
  readonly conditionAssessment?: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
  readonly afflictionAssessed?: boolean;
  readonly expressionAnalysisStatus?: import('../../domain/career/careerDasha/careerDashaActivationTypes').CareerDashaExpressionAnalysisStatus;
  readonly diagnostics?: readonly import('../../domain/career/careerDasha/careerDashaActivationTypes').CareerDashaActivationDiagnosticCode[];
  readonly evidenceTally?: DashaEvidenceTally;
}

export interface CareerDashaViewModel {
  readonly status: ProductAvailability;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly periods: readonly CareerDashaPeriodViewModel[];
  readonly md?: CareerDashaPeriodViewModel;
  readonly ad?: CareerDashaPeriodViewModel;
  readonly pd?: CareerDashaPeriodViewModel;
}

export interface CareerTransitViewModel {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface CareerQualificationViewModel {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly description: string;
}

export type CareerEvidenceViewModel = UserFacingEvidence;

export interface CareerConclusionViewModel {
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
}

export interface CareerProfessionCandidateViewModel {
  readonly candidateId: string;
  readonly domain: string;
  readonly family: string;
  readonly basis: string;
  readonly expressionTypes: readonly string[];
  readonly mechanismTypes: readonly string[];
  readonly patternIds: readonly string[];
  readonly d10Status: string;
  readonly evidenceOccurrenceIds: readonly string[];
  readonly semanticIdentityKeys: readonly string[];
  readonly rootIdentityKeys: readonly string[];
  readonly d10Qualification?: {
    readonly status: string;
    readonly direction: string;
    readonly effects: readonly string[];
    readonly evidenceOccurrenceIds: readonly string[];
    readonly counterEvidenceOccurrenceIds: readonly string[];
    readonly rootIdentityKeys: readonly string[];
  };
  readonly evidence: readonly CareerProfessionEvidenceViewModel[];
  readonly domainEvidenceIds: readonly string[];
  readonly relatedEvidenceIds: readonly string[];
  readonly ruleId: string;
}

export interface CareerProfessionEvidenceViewModel {
  readonly evidenceId: string;
  readonly basis: string;
  readonly sourceIds: readonly string[];
  readonly ruleId: string;
  readonly statement: string;
  readonly linkage?: string;
  readonly resolvedMechanismIds?: readonly string[];
  readonly unresolvedMechanismIds?: readonly string[];
}

export interface CareerProfessionViewModel {
  readonly available: boolean;
  readonly status: CareerProfessionStatus;
  readonly statusCopy: CareerProfessionStatusCopy;
  readonly candidates: readonly CareerProfessionCandidateViewModel[];
  readonly unresolvedExpressionTypes: readonly string[];
  readonly mappedTypes: readonly string[];
  readonly missingInputs: readonly string[];
  readonly diagnostics: readonly string[];
  readonly d10Status: string;
  readonly coverageSummary?: ProductCareerExpressionCoverageSummary;
  readonly stageCounts?: CareerProfessionAnalysis['stageCounts'];
  readonly patternQualifications?: readonly ProductCareerPatternQualification[];
  readonly ranking: ProductCareerProfessionRanking;
}

export interface CareerViewModel {
  readonly confidenceCompleteness: import('./productAnalysisTypes').ProductUnifiedConfidenceProjection;
  /** B01: Five orthogonal, evidence-traceable Career axes from the canonical product projection. */
  readonly analyticalAxes?: ProductCareerAnalyticalAxes;
  /** B02: Candidate-only outcome qualification plus explicitly user-reported observed facts. */
  readonly outcomeQualification?: ProductCareerOutcomeAnalysis;
  /** B05: Evidence-bounded comparison of explicit employment/service and independent/business candidates. */
  readonly pathwayPotential?: ProductCareerPathwayAnalysis;
  /** B06: source-backed generic windows and explicit unvalidated event taxonomy. */
  readonly eventTimeline?: ProductCareerEventTimeline;
  readonly eventTimelineDiagnostics: readonly string[];
  readonly hero: CareerHeroViewModel;
  readonly promise: CareerPromiseViewModel;
  readonly expression: CareerExpressionViewModel;
  readonly d10: CareerD10ViewModel;
  readonly dasha: CareerDashaViewModel;
  readonly transit: CareerTransitViewModel;
  readonly qualifications: readonly CareerQualificationViewModel[];
  readonly evidence: readonly CareerEvidenceViewModel[];
  readonly conclusion: CareerConclusionViewModel;
  readonly profession: CareerProfessionViewModel;
  readonly warnings: readonly ProductWarning[];
}

const DASHA_LEVEL_ORDER: Record<string, number> = {
  MD: 0,
  AD: 1,
  PD: 2
};

/**
 * Pure projection selector: ProductAnalysis -> CareerViewModel
 *
 * Invariant: Performs no domain calculations, no strength derivation from D10/transit,
 * and maintains role vs direction independence.
 */
export function selectCareerViewModel(
  analysis: ProductAnalysis,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): CareerViewModel {
  const career = analysis.career;

  const hero: CareerHeroViewModel = {
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra,
    status: analysis.status,
    confidence: career.promise.confidence,
    warnings: analysis.warnings
  };

  const promiseAssessment = buildUserFacingAssessment({
    outcome: career.synthesis?.finalStatus ?? career.promise.status,
    natalDirection: career.synthesis?.natalDirection,
    natalStrength: career.synthesis?.natalStrength ?? career.promise.strength,
    natalPromiseStatus: career.promise.status,
    dashaDirection: career.synthesis?.dashaDirection,
    confidence: career.promise.confidence,
    copy
  });
  const promiseHeadline = career.synthesis?.finalStatus
    ? promiseAssessment.outcomeLabel
    : career.promise.headline &&
        /\b(MIXED|STRONG|WEAK|CHALLENGE|SUPPORT|UNAVAILABLE|INSUFFICIENT_DATA|NOT_ACTIVE|CHALLENGED)\b/
          .test(career.promise.headline)
      ? copy.notAssessed
      : career.promise.headline;
  const promise: CareerPromiseViewModel = {
    strength: career.promise.strength,
    confidence: career.promise.confidence,
    headline: promiseHeadline,
    statement: [
      `${copy.titles['CAREER OUTCOME']}: ${promiseAssessment.outcomeLabel}`,
      `${copy.titles.FOUNDATION}: ${promiseAssessment.foundation.label}`,
      `${copy.titles['DASHA SUPPORT']}: ${formatFoundationDirection(career.synthesis?.dashaDirection, copy)}`,
      `${copy.titles['EVIDENCE CONFIDENCE']}: ${promiseAssessment.confidence.label}`
    ].join('. ') + '.',
    manifestations: career.promise.dominantManifestations ?? []
  };

  const expressionCandidates = career.expression?.candidates ?? [];
  const hasExpressionData = Boolean(
    career.expression &&
    (career.expression.primaryStyle ||
      career.expression.leadershipPotential ||
      (career.expression.secondaryTraits && career.expression.secondaryTraits.length > 0) ||
      expressionCandidates.length > 0)
  );
  const expressionStatus = career.expression?.analysisStatus === 'EXECUTED' && expressionCandidates.length === 0
    ? 'EXECUTED_NO_CANDIDATES' as const
    : hasExpressionData ? 'AVAILABLE' as const : 'ABSENT' as const;

  const expression: CareerExpressionViewModel = {
    available: expressionStatus === 'AVAILABLE',
    status: expressionStatus,
    ...(career.expression?.coverageSummary ? { coverageSummary: career.expression.coverageSummary } : {}),
    primaryStyle: career.expression?.primaryStyle,
    leadershipPotential: career.expression?.leadershipPotential,
    secondaryTraits: career.expression?.secondaryTraits ?? [],
    candidates: expressionCandidates.map(candidate => ({
      expressionId: candidate.expressionId,
      expressionType: candidate.expressionType,
      qualificationStatus: candidate.qualificationStatus
    }))
  };

  const d10: CareerD10ViewModel = {
    relationship: career.d10.relationship,
    statement: career.d10.statement
  };

  const uniqueEvidence = new Map<string, ProductAnalysis['career']['evidence'][number]>();
  for (const item of career.evidence ?? []) {
    if (!uniqueEvidence.has(item.id)) uniqueEvidence.set(item.id, item);
  }
  const evidence: CareerEvidenceViewModel[] = [...uniqueEvidence.values()].map((item) =>
    buildUserFacingEvidence(item, copy)
  );
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));

  const rawPeriods = career.activation.dasha.periods ?? [];
  const sortedPeriods = [...rawPeriods].sort(
    (a, b) => (DASHA_LEVEL_ORDER[a.level] ?? 99) - (DASHA_LEVEL_ORDER[b.level] ?? 99)
  );

  const periods: CareerDashaPeriodViewModel[] = sortedPeriods.map((p) => ({
    level: p.level,
    planet: p.planet,
    role: p.role,
    direction: p.direction,
    effect: p.effect,
    evidenceIds: p.evidenceIds ?? [],
    evidence: [...new Set(p.evidenceIds ?? [])]
      .flatMap(id => {
        const item = evidenceById.get(id);
        return item ? [{ id: item.id, title: item.title, explanation: item.explanation }] : [];
      }),
    statement: p.statement,
    start: p.start,
    end: p.end,
    ...(p.conditionAssessment ? { conditionAssessment: p.conditionAssessment } : {}),
    ...(p.afflictionAssessed !== undefined ? { afflictionAssessed: p.afflictionAssessed } : {}),
    ...(p.expressionAnalysisStatus
      ? { expressionAnalysisStatus: p.expressionAnalysisStatus }
      : {}),
    ...(p.diagnostics ? { diagnostics: [...p.diagnostics] } : {}),
    ...(p.evidenceTally ? { evidenceTally: p.evidenceTally } : {})
  }));

  const dasha: CareerDashaViewModel = {
    status: career.activation.dasha.status,
    currentActivation: career.activation.dasha.currentActivation,
    currentPressure: career.activation.dasha.currentPressure,
    periods,
    md: periods.find((p) => p.level === 'MD'),
    ad: periods.find((p) => p.level === 'AD'),
    pd: periods.find((p) => p.level === 'PD')
  };

  const transit: CareerTransitViewModel = {
    status: career.activation.transit.status,
    effect: career.activation.transit.effect,
    statement: career.activation.transit.statement
  };

  const qualifications: CareerQualificationViewModel[] = (career.qualifications ?? []).map(
    (q) => ({
      type: q.type,
      severity: q.severity,
      description: q.description
    })
  );

  const assessment = buildUserFacingAssessment({
    outcome: career.synthesis?.finalStatus,
    natalDirection: career.synthesis?.natalDirection,
    natalStrength: career.synthesis?.natalStrength,
    dashaDirection: career.synthesis?.dashaDirection,
    timingStatus: career.synthesis?.timingStatus,
    confidence: career.synthesis?.confidence,
    details: [
      { label: 'Final outcome', status: career.synthesis?.finalStatus },
      { label: 'Integrated direction', status: career.synthesis?.finalDirection },
      { label: 'Integrated strength', status: career.synthesis?.finalStrength }
    ],
    copy
  });
  const conclusion: CareerConclusionViewModel = {
    headline: career.synthesis?.headline ?? career.promise.headline,
    statement: assessment.summary,
    confidence: career.promise.confidence,
    integratedSynthesisAvailable: Boolean(
      career.synthesis?.finalStatus ||
      career.synthesis?.finalDirection ||
      career.synthesis?.natalDirection ||
      career.synthesis?.natalStrength ||
      career.synthesis?.dashaDirection ||
      career.synthesis?.timingStatus ||
      career.synthesis?.confidence
    ),
    primaryEvidenceCount: evidence.filter((e) => e.role === 'PRIMARY').length,
    supportingEvidenceCount: evidence.filter((e) => e.direction === 'SUPPORT').length,
    challengingEvidenceCount: evidence.filter((e) => e.direction === 'CHALLENGE').length
  };

  // Map profession analysis from ProductAnalysis
  const profession: CareerProfessionViewModel = (() => {
    const professionData = analysis.career?.profession;
    if (!professionData) {
      return {
        available: false,
        status: 'INSUFFICIENT_DATA',
        statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA'),
        candidates: [],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        diagnostics: ['PROFESSION_ANALYSIS_NOT_PROVIDED'],
        d10Status: 'NOT_PROVIDED',
        ...(career.expression?.coverageSummary
          ? { coverageSummary: career.expression.coverageSummary }
          : {}),
        ranking: {
          policyVersion: 'B04-PROFESSION-RANKING-v1',
          status: 'UNAVAILABLE',
          rankedCandidates: [],
          diagnostics: ['PROFESSION_ANALYSIS_NOT_PROVIDED']
        }
      };
    }

    const candidates: CareerProfessionCandidateViewModel[] = professionData.candidates.map(c => ({
      candidateId: c.candidateId,
      domain: c.domain,
      family: c.family,
      basis: c.basis,
      expressionTypes: c.expressionTypes,
      mechanismTypes: c.mechanismTypes,
      patternIds: c.patternIds,
      d10Status: c.d10Status,
      evidenceOccurrenceIds: c.evidenceOccurrenceIds,
      semanticIdentityKeys: c.semanticIdentityKeys,
      rootIdentityKeys: c.rootIdentityKeys,
      d10Qualification: c.d10Qualification,
      evidence: c.evidence.map(e => ({
        evidenceId: e.evidenceId,
        basis: e.basis,
        sourceIds: e.sourceIds,
        ruleId: e.ruleId,
        statement: e.statement,
        ...(e.linkage ? { linkage: e.linkage } : {}),
        ...(e.resolvedMechanismIds ? { resolvedMechanismIds: e.resolvedMechanismIds } : {}),
        ...(e.unresolvedMechanismIds ? { unresolvedMechanismIds: e.unresolvedMechanismIds } : {})
      })),
      domainEvidenceIds: c.domainEvidenceIds,
      relatedEvidenceIds: c.relatedEvidenceIds,
      ruleId: c.ruleId
    }));

    return {
      available: professionData.available,
      status: professionData.status,
      statusCopy: getCareerProfessionStatusCopy(professionData.status),
      candidates,
      unresolvedExpressionTypes: professionData.unresolvedExpressionTypes,
      mappedTypes: professionData.mappedTypes,
      missingInputs: professionData.missingInputs,
      diagnostics: professionData.diagnostics ?? [],
      d10Status: professionData.d10Status,
      ...(career.expression?.coverageSummary
        ? { coverageSummary: career.expression.coverageSummary }
        : {}),
      stageCounts: professionData.stageCounts,
      ...(career.profession?.patternQualifications !== undefined
        ? { patternQualifications: career.profession.patternQualifications }
        : {}),
      ranking: professionData.ranking
    };
  })();

  return {
    confidenceCompleteness: selectUnifiedConfidenceProjection(analysis),
    analyticalAxes: career.analyticalAxes,
    outcomeQualification: career.outcomeQualification,
    pathwayPotential: career.pathwayPotential,
    eventTimeline: career.eventTimeline,
    eventTimelineDiagnostics: career.eventTimeline?.diagnostics ?? [],
    hero,
    promise,
    expression,
    d10,
    dasha,
    transit,
    qualifications,
    evidence,
    conclusion,
    profession,
    warnings: analysis.warnings ?? []
  };
}
