import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LifeAnalysisLoading: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 my-6"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-100">
          Synthesizing Life Analysis
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Harmonizing deterministic domain interpretations (Career V2, Wealth V2), cross-domain timing, and AI synthesis projections...
        </p>
      </div>
    </div>
  );
};
