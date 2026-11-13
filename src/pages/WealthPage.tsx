/**
 * Wealth Page (P-UI-05 / D06)
 *
 * Pure guided presentation over canonical ProductAnalysis.
 * CW-05 remains the only Wealth conclusion authority. No astrology,
 * financial metric, suitability, D2 or lifecycle calculations occur here.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../i18n/enumLabels';
import { EvidenceConfidencePanel } from '../components/lifeAnalysis/EvidenceConfidencePanel';
import { selectEvidenceExperience } from '../product/analysis/evidenceExperienceViewModel';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import { resolveUserFacingCopy } from '../product/life-analysis/userFacingInterpretation';
import {
  WealthHero,
  WealthOverallSection,
  WealthDimensionsSection,
  WealthD2Section,
  WealthDashaSection,
  WealthTransitSection,
  WealthSpeculativeRiskSection,
  WealthLifecycleSection,
  WealthQualificationsSection,
  WealthEvidenceSection,
  WealthConclusionSection,
  WealthLoadingState,
  WealthUnavailableState,
  WealthErrorState,
  WealthJourney,
  WealthFinancialFactsSection
} from '../components/wealth';
import { WealthFinancialFactsManager } from '../components/wealth/WealthFinancialFactsManager';

export interface WealthPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const WealthPage: React.FC<WealthPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const { t, i18n } = useTranslation('wealth');
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis
      ? selectWealthViewModel(analysis, resolveUserFacingCopy(i18n.language))
      : undefined),
    [analysis, i18n.language]
  );
  const evidenceExperience = useMemo(
    () => (analysis && viewModel
      ? selectEvidenceExperience(analysis, 'WEALTH', viewModel.confidenceCompleteness)
      : undefined),
    [analysis, viewModel]
  );

  if (status === 'ERROR' && !analysis) {
    return <WealthErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <WealthLoadingState />;
  }
  if (!analysis || !viewModel) {
    return <WealthUnavailableState onRetry={onRetry} />;
  }

  const dimensionState = viewModel.dimensions.items.every(item => item.status !== 'UNAVAILABLE')
    ? 'AVAILABLE' as const
    : 'PARTIAL' as const;
  const timingState = viewModel.dasha.status === 'AVAILABLE' && viewModel.lifecycle.candidateCount > 0
    ? 'AVAILABLE' as const
    : viewModel.dasha.status === 'PARTIAL' || viewModel.lifecycle.status === 'PARTIAL'
      ? 'PARTIAL' as const
      : 'UNAVAILABLE' as const;
  const riskState = viewModel.riskAndSuitability.actualExposure === 'AVAILABLE'
    || viewModel.riskAndSuitability.tradingHistory === 'AVAILABLE'
    ? 'PARTIAL' as const
    : viewModel.speculativePropensity.status === 'INSUFFICIENT_DATA'
      ? 'UNAVAILABLE' as const
      : 'AVAILABLE' as const;

  const steps = [
    { id: 'wealth-overview', title: t('journey.overview'), description: t('journey.overviewDescription'), state: 'AVAILABLE' as const },
    { id: 'wealth-accumulation', title: t('journey.accumulation'), description: t('journey.accumulationDescription'), state: viewModel.dimensions.accumulation.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-gains', title: t('journey.gains'), description: t('journey.gainsDescription'), state: viewModel.dimensions.gains.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-fortune', title: t('journey.fortune'), description: t('journey.fortuneDescription'), state: viewModel.dimensions.fortune.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-speculation', title: t('journey.speculation'), description: t('journey.speculationDescription'), state: viewModel.dimensions.speculation.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-financial-facts', title: t('journey.financialFacts'), description: t('journey.financialFactsDescription'), state: viewModel.financialData.status === 'AVAILABLE' ? 'AVAILABLE' as const : 'UNAVAILABLE' as const },
    { id: 'wealth-d2', title: t('journey.d2'), description: t('journey.d2Description'), state: 'UNAVAILABLE' as const },
    { id: 'wealth-timing', title: t('journey.timing'), description: t('journey.timingDescription'), state: timingState },
    { id: 'wealth-risk', title: t('journey.risk'), description: t('journey.riskDescription'), state: riskState },
    { id: 'wealth-evidence', title: t('journey.evidence'), description: t('journey.evidenceDescription'), state: evidenceExperience ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <section id="wealth-overview" aria-label={t('sections.overview')} className="scroll-mt-6 space-y-4">
        <WealthHero hero={viewModel.hero} />
        <WealthJourney steps={steps} />
        <WealthOverallSection overall={viewModel.overall} />
      </section>

      <section aria-label={t('sections.dimensions')} className="scroll-mt-6 space-y-4">
        <WealthDimensionsSection dimensions={viewModel.dimensions} />
      </section>

      <section id="wealth-accumulation" aria-label={t('sections.accumulation')} className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.accumulation} />
      </section>
      <section id="wealth-gains" aria-label={t('sections.gains')} className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.gains} />
      </section>
      <section id="wealth-fortune" aria-label={t('sections.fortune')} className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.fortune} />
      </section>
      <section id="wealth-speculation" aria-label={t('sections.speculation')} className="scroll-mt-6 space-y-4">
        <WealthSpeculativeRiskSection speculativePropensity={viewModel.speculativePropensity} riskAndSuitability={viewModel.riskAndSuitability} />
      </section>

      <WealthFinancialFactsSection financialData={viewModel.financialData} />
      <WealthFinancialFactsManager />

      <section id="wealth-d2" aria-label={t('sections.d2')} className="scroll-mt-6 space-y-4">
        <WealthD2Section d2={viewModel.d2} />
      </section>

      <section id="wealth-timing" aria-label={t('sections.timing')} className="scroll-mt-6 space-y-4">
        <WealthDashaSection dasha={viewModel.dasha} />
        <WealthTransitSection transit={viewModel.transit} />
        <WealthLifecycleSection lifecycle={viewModel.lifecycle} />
      </section>

      <section id="wealth-risk" aria-label={t('sections.risk')} className="scroll-mt-6 space-y-4">
        <WealthQualificationsSection qualifications={viewModel.qualifications} />
        <WealthRiskSummary
          actualExposure={viewModel.riskAndSuitability.actualExposure}
          tradingHistory={viewModel.riskAndSuitability.tradingHistory}
          suitability={viewModel.riskAndSuitability.suitability}
          confidence={viewModel.overall.confidence}
        />
      </section>

      <section id="wealth-evidence" aria-label={t('sections.evidence')} className="scroll-mt-6 space-y-4">
        <WealthEvidenceSection evidence={viewModel.evidence} onOpenReasoning={() => onNavigate?.('reasoning')} />
        {evidenceExperience && <EvidenceConfidencePanel model={evidenceExperience} />}
      </section>

      <WealthConclusionSection conclusion={viewModel.conclusion} onOpenReasoning={() => onNavigate?.('reasoning')} />
    </main>
  );
};

import type { WealthDimensionItemViewModel } from '../product/analysis/wealthViewModel';

const DimensionDetail: React.FC<{ dimension: WealthDimensionItemViewModel }> = ({ dimension }) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2" aria-label={t('dimension.detailAria', { dimension: dimension.label })}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-slate-100">{dimension.label}</h2>
      <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
        {enumLabel(tEnum, 'wealthDimensionStatus', dimension.status)}
      </span>
    </div>
    <p className="text-xs text-slate-400">{dimension.houseLabel}</p>
    <p className="text-sm text-slate-300">{dimension.statement || t('dimension.statementUnavailable')}</p>
    <p className="text-[11px] text-slate-500">{t('disclaimers.astrologicalIndication')}</p>
  </section>
};

const WealthRiskSummary: React.FC<{
  actualExposure: string;
  tradingHistory: string;
  suitability: string;
  confidence: string;
}> = ({ actualExposure, tradingHistory, suitability, confidence }) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  return (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3" aria-labelledby="wealth-risk-summary-heading">
    <h2 id="wealth-risk-summary-heading" className="text-base font-semibold text-slate-100">{t('risk.title')}</h2>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div><dt className="text-xs text-slate-400">{t('risk.actualExposure')}</dt><dd className="mt-1 text-sm text-slate-200">{enumLabel(tEnum, 'productAvailability', actualExposure)}</dd></div>
      <div><dt className="text-xs text-slate-400">{t('risk.tradingHistory')}</dt><dd className="mt-1 text-sm text-slate-200">{enumLabel(tEnum, 'productAvailability', tradingHistory)}</dd></div>
      <div><dt className="text-xs text-slate-400">{t('risk.suitability')}</dt><dd className="mt-1 text-sm text-slate-200">{enumLabel(tEnum, 'productAvailability', suitability)}</dd></div>
      <div><dt className="text-xs text-slate-400">{t('risk.confidence')}</dt><dd className="mt-1 text-sm text-slate-200">{enumLabel(tEnum, 'productConfidence', confidence)}</dd></div>
    </dl>
    <p className="text-xs text-slate-400">{t('disclaimers.riskSummary')}</p>
  </section>
  );
};
