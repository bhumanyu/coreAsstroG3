import React from 'react';
import type { LifeAnalysisCompletenessViewModel } from '../../product/life-analysis/lifeAnalysisTypes';
import { LifeAnalysisStatusBadge } from './LifeAnalysisStatusBadge';

interface LifeAnalysisHeaderProps {
  readonly status?: string;
  readonly completeness?: LifeAnalysisCompletenessViewModel;
}

export const LifeAnalysisHeader: React.FC<LifeAnalysisHeaderProps> = ({
  status,
  completeness
}) => {
  return (
    <header
      aria-labelledby="life-analysis-heading"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-code font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Core Astro Analysis
          </span>
          <span className="text-xs font-mono-code text-slate-500" aria-hidden="true">•</span>
          <span className="text-xs font-mono-code text-slate-400">
            Deterministic Synthesis + AI Grounded Reasoning
          </span>
        </div>
        <h1
          id="life-analysis-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-serif-astro"
        >
          Unified Life Domain Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Harmonized astrological synthesis across Career V2, Wealth V2, Dasamsa (D10), Hora (D2), and shared Gochara/Dasha timings.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <LifeAnalysisStatusBadge
          status={status}
          completeness={completeness}
        />
      </div>
    </header>
  );
};
