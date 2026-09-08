import React from 'react';
import type { WealthConclusionViewModel } from '../../product/analysis/wealthViewModel';
import { formatConfidence } from './wealthFormat';
import { Award, ShieldCheck, GitFork, ArrowUpRight } from 'lucide-react';

export interface WealthConclusionSectionProps {
  readonly conclusion: WealthConclusionViewModel;
  readonly onOpenReasoning?: () => void;
}

export const WealthConclusionSection: React.FC<WealthConclusionSectionProps> = ({
  conclusion,
  onOpenReasoning
}) => {
  const isIntegrated = conclusion.integratedSynthesisAvailable;
  const title = isIntegrated ? 'Integrated Wealth Synthesis' : 'Wealth Conclusion';
  const subtitle = isIntegrated
    ? 'Unified conclusion synthesizing promise, divisional validation, and timing'
    : 'Natal promise and available activation evidence indicate foundational financial trajectory';

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-900/40 rounded-2xl p-6 space-y-5 shadow-xl shadow-indigo-950/10">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-code bg-indigo-950/60 border border-indigo-800/80 text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{formatConfidence(conclusion.confidence)}</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {conclusion.headline && (
          <h3 className="text-base font-bold text-slate-100 font-sans tracking-tight">
            {conclusion.headline}
          </h3>
        )}

        {conclusion.statement && (
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {conclusion.statement}
          </p>
        )}
      </div>

      {/* Analytical Factor Metrics & Reasoning Link */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-purple-400 font-bold mr-1.5">
              {conclusion.primaryEvidenceCount}
            </span>
            <span>Primary Drivers</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-emerald-400 font-bold mr-1.5">
              {conclusion.supportingEvidenceCount}
            </span>
            <span>Supporting Factors</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-rose-400 font-bold mr-1.5">
              {conclusion.challengingEvidenceCount}
            </span>
            <span>Challenging Factors</span>
          </div>
        </div>

        {onOpenReasoning && (
          <button
            type="button"
            onClick={onOpenReasoning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>Trace Full Evidential Reasoning</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
