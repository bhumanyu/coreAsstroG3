import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LifeAnalysisLoading: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 my-6"
    >
      <span className="sr-only">Preparing Life Analysis…</span>

      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" aria-hidden="true" />
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-100">
          Synthesizing Life Analysis
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Harmonizing deterministic domain interpretations (Career V2, Wealth V2), cross-domain timing, and AI synthesis projections...
        </p>
      </div>

      {/* Skeleton Preview Grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/60 opacity-60">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/60 rounded w-full" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/60 rounded w-full" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
};
