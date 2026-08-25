import React from 'react';
import type { CareerTimingSynthesis } from '../../domain/timing/careerWealthTiming';

export interface CareerTimingSectionProps {
  timingSynthesis?: CareerTimingSynthesis;
  className?: string;
}

export const CareerTimingSection: React.FC<CareerTimingSectionProps> = ({
  timingSynthesis,
  className = ''
}) => {
  if (!timingSynthesis) {
    return null;
  }

  const {
    natalPromise,
    dashaEffect,
    transitEffect,
    overallEffect,
    confidence,
    factors,
    summary
  } = timingSynthesis;

  const effectBadgeColor =
    overallEffect === 'ACTIVATES'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300'
      : overallEffect === 'MODIFIES'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
      : overallEffect === 'CHALLENGES'
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300'
      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';

  return (
    <div className={`p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Career Timing Synthesis (CW-03)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Integrates Natal Promise (Ceiling), Current Dasha, and Active Transit Triggers
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${effectBadgeColor}`}>
          {overallEffect}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Natal Promise</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{natalPromise}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Authoritative Ceiling</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Dasha Effect</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{dashaEffect}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-sans">CW-02 Dasha Layer</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Transit Effect</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{transitEffect}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Gochara Trigger</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Confidence Score</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{(confidence * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deterministic Metric</div>
        </div>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
        {summary}
      </p>

      {factors.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Active Transit Factors ({factors.length})
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-start justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {factor.statement}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Planet: {factor.planet} | Category: {factor.category}
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      factor.direction === 'SUPPORT'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : factor.direction === 'CHALLENGE'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {factor.direction} ({factor.weight})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
