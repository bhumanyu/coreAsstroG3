import React from 'react';
import type { ReasoningAiViewModel } from '../../product/analysis/reasoningViewModel';
import { BrainCircuit, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export interface ReasoningAISectionProps {
  readonly ai?: ReasoningAiViewModel;
}

export const ReasoningAISection: React.FC<ReasoningAISectionProps> = ({ ai }) => {
  const isAvailable = Boolean(ai?.available && ai?.status === 'AVAILABLE');
  const status = ai?.status ?? 'UNAVAILABLE';

  return (
    <div id="reasoning-ai-section" className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BrainCircuit className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">AI Explanation</h2>
              {isAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono-code font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-md">
                  Derived from deterministic evidence
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-code font-medium bg-slate-800 border border-slate-700 text-slate-400 rounded-md">
                  <AlertCircle className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  <span>
                    {status === 'ERROR'
                      ? 'Error'
                      : status === 'PARTIAL'
                        ? 'Partial'
                        : status === 'FAILED'
                          ? 'Failed'
                          : 'Unavailable'}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rule-grounded narrative commentary and classical text concordance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ai?.routingMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ai.routingMode}</span>
            </span>
          )}
          {ai?.providerName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ai.providerName}</span>
            </span>
          )}
        </div>
      </div>

      {isAvailable ? (
        <>
          {ai?.statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {ai.statement}
            </p>
          )}

          {ai?.explanation && ai.explanation !== ai.statement && (
            <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
              {ai.explanation}
            </p>
          )}
        </>
      ) : (
        <div className="py-2 text-xs text-slate-400 leading-relaxed font-sans">
          AI explanation is currently unavailable. The deterministic conclusion remains available above.
        </div>
      )}

      <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800/60">
        Note: Natural language explanation is strictly descriptive and does not compute, modify, or override the deterministic calculation engine.
      </div>
    </div>
  );
};
