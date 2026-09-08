import React from 'react';
import { Loader2, Coins } from 'lucide-react';

export const WealthLoadingState: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="space-y-6 py-4 animate-fade-in"
    >
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Coins className="w-8 h-8 animate-pulse" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-base font-semibold text-slate-100 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
            Analyzing Wealth & Financial Assets
          </h2>
          <p className="text-xs text-slate-400">
            Synthesizing natal 2nd/11th house promise, Hora (D2) confirmation, active planetary timing, and transit triggers...
          </p>
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-4 space-y-3"
          >
            <div className="h-4 bg-slate-800/80 rounded w-1/2" />
            <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            <div className="h-3 bg-slate-800/40 rounded w-full" />
          </div>
        ))}
      </div>

      <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-6 space-y-4">
        <div className="h-5 bg-slate-800/80 rounded w-1/3" />
        <div className="h-4 bg-slate-800/60 rounded w-2/3" />
        <div className="h-4 bg-slate-800/40 rounded w-1/2" />
      </div>
    </div>
  );
};
