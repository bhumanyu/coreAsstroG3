import React from 'react';
import { Compass, Sparkles, Layers } from 'lucide-react';
import type { LifeAnalysisProductState } from '../../product/life-analysis/lifeAnalysisTypes';
import { LifeAnalysisLoading } from './LifeAnalysisLoading';
import { LifeAnalysisError } from './LifeAnalysisError';
import { LifeAnalysisOverview } from './LifeAnalysisOverview';
import { StrongestDomains } from './StrongestDomains';
import { CareerAnalysisCard } from './CareerAnalysisCard';
import { WealthAnalysisCard } from './WealthAnalysisCard';
import { SharedTimingSection } from './SharedTimingSection';
import { ConflictSection } from './ConflictSection';
import { EvidenceSection } from './EvidenceSection';
import { AiExplanationSection } from './AiExplanationSection';
import { EmptyState } from '../fullNatalReport/EmptyState';
import { PartialStateNotice } from '../fullNatalReport/PartialStateNotice';

interface LifeAnalysisPageProps {
  readonly state: LifeAnalysisProductState;
  readonly onRetry?: () => void;
}

export const LifeAnalysisPage: React.FC<LifeAnalysisPageProps> = ({
  state,
  onRetry
}) => {
  if (state.status === 'LOADING') {
    return <LifeAnalysisLoading />;
  }

  if (state.status === 'ERROR' && !state.analysis) {
    return (
      <LifeAnalysisError
        message={state.errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (!state.analysis) {
    return (
      <EmptyState
        title="Life Analysis Unavailable"
        message="No life domain synthesis data could be calculated for the current chart."
        icon={<Compass className="w-5 h-5 text-indigo-400" />}
      />
    );
  }

  const { analysis, aiExplanation } = state;
  const careerSummary = analysis.domains.find((d) => d.domain === 'CAREER');
  const wealthSummary = analysis.domains.find((d) => d.domain === 'WEALTH');

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-code font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              P-029 Product Layer
            </span>
            <span className="text-xs font-mono-code text-slate-500">•</span>
            <span className="text-xs font-mono-code text-slate-400">
              Deterministic Synthesis + AI Grounded Reasoning
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-serif-astro">
            Unified Life Domain Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Harmonized astrological synthesis across Career V2, Wealth V2, Dasamsa (D10), Hora (D2), and shared Gochara/Dasha timings.
          </p>
        </div>
      </header>

      {/* Partial State Notice if applicable */}
      {analysis.status === 'PARTIAL' && (
        <PartialStateNotice message="Partial life domain analysis rendered. One or more domains had incomplete upstream astrological inputs." />
      )}

      {/* 1. Overall Synthesis Overview */}
      <LifeAnalysisOverview
        overall={analysis.overall}
        completeness={analysis.completeness}
        confidence={analysis.confidence}
      />

      {/* 2. Strongest Domains */}
      <StrongestDomains strongestDomains={analysis.strongestDomains} />

      {/* 3. Detailed Domain Cards: Career & Wealth */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-100">
            Domain-Specific Analysis Cards
          </h2>
        </div>

        <div className="space-y-6">
          <CareerAnalysisCard
            detail={analysis.careerDetail}
            summary={careerSummary}
          />
          <WealthAnalysisCard
            detail={analysis.wealthDetail}
            summary={wealthSummary}
          />
        </div>
      </section>

      {/* 4. Shared Timing Section */}
      <SharedTimingSection sharedTiming={analysis.sharedTiming} />

      {/* 5. Cross-Domain Conflicts */}
      <ConflictSection conflicts={analysis.conflicts} />

      {/* 6. Why? Evidence Collapsible */}
      <EvidenceSection why={analysis.why} evidence={analysis.evidence} />

      {/* 7. AI Explanation Section — RENDERED LAST */}
      <AiExplanationSection explanation={aiExplanation} />
    </div>
  );
};
