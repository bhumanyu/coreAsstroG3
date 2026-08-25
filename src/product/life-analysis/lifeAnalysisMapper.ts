import type { DomainInterpretation } from '../../domain/interpretation';
import {
  getCareerConclusionData,
  getWealthConclusionData,
  getCareerTimingActivations,
  getWealthPeriodTimingActivations,
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming,
  deriveCareerTimingEffect,
  deriveWealthDimensionTiming,
  deriveWealthTimingEffect
} from '../../domain/interpretation';
import { synthesizeCareerDashaHierarchy } from './dashaCareerHierarchy';
import { synthesizeWealthDashaHierarchy } from './dashaWealthHierarchy';
import { indexDashaPeriodActivations } from './dashaHierarchyUtils';
import type {
  LifeAnalysis,
  SharedTimingActivation
} from '../../domain/synthesis';
import type { ActiveDashaInterpretation } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
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
import { buildDashaInterpretationProduct } from './dasha/buildDashaInterpretationProduct';
import { formatDomainDisplayName, formatCompletenessLabel, mapProductStatus } from './domainPresentationUtils';
import {
  buildWhyExperience,
  buildCareerWhyExperience,
  buildWealthWhyExperience
} from './lifeAnalysisWhy';
import { deepFreeze } from '../../ai/context/deepFreeze';

function formatSharedTimingTitle(st: SharedTimingActivation): string {
  if (st.source === 'DASHA') {
    const level = st.level
      ? st.level.charAt(0).toUpperCase() + st.level.slice(1).toLowerCase()
      : 'Dasha';
    const key = st.planet ?? st.periodKey;
    return key ? `${level} (${key})` : `${level} Activation`;
  }
  const transitKey = st.planet ?? st.periodKey;
  return transitKey ? `Transit (${transitKey})` : 'Active Transits';
}

export function buildLifeAnalysisViewModel(
  analysis: LifeAnalysis,
  career: DomainInterpretation,
  wealth: DomainInterpretation,
  evidence: readonly LifeAnalysisEvidenceViewModel[],
  activeDasha?: ActiveDashaInterpretation
): LifeAnalysisViewModel {
  const status = mapProductStatus(analysis.dataCompleteness.overall);

  const mappedActiveDasha = activeDasha
    ? buildDashaInterpretationProduct(activeDasha)
    : undefined;

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
  const careerTiming = buildNormalizedCareerTiming(career, activeDasha?.at ?? career.generatedAt);
  const careerActivations = getCareerTimingActivations(career);
  const { md: mdCareer, ad: adCareer, pd: pdCareer } = indexDashaPeriodActivations(careerActivations);
  const careerDashaHierarchy =
    mdCareer && adCareer && pdCareer
      ? synthesizeCareerDashaHierarchy(mdCareer, adCareer, pdCareer)
      : undefined;

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
    statement: career.conclusion.statement,
    timing: careerTiming,
    currentTimingEffect: deriveCareerTimingEffect(careerTiming),
    manifestationSynthesis: careerConclusionData?.careerManifestationSynthesis,
    finalSynthesis: careerConclusionData?.careerFinalSynthesis,
    ...(careerDashaHierarchy ? { dashaHierarchy: careerDashaHierarchy } : {})
  };

  // Extract typed Wealth conclusion data
  const wealthConclusionData = getWealthConclusionData(wealth);
  const wealthD2Varga = wealth.vargaConfirmations.find((v) => v.varga === 'D2');
  const wealthTiming = buildNormalizedWealthTiming(wealth, activeDasha?.at ?? wealth.generatedAt);
  const wealthActivations = getWealthPeriodTimingActivations(wealth);
  const { md: mdWealth, ad: adWealth, pd: pdWealth } = indexDashaPeriodActivations(wealthActivations);
  const wealthDashaHierarchy =
    mdWealth && adWealth && pdWealth
      ? synthesizeWealthDashaHierarchy(mdWealth, adWealth, pdWealth)
      : undefined;

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
    statement: wealth.conclusion.statement,
    timing: wealthTiming,
    dimensionTiming: deriveWealthDimensionTiming(wealthTiming),
    currentTimingEffect: deriveWealthTimingEffect(wealthTiming),
    manifestationSynthesis: wealthConclusionData?.wealthManifestationSynthesis,
    finalSynthesis: wealthConclusionData?.wealthFinalSynthesis,
    ...(wealthDashaHierarchy ? { dashaHierarchy: wealthDashaHierarchy } : {})
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
    careerWhy: buildCareerWhyExperience({
      analysis,
      domainInterpretations: [career, wealth]
    }),
    wealthWhy: buildWealthWhyExperience({
      analysis,
      domainInterpretations: [career, wealth]
    }),
    careerDetail,
    wealthDetail,
    activeDasha: mappedActiveDasha
  };

  return deepFreeze(viewModel);
}
