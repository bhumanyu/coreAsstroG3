import React from 'react';
import type { ReasoningAiViewModel } from '../../product/analysis/reasoningViewModel';
import { BrainCircuit, Sparkles, ShieldCheck } from 'lucide-react';

export interface ReasoningAISectionProps {
  readonly ai?: ReasoningAiViewModel;
}

export const ReasoningAISection: React.FC<ReasoningAISectionProps> = ({ ai }) => {
  if (!ai || !ai.available) {
    return null;
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BrainCircuit className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Explanatory Astrological Intelligence</h2>
            <p className="text-xs text-slate-400">Rule-grounded narrative commentary and classical text concordance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ai.routingMode || 'Deterministic Commentary'}</span>
          </span>
          {ai.providerName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ai.providerName}</span>
            </span>
          )}
        </div>
      </div>

      {ai.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {ai.statement}
        </p>
      )}

      {ai.explanation && ai.explanation !== ai.statement && (
        <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
          {ai.explanation}
        </p>
      )}

      <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800/60">
        Note: Natural language explanation is strictly descriptive and does not compute, modify, or override the deterministic calculation engine.
      </div>
    </div>
  );
};
