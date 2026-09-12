/**
 * Reasoning View Model & Selectors (P-UI-06)
 *
 * Pure presentation projection over the canonical ProductAnalysis aggregate.
 * Does NOT perform any domain, astrology, D10, D2, Dasha, transit, yoga,
 * strength, scoring, or confidence calculations.
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
  ConclusionStatus,
  ActivationEffect,
  TransitEffect,
  ProductEvidence,
  D10ProductResult
} from './productAnalysisTypes';

export type ReasoningDomain = 'CAREER' | 'WEALTH';

export type VargaRelationship = D10ProductResult['relationship'];

export interface ReasoningHeroViewModel {
  readonly domain: ReasoningDomain;
  readonly title: string;
  readonly status: ConclusionStatus | ProductStatus | string;
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly ascendantSign?: string;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly evidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
  readonly warnings?: readonly ProductWarning[];
}

export interface ReasoningProvenanceViewModel {
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
  readonly source: string;
  readonly isAvailable: boolean;
}

export interface ReasoningEvidenceViewModel {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly source: string;
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
  readonly provenance: ReasoningProvenanceViewModel;
}

export interface ReasoningEvidenceGroupViewModel {
  readonly id: string;
  readonly title: string;
  readonly items: readonly ReasoningEvidenceViewModel[];
}

export interface ReasoningDashaPeriodViewModel {
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

export interface ReasoningDashaViewModel {
  readonly status: ProductAvailability;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly periods: readonly ReasoningDashaPeriodViewModel[];
  readonly md?: ReasoningDashaPeriodViewModel;
  readonly ad?: ReasoningDashaPeriodViewModel;
  readonly pd?: ReasoningDashaPeriodViewModel;
}

export interface ReasoningVargaViewModel {
  readonly chart: 'D10' | 'D2' | string;
  readonly relationship: VargaRelationship;
  readonly statement?: string;
}

export interface ReasoningTransitViewModel {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface ReasoningQualificationViewModel {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  readonly description: string;
}

export interface ReasoningConclusionViewModel {
  readonly headline?: string;
  readonly statement?: string;
  readonly status: ConclusionStatus | ProductStatus | string;
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly integratedSynthesisAvailable: boolean;
  readonly evidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
  readonly provenanceAvailable: boolean;
}

export interface ReasoningChainNodeViewModel {
  readonly id: string;
  readonly label: string;
  readonly type: 'PROMISE' | 'VARGA' | 'ACTIVATION' | 'TRANSIT' | 'SYNTHESIS' | 'EVIDENCE' | string;
  readonly direction: ProductDirection;
  readonly statement: string;
  readonly stepNumber?: number;
}

export interface ReasoningAiViewModel {
  readonly available: boolean;
  readonly status: string;
  readonly statement?: string;
  readonly explanation?: string;
  readonly providerName?: string;
  readonly routingMode?: string;
}

export interface ReasoningDomainOverviewItem {
  readonly domain: ReasoningDomain;
  readonly title: string;
  readonly status: ConclusionStatus | ProductStatus | string;
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence | string;
  readonly availability: ProductAvailability;
  readonly headline?: string;
  readonly statement?: string;
}

export interface ReasoningOverviewViewModel {
  readonly career: ReasoningDomainOverviewItem;
  readonly wealth: ReasoningDomainOverviewItem;
}

export interface ReasoningViewModel {
  readonly domain: ReasoningDomain;
  readonly hero: ReasoningHeroViewModel;
  readonly chain: readonly ReasoningChainNodeViewModel[];
  readonly evidenceGroups: readonly ReasoningEvidenceGroupViewModel[];
  readonly allEvidence: readonly ReasoningEvidenceViewModel[];
  readonly varga: ReasoningVargaViewModel;
  readonly d10: ReasoningVargaViewModel;
  readonly d2?: ReasoningVargaViewModel;
  readonly dasha: ReasoningDashaViewModel;
  readonly transit: ReasoningTransitViewModel;
  readonly qualifications: readonly ReasoningQualificationViewModel[];
  readonly conclusion: ReasoningConclusionViewModel;
  readonly ai?: ReasoningAiViewModel;
  readonly warnings: readonly ProductWarning[];
}

const DASHA_LEVEL_ORDER: Record<string, number> = {
  MD: 0,
  AD: 1,
  PD: 2
};

/**
 * Pure field-copy mapper for ProductEvidence.
 * Performs NO source-based or heuristic inference.
 */
