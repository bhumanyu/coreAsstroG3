/**
 * Reasoning Page (P-UI-06)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/D10/D2/Dasha/transit/AI calculations.
 */

import React, { useMemo, useState } from 'react';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import {
  selectReasoningViewModel,
  type ReasoningDomain
} from '../product/analysis/reasoningViewModel';
import {
  ReasoningHero,
  ReasoningChain,
  ReasoningEvidenceGroup,
  ReasoningVargaSection,
  ReasoningDashaSection,
  ReasoningTransitSection,
  ReasoningQualificationSection,
  ReasoningConclusion,
  ReasoningAISection,
  ReasoningLoadingState,
  ReasoningUnavailableState,
  ReasoningErrorState
} from '../components/reasoning';
import { Network, Briefcase, Coins } from 'lucide-react';

export interface ReasoningPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const ReasoningPage: React.FC<ReasoningPageProps> = ({
  productAnalysisState,
  onRetry
}) => {
  const [selectedDomain, setSelectedDomain] = useState<ReasoningDomain>('CAREER');

  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectReasoningViewModel(analysis, selectedDomain) : undefined),
    [analysis, selectedDomain]
  );

  // 1. Error state when no analysis is available
  if (status === 'ERROR' && !analysis) {
    return <ReasoningErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 2. Loading state when calculation is actively running or idle
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <ReasoningLoadingState />;
  }

  // 3. Unavailable state when no analysis can be projected
  if (!analysis || !viewModel) {
    return <ReasoningUnavailableState onRetry={onRetry} />;
  }

  // 4. Render pure presentation sections
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Domain Switcher */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDomain('CAREER')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedDomain === 'CAREER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Career Reasoning</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('WEALTH')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedDomain === 'WEALTH'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Wealth Reasoning</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <span>Active Domain:</span>
          <span className="text-indigo-300 font-bold uppercase">{selectedDomain}</span>
        </div>
      </div>

      <ReasoningHero hero={viewModel.hero} />

      <ReasoningChain chain={viewModel.chain} />

      {/* Evidentiary Reasoning Groups */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Network className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Evidentiary Reasoning Groups</h2>
              <p className="text-xs text-slate-400">Categorized rule drivers, modifications, and directional factors</p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {viewModel.allEvidence.length} Total Rules
          </span>
        </div>

        <div className="space-y-6">
          {viewModel.evidenceGroups.map((group) => (
            <ReasoningEvidenceGroup key={group.id} group={group} />
          ))}
        </div>
      </div>

      <ReasoningVargaSection varga={viewModel.varga} />

      <ReasoningDashaSection dasha={viewModel.dasha} />

      <ReasoningTransitSection transit={viewModel.transit} />

      <ReasoningQualificationSection qualifications={viewModel.qualifications} />

      <ReasoningConclusion conclusion={viewModel.conclusion} />

      {viewModel.ai && <ReasoningAISection ai={viewModel.ai} />}
    </div>
  );
};
