import React from 'react';
import type { WealthTimingSynthesis } from '../../domain/timing/careerWealthTiming';
import type { WealthDimension } from '../../domain/wealth/wealthTypes';

export interface WealthTimingSectionProps {
  timingSynthesis?: WealthTimingSynthesis;
  className?: string;
}

const DIMENSION_LABELS: Record<WealthDimension, string> = {
  ACCUMULATION: 'Accumulation (2H)',
  GAINS: 'Gains & Revenue (11H)',
  FORTUNE: 'Fortune & Grace (9H)',
  SPECULATION: 'Speculation & Investments (5H)'
};

export const WealthTimingSection: React.FC<WealthTimingSectionProps> = ({
  timingSynthesis,
  className = ''
}) => {
  if (!timingSynthesis) {
    return null;
  }

  const { dimensions, overallSummary } = timingSynthesis;
  const dimensionKeys: WealthDimension[] = ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'];

  return (
    <div className={`p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 ${className}`}>
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Wealth Timing Synthesis by Dimension (CW-03)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Independent evaluation across 4 financial dimensions. Speculation remains strictly isolated.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensionKeys.map((dimKey) => {
          const dimData = dimensions[dimKey];
          if (!dimData) return null;

          const badgeColor =
            dimData.overallEffect === 'ACTIVATES'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300'
              : dimData.overallEffect === 'MODIFIES'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
              : dimData.overallEffect === 'CHALLENGES'
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';

          return (
            <div
              key={dimKey}
              className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {DIMENSION_LABELS[dimKey]}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${badgeColor}`}>
                  {dimData.overallEffect}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-400">Natal</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{dimData.natalPromise}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-400">Dasha</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{dimData.dashaEffect}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-400">Transit</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{dimData.transitEffect}</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {dimData.summary}
              </p>

              {dimData.factors.length > 0 && (
                <div className="text-[10px] text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 space-y-1">
                  {dimData.factors.map((f) => (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{f.statement}</span>
                      <span
                        className={`font-semibold shrink-0 ml-1 ${
                          f.direction === 'SUPPORT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {f.direction} ({f.weight})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Overall Summary: </span>
        {overallSummary}
      </div>
    </div>
  );
};
