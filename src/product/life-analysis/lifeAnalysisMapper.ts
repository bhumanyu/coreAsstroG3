import type { DomainInterpretation } from '../../domain/interpretation';
import type {
  LifeAnalysis,
  SharedTimingActivation
} from '../../domain/synthesis';
import type {
  LifeAnalysisViewModel,
  LifeAnalysisOverallViewModel,
  LifeAnalysisDomainSummaryViewModel,
  LifeAnalysisTimingViewModel,
  LifeAnalysisConflictViewModel,
  LifeAnalysisEvidenceViewModel,
  LifeAnalysisCompletenessViewModel,
  LifeAnalysisCareerDetailViewModel,
  LifeAnalysisWealthDetailViewModel
} from './lifeAnalysisTypes';
import { deepFreeze } from '../../ai/context/deepFreeze';

export function formatDomainDisplayName(domain: string): string {
  switch (domain) {
    case 'CAREER':
      return 'Career';
    case 'WEALTH':
      return 'Wealth';
    case 'MARRIAGE':
      return 'Marriage';
    case 'CHILDREN':
      return 'Children';
    case 'PROPERTY':
      return 'Property';
    case 'HEALTH':
      return 'Health';
    case 'SPIRITUALITY':
      return 'Spirituality';
    default:
      return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  }
}

export function formatCompletenessLabel(
  overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
): string {
  switch (overall) {
    case 'COMPLETE':
      return 'Complete Analysis';
    case 'PARTIAL':
      return 'Partial Analysis';
    case 'INSUFFICIENT_DATA':
      return 'Insufficient Data';
    default:
      return 'Unknown';
  }
}

export function mapProductStatus(
  overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
): 'READY' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
  if (overall === 'COMPLETE') {
    return 'READY';
  }
  if (overall === 'PARTIAL') {
    return 'PARTIAL';
  }
  return 'INSUFFICIENT_DATA';
}

function formatSharedTimingTitle(st: SharedTimingActivation): string {
  if (st.source === 'DASHA') {
    const level = st.level
      ? st.level.charAt(0).toUpperCase() + st.level.slice(1).toLowerCase()
      : 'Dasha';
    return st.periodKey ? `${level} (${st.periodKey})` : `${level} Activation`;
  }
  return st.periodKey ? `Transit (${st.periodKey})` : 'Active Transits';
}

function isTimingConflict(st: SharedTimingActivation): boolean {
  const effects = Object.values(st.effects);
  if (effects.length <= 1) {
    return false;
  }
  const first = effects[0];
  return effects.some((e) => e !== first);
}

export function buildLifeAnalysisViewModel(
  analysis: LifeAnalysis,
  career: DomainInterpretation,
  wealth: DomainInterpretation,
  evidence: readonly LifeAnalysisEvidenceViewModel[]
): LifeAnalysisViewModel {
  const status = mapProductStatus(analysis.dataCompleteness.overall);

  const overall: LifeAnalysisOverallViewModel = {
    status: analysis.conclusion.status,
    statement: analysis.conclusion.statement,
    strongestDomainNames: analysis.strongestDomains.map(formatDomainDisplayName),
    challengedDomainNames: analysis.challengedDomains.map(formatDomainDisplayName)
  };

  const domainSummaries: LifeAnalysisDomainSummaryViewModel[] = analysis.domains.map(
    (d) => ({
      domain: d.domain,
      displayName: formatDomainDisplayName(d.domain),
      status: d.status,
      strength: d.strength,
      confidence: d.confidence,
      conclusion: d.primaryConclusion,
      supportingEvidenceCount: d.supportingEvidenceIds.length,
      challengingEvidenceCount: d.challengingEvidenceIds.length
    })
  );

  const strongestDomains: LifeAnalysisDomainSummaryViewModel[] = analysis.strongestDomains
    .map((domId) => domainSummaries.find((d) => d.domain === domId))
    .filter((d): d is LifeAnalysisDomainSummaryViewModel => d !== undefined);

  const sharedTiming: LifeAnalysisTimingViewModel[] = analysis.sharedTiming.map(
    (st) => ({
      source: st.source,
      title: formatSharedTimingTitle(st),
      period: st.periodKey,
      domains: st.participatingDomains.map((d) => ({
        domain: d,
        effect: st.effects[d] ?? 'UNKNOWN'
      })),
      statement: st.statement,
      evidenceCount: st.evidenceIds.length,
      isConflict: isTimingConflict(st)
    })
  );

  const conflicts: LifeAnalysisConflictViewModel[] = analysis.conflicts.map(
    (c) => ({
      type: c.type,
      severity: c.severity,
      domains: c.participatingDomains.map(formatDomainDisplayName),
      statement: c.description,
      evidenceCount: c.evidenceIds.length
    })
  );

  const completeness: LifeAnalysisCompletenessViewModel = {
    overall: analysis.dataCompleteness.overall,
    label: formatCompletenessLabel(analysis.dataCompleteness.overall)
  };

  const careerConclusionData = career.conclusionData as Record<string, unknown> | undefined;
  const careerD10Varga = career.vargaConfirmations.find((v) => v.varga === 'D10');
  const careerDetail: LifeAnalysisCareerDetailViewModel = {
    natalPromise: career.natalPromise.strength,
    d10Relationship: careerD10Varga?.relationship ?? (careerConclusionData?.d10Relationship as any) ?? 'UNAVAILABLE',
    currentDashaEffect: career.dashaActivation.effect,
    currentTransitEffect: career.transitTrigger.effect,
    currentActivation: careerConclusionData?.currentActivation as string | undefined,
    currentPressure: careerConclusionData?.currentPressure as string | undefined,
    dominantManifestations: careerConclusionData?.dominantManifestations as readonly string[] | undefined,
    headline: careerConclusionData?.headline as string | undefined,
    statement: career.conclusion.statement
  };

  const wealthConclusionData = wealth.conclusionData as Record<string, unknown> | undefined;
  const wealthD2Varga = wealth.vargaConfirmations.find((v) => v.varga === 'D2');
  const wealthDetail: LifeAnalysisWealthDetailViewModel = {
    natalPromise: wealth.natalPromise.strength,
    d2Relationship: wealthD2Varga?.relationship ?? (wealthConclusionData?.d2Relationship as any) ?? 'UNAVAILABLE',
    currentDashaEffect: wealth.dashaActivation.effect,
    currentTransitEffect: wealth.transitTrigger.effect,
    overallStatus: (wealthConclusionData?.overallStatus as any) ?? wealth.natalPromise.strength,
    accumulationStatus: (wealthConclusionData?.accumulationStatus as any) ?? 'UNAVAILABLE',
    gainsStatus: (wealthConclusionData?.gainsStatus as any) ?? 'UNAVAILABLE',
    fortuneStatus: (wealthConclusionData?.fortuneStatus as any) ?? 'UNAVAILABLE',
    speculationStatus: (wealthConclusionData?.speculationStatus as any) ?? 'UNAVAILABLE',
    dominantManifestations: wealthConclusionData?.dominantManifestations as readonly string[] | undefined,
    headline: wealthConclusionData?.headline as string | undefined,
    statement: wealth.conclusion.statement
  };

  const viewModel: LifeAnalysisViewModel = {
    status,
    overall,
    strongestDomains,
    domains: domainSummaries,
    sharedTiming,
    conflicts,
    confidence: analysis.confidence,
    completeness,
    evidence,
    careerDetail,
    wealthDetail
  };

  return deepFreeze(viewModel);
}
