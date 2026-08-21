import React from 'react';
import { Compass, Layers } from 'lucide-react';
import type { LifeAnalysisProductState } from '../../product/life-analysis/lifeAnalysisTypes';
import { LifeAnalysisLoading } from './LifeAnalysisLoading';
import { LifeAnalysisError } from './LifeAnalysisError';
import { LifeAnalysisHeader } from './LifeAnalysisHeader';
import { LifeAnalysisPartial } from './LifeAnalysisPartial';
import { LifeAnalysisOverview } from './LifeAnalysisOverview';
import { StrongestDomains } from './StrongestDomains';
import { CareerAnalysisCard } from './CareerAnalysisCard';
import { WealthAnalysisCard } from './WealthAnalysisCard';
import { SharedTimingSection } from './SharedTimingSection';
import { ConflictSection } from './ConflictSection';
import { EvidenceSection } from './EvidenceSection';
import { AiExplanationSection } from './AiExplanationSection';
import { EmptyState } from '../fullNatalReport/EmptyState';

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
        icon={<Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const { analysis, aiExplanation } = state;
  const careerSummary = analysis.domains.find((d) => d.domain === 'CAREER');
  const wealthSummary = analysis.domains.find((d) => d.domain === 'WEALTH');

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header with Title & Status Badge */}
      <LifeAnalysisHeader
        status={analysis.status}
        completeness={analysis.completeness}
      />

      {/* 2. Partial State Notice if applicable */}
      {analysis.status === 'PARTIAL' && (
        <LifeAnalysisPartial message="Partial life domain analysis rendered. One or more domains had incomplete upstream astrological inputs." />
      )}

      {/* 3. Overall Synthesis Overview */}
      <LifeAnalysisOverview
        overall={analysis.overall}
        completeness={analysis.completeness}
        confidence={analysis.confidence}
      />

      {/* 4. Strongest Domains */}
      <StrongestDomains strongestDomains={analysis.strongestDomains} />

      {/* 5. Detailed Domain Cards: Career & Wealth */}
      <section aria-labelledby="domain-cards-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <h2 id="domain-cards-heading" className="text-base sm:text-lg font-semibold text-slate-100">
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

      {/* 6. Shared Timing Section */}
      <SharedTimingSection sharedTiming={analysis.sharedTiming} />

      {/* 7. Cross-Domain Conflicts */}
      <ConflictSection conflicts={analysis.conflicts} />

      {/* 8. Why? Evidence Collapsible */}
      <EvidenceSection why={analysis.why} evidence={analysis.evidence} />

      {/* 9. AI Explanation Section — RENDERED LAST */}
      <AiExplanationSection explanation={aiExplanation} />
    </div>
  );
};
