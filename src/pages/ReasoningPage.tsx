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
  selectUnifiedReasoningViewModel,
  type ReasoningDomain
} from '../product/analysis/reasoningViewModel';
import {
  ReasoningHero,
  ReasoningOverallConclusion,
  ReasoningChain,
  ReasoningEvidenceGroup,
  ReasoningDivisionalComparison,
  ReasoningTransitComparison,
  ReasoningDashaSection,
  ReasoningQualificationSection,
  ReasoningConclusion,
  ReasoningAISection,
  ReasoningLoadingState,
  ReasoningUnavailableState,
  ReasoningErrorState
} from '../components/reasoning';
import { Network, Briefcase, Coins, Compass, Clock, Layers } from 'lucide-react';

export interface ReasoningPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const ReasoningPage: React.FC<ReasoningPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const [focusedDomain, setFocusedDomain] = useState<ReasoningDomain | 'ALL'>('ALL');

  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const unified = useMemo(
    () => (analysis ? selectUnifiedReasoningViewModel(analysis) : undefined),
    [analysis]
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
  if (!analysis || !unified) {
    return <ReasoningUnavailableState onRetry={onRetry} />;
  }

  const { career, wealth, overview, dedupedEvidence, dedupedEvidenceGroups } = unified;

  const handleSelectDomain = (domain: ReasoningDomain) => {
    setFocusedDomain(domain);
    const element = document.getElementById(
      domain === 'CAREER' ? 'section-career-reasoning' : 'section-wealth-reasoning'
    );
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 4. Render unified presentation sections for both domains
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Navigation Controls / Related Links (§34, §35) */}
      {onNavigate && (
        <div
          id="reasoning-navigation-controls"
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Compass className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-300">Exploration Links:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="nav-link-career"
              onClick={() => onNavigate('career')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors font-medium"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>View detailed Career analysis</span>
            </button>

            <button
              type="button"
              id="nav-link-dasha"
              onClick={() => onNavigate('dasha')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors font-medium"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>View Dasha & Timing</span>
            </button>

            <button
              type="button"
              id="nav-link-detailed"
              onClick={() => onNavigate('detailed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <span>View Detailed Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Unified Overall Conclusion (spec §26, §50) */}
      <ReasoningOverallConclusion
        overview={overview}
        selectedDomain={focusedDomain === 'ALL' ? undefined : focusedDomain}
        onSelectDomain={handleSelectDomain}
      />

      {/* Domain Navigation / Focus Switcher (Scroll & Focus only, never gates computation) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="domain-switcher-all"
            onClick={() => {
              setFocusedDomain('ALL');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              focusedDomain === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>All Domains</span>
          </button>

          <button
            type="button"
            id="domain-switcher-career"
            onClick={() => handleSelectDomain('CAREER')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              focusedDomain === 'CAREER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Career Reasoning</span>
          </button>

          <button
            type="button"
            id="domain-switcher-wealth"
            onClick={() => handleSelectDomain('WEALTH')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              focusedDomain === 'WEALTH'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Wealth Reasoning</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <span>Focus:</span>
          <span className="text-indigo-300 font-bold">
            {focusedDomain === 'CAREER'
              ? 'Career Domain'
              : focusedDomain === 'WEALTH'
                ? 'Wealth Domain'
                : 'All Domains'}
          </span>
        </div>
      </div>

      {/* Unified Cross-Domain Evidence Framework (§4, §39) */}
      <section
        id="section-cross-domain-evidence"
        aria-label="Cross-Domain Evidence Framework"
        className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Network className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Cross-Domain Evidence Framework</h2>
              <p className="text-xs text-slate-400">
                Deduplicated evidence items categorized by astrological role
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {dedupedEvidence.length} evidence items
          </span>
        </div>

        <div className="space-y-6">
          {dedupedEvidenceGroups.map((group) => (
            <ReasoningEvidenceGroup key={group.id} group={group} />
          ))}
        </div>
      </section>

      {/* Side-by-side Divisional Confirmation (§4, P1) */}
      <ReasoningDivisionalComparison
        d10={career.d10 ?? career.varga}
        d2={wealth.d2 ?? wealth.varga}
      />

      {/* Side-by-side Transit Timing (§4, P1) */}
      <ReasoningTransitComparison
        careerTransit={career.transit}
        wealthTransit={wealth.transit}
      />

      {/* Overall AI Explanation Section (§11, P1) */}
      <ReasoningAISection ai={unified.ai ?? career.ai ?? wealth.ai} />

      {/* Career Reasoning Section (§2b) */}
      <section
        id="section-career-reasoning"
        aria-label="Career & Vocational Reasoning"
        className="space-y-6 pt-2"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Briefcase className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-100">Career Reasoning</h2>
        </div>

        <ReasoningHero hero={career.hero} />

        <ReasoningChain chain={career.chain} />

        <ReasoningDashaSection dasha={career.dasha} />

        <ReasoningQualificationSection qualifications={career.qualifications} />

        <ReasoningConclusion conclusion={career.conclusion} />
      </section>

      {/* Wealth Reasoning Section (§2b) */}
      <section
        id="section-wealth-reasoning"
        aria-label="Wealth & Asset Accumulation Reasoning"
        className="space-y-6 pt-6 border-t border-slate-800/80"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Coins className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-100">Wealth Reasoning</h2>
        </div>

        <ReasoningHero hero={wealth.hero} />

        <ReasoningChain chain={wealth.chain} />

        <ReasoningDashaSection dasha={wealth.dasha} />

        <ReasoningQualificationSection qualifications={wealth.qualifications} />

        <ReasoningConclusion conclusion={wealth.conclusion} />
      </section>
    </div>
  );
};
