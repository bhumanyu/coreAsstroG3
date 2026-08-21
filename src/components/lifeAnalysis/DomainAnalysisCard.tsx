import React from 'react';
import { Briefcase, Coins, Sparkles, CheckCircle2, CircleAlert } from 'lucide-react';
import type { LifeAnalysisDomainSummaryViewModel } from '../../product/life-analysis/lifeAnalysisTypes';

interface DomainAnalysisCardProps {
  readonly summary: LifeAnalysisDomainSummaryViewModel;
  readonly isHighlighted?: boolean;
}

export const DomainAnalysisCard: React.FC<DomainAnalysisCardProps> = ({
  summary,
  isHighlighted = false
}) => {
  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'CAREER':
        return <Briefcase className="w-5 h-5 text-indigo-400" />;
      case 'WEALTH':
        return <Coins className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'VERY_STRONG':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'STRONG':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'MODERATE':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'WEAK':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 p-5 ${
        isHighlighted
          ? 'bg-slate-900/95 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
            {getDomainIcon(summary.domain)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              {summary.displayName}
            </h3>
            <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider">
              {summary.domain}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStrengthBadge(
              summary.strength
            )}`}
          >
            {summary.strength.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {summary.confidence}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-astro">
        {summary.conclusion}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono-code text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {summary.supportingEvidenceCount} Supporting
          </span>
          {summary.challengingEvidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-400 font-mono-code text-[11px]">
              <CircleAlert className="w-3.5 h-3.5" />
              {summary.challengingEvidenceCount} Challenging
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono-code text-slate-400">
          Status: {summary.status.replace(/_/g, ' ')}
        </span>
      </div>
    </article>
  );
};
