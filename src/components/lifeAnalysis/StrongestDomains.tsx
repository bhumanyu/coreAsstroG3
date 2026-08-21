import React from 'react';
import { Sparkles } from 'lucide-react';
import type { LifeAnalysisDomainSummaryViewModel } from '../../product/life-analysis/lifeAnalysisTypes';
import { DomainAnalysisCard } from './DomainAnalysisCard';

interface StrongestDomainsProps {
  readonly strongestDomains: readonly LifeAnalysisDomainSummaryViewModel[];
}

export const StrongestDomains: React.FC<StrongestDomainsProps> = ({
  strongestDomains
}) => {
  if (!strongestDomains || strongestDomains.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="strongest-domains-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
        <h2 id="strongest-domains-heading" className="text-base sm:text-lg font-semibold text-slate-100">
          Strongest Life Domains
        </h2>
        <span className="text-xs font-mono-code text-slate-400">
          ({strongestDomains.length})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strongestDomains.map((summary) => (
          <DomainAnalysisCard
            key={summary.domain}
            summary={summary}
            isHighlighted
          />
        ))}
      </div>
    </section>
  );
};