export function mapEvidence(e: ProductEvidence): ReasoningEvidenceViewModel {
  const derivedFromIds = e.derivedFromIds ?? [];
  const provenanceAvailable = Boolean(e.ruleId || derivedFromIds.length > 0);
  return {
    id: e.id,
    title: e.title,
    statement: e.statement,
    direction: e.direction,
    role: e.role,
    source: e.source,
    ruleId: e.ruleId,
    derivedFromIds,
    provenance: {
      ruleId: e.ruleId,
      derivedFromIds,
      source: e.source,
      isAvailable: provenanceAvailable
    }
  };
}

/**
 * Groups evidence primarily by canonical ROLE:
 * PRIMARY, SUPPORTING, CHALLENGING, MODIFIER, REFINEMENT, CONFLICTING, NEUTRAL.
 * A catch-all "OTHER" group ensures zero evidence loss (no item left ungrouped).
 * Empty groups are filtered out.
 */
export function buildEvidenceGroups(
  evidence: readonly ReasoningEvidenceViewModel[]
): readonly ReasoningEvidenceGroupViewModel[] {
  const roleGroups: { id: string; title: string; role: ProductEvidenceRole }[] = [
    { id: 'PRIMARY', title: 'Primary Drivers', role: 'PRIMARY' },
    { id: 'SUPPORTING', title: 'Supporting Factors', role: 'SUPPORTING' },
    { id: 'CHALLENGING', title: 'Challenging Factors', role: 'CHALLENGING' },
    { id: 'MODIFIER', title: 'Modifying Factors', role: 'MODIFIER' },
    { id: 'REFINEMENT', title: 'Refining Influences', role: 'REFINEMENT' },
    { id: 'CONFLICTING', title: 'Conflicting Factors', role: 'CONFLICTING' },
    { id: 'NEUTRAL', title: 'Neutral Factors', role: 'NEUTRAL' }
  ];

  const groups: ReasoningEvidenceGroupViewModel[] = roleGroups.map(({ id, title, role }) => ({
    id,
    title,
    items: evidence.filter((e) => e.role === role)
  }));

  const coveredIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
  const otherItems = evidence.filter((e) => !coveredIds.has(e.id));
  if (otherItems.length > 0) {
    groups.push({
      id: 'OTHER',
      title: 'Additional Factors',
      items: otherItems
    });
  }

  return groups.filter((g) => g.items.length > 0);
}

/**
 * Builds Career-domain ReasoningViewModel
 */
