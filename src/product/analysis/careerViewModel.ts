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
  PromiseStrength,
  ActivationEffect,
  TransitEffect
} from './productAnalysisTypes';

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
  readonly primaryStyle?: string;
  readonly leadershipPotential?: string;
  readonly secondaryTraits?: readonly string[];
}

export interface CareerD10ViewModel {
  readonly available: boolean;
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
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaViewModel {
  readonly available: boolean;
  readonly status: ProductAvailability;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly periods: readonly CareerDashaPeriodViewModel[];
  readonly md?: CareerDashaPeriodViewModel;
  readonly ad?: CareerDashaPeriodViewModel;
  readonly pd?: CareerDashaPeriodViewModel;
}

export interface CareerTransitViewModel {
  readonly available: boolean;
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface CareerQualificationViewModel {
  readonly id: string;
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly description: string;
}

export interface CareerEvidenceViewModel {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly source: string;
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
}

export interface CareerConclusionViewModel {
  readonly headline?: string;
  readonly statement?: string;
  readonly confidence: ProductConfidence;
  readonly primaryEvidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export interface CareerViewModel {
  readonly hero: CareerHeroViewModel;
  readonly promise: CareerPromiseViewModel;
  readonly expression: CareerExpressionViewModel;
  readonly d10: CareerD10ViewModel;
  readonly dasha: CareerDashaViewModel;
  readonly transit: CareerTransitViewModel;
  readonly qualifications: readonly CareerQualificationViewModel[];
  readonly evidence: readonly CareerEvidenceViewModel[];
  readonly conclusion: CareerConclusionViewModel;
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
export function selectCareerViewModel(analysis: ProductAnalysis): CareerViewModel {
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

  const promise: CareerPromiseViewModel = {
    strength: career.promise.strength,
    confidence: career.promise.confidence,
    headline: career.promise.headline,
    statement: career.promise.statement,
    manifestations: career.promise.dominantManifestations ?? []
  };

  const hasExpressionData = Boolean(
    career.expression &&
      (career.expression.primaryStyle ||
        career.expression.leadershipPotential ||
        (career.expression.secondaryTraits && career.expression.secondaryTraits.length > 0))
  );

  const expression: CareerExpressionViewModel = {
    available: hasExpressionData,
    primaryStyle: career.expression?.primaryStyle,
    leadershipPotential: career.expression?.leadershipPotential,
    secondaryTraits: career.expression?.secondaryTraits ?? []
  };

  const d10: CareerD10ViewModel = {
    available: career.d10.relationship !== 'UNAVAILABLE',
    relationship: career.d10.relationship,
    statement: career.d10.statement
  };

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
    statement: p.statement,
    start: p.start,
    end: p.end
  }));

  const dasha: CareerDashaViewModel = {
    available: career.activation.dasha.status === 'AVAILABLE',
    status: career.activation.dasha.status,
    currentActivation: career.activation.dasha.currentActivation,
    currentPressure: career.activation.dasha.currentPressure,
    periods,
    md: periods.find((p) => p.level === 'MD'),
    ad: periods.find((p) => p.level === 'AD'),
    pd: periods.find((p) => p.level === 'PD')
  };

  const transit: CareerTransitViewModel = {
    available: career.activation.transit.status === 'AVAILABLE',
    status: career.activation.transit.status,
    effect: career.activation.transit.effect,
    statement: career.activation.transit.statement
  };

  const qualifications: CareerQualificationViewModel[] = (career.qualifications ?? []).map(
    (q, idx) => ({
      id: `${q.type}_${idx}`,
      type: q.type,
      severity: q.severity,
      description: q.description
    })
  );

  const evidence: CareerEvidenceViewModel[] = (career.evidence ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    statement: e.statement,
    direction: e.direction,
    role: e.role,
    source: e.source,
    ruleId: e.ruleId,
    derivedFromIds: e.derivedFromIds ?? []
  }));

  const conclusion: CareerConclusionViewModel = {
    headline: career.synthesis?.headline ?? career.promise.headline,
    statement: career.synthesis?.statement ?? career.promise.statement,
    confidence: career.promise.confidence,
    primaryEvidenceCount: evidence.filter((e) => e.role === 'PRIMARY').length,
    supportingEvidenceCount: evidence.filter((e) => e.direction === 'SUPPORT').length,
    challengingEvidenceCount: evidence.filter((e) => e.direction === 'CHALLENGE').length
  };

  return {
    hero,
    promise,
    expression,
    d10,
    dasha,
    transit,
    qualifications,
    evidence,
    conclusion,
    warnings: analysis.warnings ?? []
  };
}
