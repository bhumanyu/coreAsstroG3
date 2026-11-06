/**
 * Wealth Page (P-UI-05 / D06)
 *
 * Pure guided presentation over canonical ProductAnalysis.
 * CW-05 remains the only Wealth conclusion authority. No astrology,
 * financial metric, suitability, D2 or lifecycle calculations occur here.
 */
import React, { useMemo } from 'react';
import { EvidenceConfidencePanel } from '../components/lifeAnalysis/EvidenceConfidencePanel';
import { selectEvidenceExperience } from '../product/analysis/evidenceExperienceViewModel';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
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
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectWealthViewModel(analysis) : undefined),
    [analysis]
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
    { id: 'wealth-overview', title: 'Overview', description: 'CW-05 conclusion and canonical confidence.', state: 'AVAILABLE' as const },
    { id: 'wealth-accumulation', title: 'Accumulation', description: 'Astrological accumulation dimension.', state: viewModel.dimensions.accumulation.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-gains', title: 'Gains', description: 'Astrological gains and inflow dimension.', state: viewModel.dimensions.gains.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-fortune', title: 'Fortune', description: 'Astrological fortune dimension.', state: viewModel.dimensions.fortune.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-speculation', title: 'Speculation', description: 'Astrological propensity and limitations; not trading advice.', state: viewModel.dimensions.speculation.status === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'AVAILABLE' as const },
    { id: 'wealth-financial-facts', title: 'Financial facts', description: 'C01 actual values only when explicit and validated.', state: viewModel.financialData.status === 'AVAILABLE' ? 'AVAILABLE' as const : 'UNAVAILABLE' as const },
    { id: 'wealth-d2', title: 'D2 qualification', description: 'Canonical Hora availability and gate status.', state: 'UNAVAILABLE' as const },
    { id: 'wealth-timing', title: 'Wealth timing', description: 'Dasha, transit and lifecycle candidate indications.', state: timingState },
    { id: 'wealth-risk', title: 'Risk and confidence', description: 'Qualitative risk, actual source status and CW-05 confidence.', state: riskState },
    { id: 'wealth-evidence', title: 'Evidence and provenance', description: 'CW-05 evidence, D01 confidence and D03 trace.', state: evidenceExperience ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <section id="wealth-overview" aria-label="Wealth overview" className="scroll-mt-6 space-y-4">
        <WealthHero hero={viewModel.hero} />
        <WealthJourney steps={steps} />
        <WealthOverallSection overall={viewModel.overall} />
      </section>

      <section id="wealth-dimensions" aria-label="Astrological wealth dimensions" className="scroll-mt-6 space-y-4">
        <WealthDimensionsSection dimensions={viewModel.dimensions} />
      </section>

      <section id="wealth-accumulation" aria-label="Accumulation" className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.accumulation} />
      </section>
      <section id="wealth-gains" aria-label="Gains" className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.gains} />
      </section>
      <section id="wealth-fortune" aria-label="Fortune" className="scroll-mt-6 space-y-4">
        <DimensionDetail dimension={viewModel.dimensions.fortune} />
      </section>
      <section id="wealth-speculation" aria-label="Speculation and limitations" className="scroll-mt-6 space-y-4">
        <WealthSpeculativeRiskSection speculativePropensity={viewModel.speculativePropensity} riskAndSuitability={viewModel.riskAndSuitability} />
      </section>

      <WealthFinancialFactsSection financialData={viewModel.financialData} />

      <section id="wealth-d2" aria-label="D2 status and qualification" className="scroll-mt-6 space-y-4">
        <WealthD2Section d2={viewModel.d2} />
      </section>

      <section id="wealth-timing" aria-label="Wealth timing" className="scroll-mt-6 space-y-4">
        <WealthDashaSection dasha={viewModel.dasha} />
        <WealthTransitSection transit={viewModel.transit} />
        <WealthLifecycleSection lifecycle={viewModel.lifecycle} />
      </section>

      <section id="wealth-risk" aria-label="Wealth risk and confidence" className="scroll-mt-6 space-y-4">
        <WealthQualificationsSection qualifications={viewModel.qualifications} />
        <WealthRiskSummary
          actualExposure={viewModel.riskAndSuitability.actualExposure}
          tradingHistory={viewModel.riskAndSuitability.tradingHistory}
          suitability={viewModel.riskAndSuitability.suitability}
          confidence={viewModel.overall.confidence}
        />
      </section>

      <section id="wealth-evidence" aria-label="Wealth evidence and provenance" className="scroll-mt-6 space-y-4">
        <WealthEvidenceSection evidence={viewModel.evidence} onOpenReasoning={() => onNavigate?.('reasoning')} />
        {evidenceExperience && <EvidenceConfidencePanel model={evidenceExperience} />}
      </section>

      <WealthConclusionSection conclusion={viewModel.conclusion} onOpenReasoning={() => onNavigate?.('reasoning')} />
    </main>
  );
};

import type { WealthDimensionItemViewModel } from '../product/analysis/wealthViewModel';

const DimensionDetail: React.FC<{ dimension: WealthDimensionItemViewModel }> = ({ dimension }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2" aria-label={dimension.label + ' detail'}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-slate-100">{dimension.label}</h2>
      <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">{dimension.status}</span>
    </div>
    <p className="text-xs text-slate-400">{dimension.houseLabel}</p>
    <p className="text-sm text-slate-300">{dimension.statement || 'No dimension statement is available.'}</p>
    <p className="text-[11px] text-slate-500">Astrological indication only. This does not establish actual income, assets, debt, liquidity or investment outcomes.</p>
  </section>
);

const WealthRiskSummary: React.FC<{
  actualExposure: string;
  tradingHistory: string;
  suitability: string;
  confidence: string;
}> = ({ actualExposure, tradingHistory, suitability, confidence }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3" aria-labelledby="wealth-risk-summary-heading">
    <h2 id="wealth-risk-summary-heading" className="text-base font-semibold text-slate-100">Risk and confidence are separate</h2>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div><dt className="text-xs text-slate-400">Actual exposure</dt><dd className="mt-1 text-sm text-slate-200">{actualExposure}</dd></div>
      <div><dt className="text-xs text-slate-400">Trading history</dt><dd className="mt-1 text-sm text-slate-200">{tradingHistory}</dd></div>
      <div><dt className="text-xs text-slate-400">Suitability</dt><dd className="mt-1 text-sm text-slate-200">{suitability}</dd></div>
      <div><dt className="text-xs text-slate-400">CW-05 analytical confidence</dt><dd className="mt-1 text-sm text-slate-200">{confidence}</dd></div>
    </dl>
    <p className="text-xs text-slate-400">Risk is qualitative in this interface. No risk score, capacity, suitability, expected return, or financial recommendation is calculated.</p>
  </section>
);