export function buildCareerReasoningViewModel(analysis: ProductAnalysis): ReasoningViewModel {
  const career = analysis.career;
  const status = career.status ?? career.promise.status ?? 'UNAVAILABLE';
  const confidence = career.promise.confidence;
  const strength = career.promise.strength;

  const rawEvidence = career.evidence ?? [];
  const uniqueEvidenceMap = new Map<string, ReasoningEvidenceViewModel>();
  for (const raw of rawEvidence) {
    if (!uniqueEvidenceMap.has(raw.id)) {
      uniqueEvidenceMap.set(raw.id, mapEvidence(raw));
    }
  }
  const allEvidence = Array.from(uniqueEvidenceMap.values());
  const evidenceCount = new Set(rawEvidence.map((e) => e.id)).size;
  const supportingEvidenceCount = new Set(
    allEvidence.filter((e) => e.direction === 'SUPPORT').map((e) => e.id)
  ).size;
  const challengingEvidenceCount = new Set(
    allEvidence.filter((e) => e.direction === 'CHALLENGE').map((e) => e.id)
  ).size;
  const provenanceAvailable = allEvidence.some((e) => e.provenance.isAvailable);

  const hero: ReasoningHeroViewModel = {
    domain: 'CAREER',
    title: 'Career & Vocational Reasoning',
    status,
    strength,
    confidence,
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra,
    evidenceCount,
    supportingEvidenceCount,
    challengingEvidenceCount,
    warnings: analysis.warnings
  };

  const d10Relationship = career.d10.relationship;
  // Spec §37: do not fabricate a missing statement when relationship is UNAVAILABLE
  const d10Statement =
    d10Relationship === 'UNAVAILABLE' && !career.d10.statement
      ? undefined
      : career.d10.statement;

  const d10: ReasoningVargaViewModel = {
    chart: 'D10',
    relationship: d10Relationship,
    statement: d10Statement
  };

  const rawPeriods = career.activation.dasha.periods ?? [];
  const sortedPeriods = [...rawPeriods].sort(
    (a, b) => (DASHA_LEVEL_ORDER[a.level] ?? 99) - (DASHA_LEVEL_ORDER[b.level] ?? 99)
  );

  const periods: ReasoningDashaPeriodViewModel[] = sortedPeriods.map((p) => ({
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

  const dasha: ReasoningDashaViewModel = {
    status: career.activation.dasha.status,
    currentActivation: career.activation.dasha.currentActivation,
    currentPressure: career.activation.dasha.currentPressure,
    periods,
    md: periods.find((p) => p.level === 'MD'),
    ad: periods.find((p) => p.level === 'AD'),
    pd: periods.find((p) => p.level === 'PD')
  };

  const transit: ReasoningTransitViewModel = {
    status: career.activation.transit.status,
    effect: career.activation.transit.effect,
    statement: career.activation.transit.statement
  };

  const qualifications: ReasoningQualificationViewModel[] = (career.qualifications ?? []).map(
    (q) => ({
      type: q.type,
      severity: q.severity,
      description: q.description
    })
  );

  const conclusion: ReasoningConclusionViewModel = {
    headline: career.synthesis?.headline ?? career.promise.headline,
    statement: career.synthesis?.statement ?? career.promise.statement,
    status,
    strength,
    confidence,
    integratedSynthesisAvailable: Boolean(career.synthesis),
    evidenceCount,
    supportingEvidenceCount,
    challengingEvidenceCount,
    provenanceAvailable
  };

  const chain: ReasoningChainNodeViewModel[] = [
    {
      id: 'node_career_promise',
      label: 'Natal Vocational Promise',
      type: 'PROMISE',
      direction: career.promise.strength === 'WEAK' ? 'CHALLENGE' : 'SUPPORT',
      statement:
        career.promise.statement ||
        'Career promise evaluated from natal 10th house, Lagna, and lord strength.'
    },
    {
      id: 'node_career_d10',
      label: 'Dasamsa (D10) Varga Alignment',
      type: 'VARGA',
      direction:
        career.d10.relationship === 'CONFIRMS'
          ? 'SUPPORT'
          : career.d10.relationship === 'CONFLICTS'
            ? 'CHALLENGE'
            : 'NEUTRAL',
      statement:
        career.d10.statement ||
        'Dasamsa relationship evaluated against D1 vocational indicators.'
    },
    {
      id: 'node_career_dasha',
      label: 'Vimshottari Dasha Activation',
      type: 'ACTIVATION',
      direction:
        career.activation.dasha.status === 'AVAILABLE' || career.activation.dasha.status === 'PARTIAL'
          ? 'SUPPORT'
          : 'NEUTRAL',
      statement:
        career.activation.dasha.currentActivation ||
        (periods[0]?.statement ?? 'Planetary timing activation hierarchy.')
    },
    {
      id: 'node_career_transit',
      label: 'Gochara Transit Triggers',
      type: 'TRANSIT',
      direction:
        career.activation.transit.effect === 'CHALLENGE'
          ? 'CHALLENGE'
          : career.activation.transit.effect === 'TRIGGER'
            ? 'SUPPORT'
            : 'NEUTRAL',
      statement:
        career.activation.transit.statement || 'Planetary transits interacting with vocational axes.'
    },
    {
      id: 'node_career_conclusion',
      label: 'Integrated Vocational Conclusion',
      type: 'SYNTHESIS',
      direction: 'SUPPORT',
      statement:
        career.synthesis?.statement ??
        career.promise.statement ??
        'Synthesized vocational reasoning verdict.'
    }
  ];

  const isCareerAiAvailable = analysis.ai?.status === 'AVAILABLE';
  const ai: ReasoningAiViewModel | undefined = analysis.ai
    ? {
        available: isCareerAiAvailable,
        status: analysis.ai.status,
        statement: isCareerAiAvailable ? analysis.ai.conclusion : undefined,
        explanation: isCareerAiAvailable ? analysis.ai.explanation : undefined,
        providerName: analysis.ai.providerInfo?.name,
        routingMode: analysis.ai.providerInfo?.mode
      }
    : undefined;

  return {
    domain: 'CAREER',
    hero,
    chain,
    evidenceGroups: buildEvidenceGroups(allEvidence),
    allEvidence,
    varga: d10,
    d10,
    dasha,
    transit,
    qualifications,
    conclusion,
    ai,
    warnings: analysis.warnings ?? []
  };
}

/**
 * Builds Wealth-domain ReasoningViewModel
 */
export function buildWealthReasoningViewModel(analysis: ProductAnalysis): ReasoningViewModel {
  const wealth = analysis.wealth;
  const status = wealth.overall.status ?? 'UNAVAILABLE';
  const confidence = wealth.overall.confidence;
  const strength = wealth.overall.promise;

  const rawEvidence = wealth.evidence ?? [];
  const uniqueEvidenceMap = new Map<string, ReasoningEvidenceViewModel>();
  for (const raw of rawEvidence) {
    if (!uniqueEvidenceMap.has(raw.id)) {
      uniqueEvidenceMap.set(raw.id, mapEvidence(raw));
    }
  }
  const allEvidence = Array.from(uniqueEvidenceMap.values());
  const evidenceCount = new Set(rawEvidence.map((e) => e.id)).size;
  const supportingEvidenceCount = new Set(
    allEvidence.filter((e) => e.direction === 'SUPPORT').map((e) => e.id)
  ).size;
  const challengingEvidenceCount = new Set(
    allEvidence.filter((e) => e.direction === 'CHALLENGE').map((e) => e.id)
  ).size;
  const provenanceAvailable = allEvidence.some((e) => e.provenance.isAvailable);

  const hero: ReasoningHeroViewModel = {
    domain: 'WEALTH',
    title: 'Wealth & Asset Accumulation Reasoning',
    status,
    strength,
    confidence,
    ascendantSign: analysis.chart.ascendantSign,
    moonSign: analysis.chart.moonSign,
    sunSign: analysis.chart.sunSign,
    moonNakshatra: analysis.chart.moonNakshatra,
    evidenceCount,
    supportingEvidenceCount,
    challengingEvidenceCount,
    warnings: analysis.warnings
  };

  const d2Relationship = wealth.d2.relationship;
  // Spec §37: do not fabricate a missing statement when relationship is UNAVAILABLE
  const d2Statement =
    d2Relationship === 'UNAVAILABLE' && !wealth.d2.statement
      ? undefined
      : wealth.d2.statement;

  const d2: ReasoningVargaViewModel = {
    chart: 'D2',
    relationship: d2Relationship,
    statement: d2Statement
  };

  const rawPeriods = wealth.activation.dasha.periods ?? [];
  const sortedPeriods = [...rawPeriods].sort(
    (a, b) => (DASHA_LEVEL_ORDER[a.level] ?? 99) - (DASHA_LEVEL_ORDER[b.level] ?? 99)
  );

  const periods: ReasoningDashaPeriodViewModel[] = sortedPeriods.map((p) => ({
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

  const dasha: ReasoningDashaViewModel = {
    status: wealth.activation.dasha.status,
    currentActivation: wealth.activation.dasha.statement,
    periods,
    md: periods.find((p) => p.level === 'MD'),
    ad: periods.find((p) => p.level === 'AD'),
    pd: periods.find((p) => p.level === 'PD')
  };

  const transit: ReasoningTransitViewModel = {
    status: wealth.activation.transit.status,
    effect: wealth.activation.transit.effect,
    statement: wealth.activation.transit.statement
  };

  const qualifications: ReasoningQualificationViewModel[] = (wealth.qualifications ?? []).map(
    (q) => ({
      type: q.type,
      severity: q.severity,
      description: q.description
    })
  );

  const conclusion: ReasoningConclusionViewModel = {
    headline: wealth.synthesis?.headline ?? wealth.overall.headline,
    statement: wealth.synthesis?.statement ?? wealth.overall.statement,
    status,
    strength,
    confidence,
    integratedSynthesisAvailable: Boolean(wealth.synthesis),
    evidenceCount,
    supportingEvidenceCount,
    challengingEvidenceCount,
    provenanceAvailable
  };

  const chain: ReasoningChainNodeViewModel[] = [
    {
      id: 'node_wealth_promise',
      label: 'Natal Wealth Promise',
      type: 'PROMISE',
      direction: wealth.overall.promise === 'WEAK' ? 'CHALLENGE' : 'SUPPORT',
      statement:
        wealth.overall.statement ||
        'Wealth potential evaluated across 2nd, 11th, and 9th house indicators.'
    },
    {
      id: 'node_wealth_d2',
      label: 'Hora (D2) Varga Confirmation',
      type: 'VARGA',
      direction:
        wealth.d2.relationship === 'CONFIRMS'
          ? 'SUPPORT'
          : wealth.d2.relationship === 'CONFLICTS'
            ? 'CHALLENGE'
            : 'NEUTRAL',
      statement:
        wealth.d2.statement || 'Hora relationship evaluated against natal financial indicators.'
    },
    {
      id: 'node_wealth_dasha',
      label: 'Temporal Wealth Activation',
      type: 'ACTIVATION',
      direction:
        wealth.activation.dasha.status === 'AVAILABLE' || wealth.activation.dasha.status === 'PARTIAL'
          ? 'SUPPORT'
          : 'NEUTRAL',
      statement:
        wealth.activation.dasha.statement ||
        (periods[0]?.statement ?? 'Planetary timing activation hierarchy.')
    },
    {
      id: 'node_wealth_transit',
      label: 'Gochara Wealth Transits',
      type: 'TRANSIT',
      direction:
        wealth.activation.transit.effect === 'CHALLENGE'
          ? 'CHALLENGE'
          : wealth.activation.transit.effect === 'TRIGGER'
            ? 'SUPPORT'
            : 'NEUTRAL',
      statement:
        wealth.activation.transit.statement || 'Planetary transits affecting financial houses.'
    },
    {
      id: 'node_wealth_conclusion',
      label: 'Integrated Financial Verdict',
      type: 'SYNTHESIS',
      direction: 'SUPPORT',
      statement:
        wealth.synthesis?.statement ??
        wealth.overall.statement ??
        'Synthesized wealth reasoning verdict.'
    }
  ];

  const isWealthAiAvailable = analysis.ai?.status === 'AVAILABLE';
  const ai: ReasoningAiViewModel | undefined = analysis.ai
    ? {
        available: isWealthAiAvailable,
        status: analysis.ai.status,
        statement: isWealthAiAvailable ? analysis.ai.conclusion : undefined,
        explanation: isWealthAiAvailable ? analysis.ai.explanation : undefined,
        providerName: analysis.ai.providerInfo?.name,
        routingMode: analysis.ai.providerInfo?.mode
      }
    : undefined;

  return {
    domain: 'WEALTH',
    hero,
    chain,
    evidenceGroups: buildEvidenceGroups(allEvidence),
    allEvidence,
    varga: d2,
    d10: d2,
    d2,
    dasha,
    transit,
    qualifications,
    conclusion,
    ai,
    warnings: analysis.warnings ?? []
  };
}

/**
 * Pure projection selector: ProductAnalysis -> ReasoningViewModel
 */
export function selectReasoningViewModel(
  analysis: ProductAnalysis,
  domain: ReasoningDomain = 'CAREER'
): ReasoningViewModel {
  if (domain === 'WEALTH') {
    return buildWealthReasoningViewModel(analysis);
  }
  return buildCareerReasoningViewModel(analysis);
}

/**
 * Combined selector for Unified Overall Conclusion panel (spec §26, §50).
 * Projects side-by-side Career and Wealth conclusions independently.
 * Keeps PromiseStrength, ConclusionStatus, ProductConfidence, and Availability as four separate fields.
 * If a domain is UNAVAILABLE, renders "Unavailable" — never fabricates.
 */
export function selectReasoningOverview(analysis: ProductAnalysis): ReasoningOverviewViewModel {
  const careerVm = selectReasoningViewModel(analysis, 'CAREER');
  const wealthVm = selectReasoningViewModel(analysis, 'WEALTH');

  const careerRawStatus = analysis.career?.status ?? analysis.career?.promise?.status;
  const careerStrength = analysis.career?.promise?.strength ?? 'UNAVAILABLE';
  const careerConfidence = analysis.career?.promise?.confidence ?? 'LOW';
  const careerAvail = (analysis.career as { readonly availability?: string } | undefined)?.availability;
  const isCareerUnavailable =
    !analysis.career ||
    careerRawStatus === 'UNAVAILABLE' ||
    careerStrength === 'UNAVAILABLE' ||
    careerAvail === 'UNAVAILABLE';
  const careerStatus = isCareerUnavailable ? 'UNAVAILABLE' : (careerRawStatus ?? 'UNAVAILABLE');
  const careerAvailability: ProductAvailability = isCareerUnavailable
    ? 'UNAVAILABLE'
    : careerRawStatus === 'PARTIAL'
      ? 'PARTIAL'
      : 'AVAILABLE';

  const wealthRawStatus = analysis.wealth?.overall?.status;
  const wealthStrength = analysis.wealth?.overall?.promise ?? 'UNAVAILABLE';
  const wealthConfidence = analysis.wealth?.overall?.confidence ?? 'LOW';
  const wealthAvail = (analysis.wealth as { readonly availability?: string } | undefined)?.availability;
  const isWealthUnavailable =
    !analysis.wealth ||
    wealthRawStatus === 'UNAVAILABLE' ||
    wealthStrength === 'UNAVAILABLE' ||
    wealthAvail === 'UNAVAILABLE';
  const wealthStatus = isWealthUnavailable ? 'UNAVAILABLE' : (wealthRawStatus ?? 'UNAVAILABLE');
  const wealthAvailability: ProductAvailability = isWealthUnavailable
    ? 'UNAVAILABLE'
    : wealthRawStatus === 'PARTIAL'
      ? 'PARTIAL'
      : 'AVAILABLE';

  return {
    career: {
      domain: 'CAREER',
      title: 'Career & Life Path',
      status: careerStatus,
      strength: careerStrength,
      confidence: isCareerUnavailable ? 'UNAVAILABLE' : careerConfidence,
      availability: careerAvailability,
      headline: isCareerUnavailable ? undefined : careerVm.conclusion.headline,
      statement: isCareerUnavailable ? undefined : careerVm.conclusion.statement
    },
    wealth: {
      domain: 'WEALTH',
      title: 'Wealth & Financial Potential',
      status: wealthStatus,
      strength: wealthStrength,
      confidence: isWealthUnavailable ? 'UNAVAILABLE' : wealthConfidence,
      availability: wealthAvailability,
      headline: isWealthUnavailable ? undefined : wealthVm.conclusion.headline,
      statement: isWealthUnavailable ? undefined : wealthVm.conclusion.statement
    }
  };
}

/**
 * Deduplicates evidence items across Career and Wealth domains by evidence ID (§39).
 * Guarantees zero evidence loss while avoiding duplicate counting.
 */
export function selectDedupedEvidence(
  analysis: ProductAnalysis
): readonly ReasoningEvidenceViewModel[] {
  const map = new Map<string, ReasoningEvidenceViewModel>();
  const careerEvidence = analysis.career?.evidence ?? [];
  const wealthEvidence = analysis.wealth?.evidence ?? [];
  for (const raw of [...careerEvidence, ...wealthEvidence]) {
    if (!map.has(raw.id)) {
      map.set(raw.id, mapEvidence(raw));
    }
  }
  return Array.from(map.values());
}
