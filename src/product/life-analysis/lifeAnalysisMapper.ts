import type { DomainInterpretation } from '../../domain/interpretation';
import type {
  LifeAnalysis,
  SharedTimingActivation
} from '../../domain/synthesis';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
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
import { formatDomainDisplayName, formatCompletenessLabel, mapProductStatus } from './domainPresentationUtils';
import { buildWhyExperience } from './lifeAnalysisWhy';
import { deepFreeze } from '../../ai/context/deepFreeze';

/**
 * Safely extract CareerConclusionData from a domain interpretation.
 * Returns typed data or undefined if not available.
 */
function getCareerConclusionData(
  interpretation: DomainInterpretation
): CareerConclusionData | undefined {
  if (interpretation.conclusionData && typeof interpretation.conclusionData === 'object') {
    const data = interpretation.conclusionData as CareerConclusionData | undefined;
    return data;
  }
  return undefined;
}

/**
 * Safely extract WealthConclusionData from a domain interpretation.
 * Returns typed data or undefined if not available.
 */
function getWealthConclusionData(
  interpretation: DomainInterpretation
): WealthConclusionData | undefined {
  if (interpretation.conclusionData && typeof interpretation.conclusionData === 'object') {
    const data = interpretation.conclusionData as WealthConclusionData | undefined;
    return data;
  }
  return undefined;
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
      isConflict: st.isConflict
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

  // Extract typed Career conclusion data
  const careerConclusionData = getCareerConclusionData(career);
  const careerD10Varga = career.vargaConfirmations.find((v) => v.varga === 'D10');
  const careerDetail: LifeAnalysisCareerDetailViewModel = {
    natalPromise: career.natalPromise.strength,
    d10Relationship:
      careerD10Varga?.relationship ??
      careerConclusionData?.d10Relationship ??
      'UNAVAILABLE',
    currentDashaEffect: career.dashaActivation.effect,
    currentTransitEffect: career.transitTrigger.effect,
    currentActivation: careerConclusionData?.currentActivation,
    currentPressure: careerConclusionData?.currentPressure,
    dominantManifestations: careerConclusionData?.dominantManifestations,
    headline: careerConclusionData?.headline,
    statement: career.conclusion.statement
  };

  // Extract typed Wealth conclusion data
  const wealthConclusionData = getWealthConclusionData(wealth);
  const wealthD2Varga = wealth.vargaConfirmations.find((v) => v.varga === 'D2');
  const wealthDetail: LifeAnalysisWealthDetailViewModel = {
    natalPromise: wealth.natalPromise.strength,
    d2Relationship:
      wealthD2Varga?.relationship ??
      wealthConclusionData?.d2Relationship ??
      'UNAVAILABLE',
    currentDashaEffect: wealth.dashaActivation.effect,
    currentTransitEffect: wealth.transitTrigger.effect,
    overallStatus: wealthConclusionData?.overallStatus ?? wealth.natalPromise.strength,
    accumulationStatus: wealthConclusionData?.accumulationStatus ?? 'UNAVAILABLE',
    gainsStatus: wealthConclusionData?.gainsStatus ?? 'UNAVAILABLE',
    fortuneStatus: wealthConclusionData?.fortuneStatus ?? 'UNAVAILABLE',
    speculationStatus: wealthConclusionData?.speculationStatus ?? 'UNAVAILABLE',
    dominantManifestations: wealthConclusionData?.dominantManifestations,
    headline: wealthConclusionData?.headline,
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
    why: buildWhyExperience({
      analysis,
      domainInterpretations: [career, wealth]
    }),
    careerWhy: buildWhyExperience(
      {
        analysis,
        domainInterpretations: [career, wealth]
      },
      'CAREER'
    ),
    wealthWhy: buildWhyExperience(
      {
        analysis,
        domainInterpretations: [career, wealth]
      },
      'WEALTH'
    ),
    careerDetail,
    wealthDetail
  };

  return deepFreeze(viewModel);
}
