import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { LifeAnalysisTimingViewModel } from '../../product/life-analysis/lifeAnalysisTypes';
import { formatDomainDisplayName } from '../../product/life-analysis/domainPresentationUtils';
import { formatEnum, getEffectBadgeClass } from './lifeAnalysisUx';

interface SharedTimingSectionProps {
  readonly sharedTiming: readonly LifeAnalysisTimingViewModel[];
}

export const SharedTimingSection: React.FC<SharedTimingSectionProps> = ({
  sharedTiming
}) => {
  if (!sharedTiming || sharedTiming.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="shared-timing-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        <h2 id="shared-timing-heading" className="text-base sm:text-lg font-semibold text-slate-100">
          Shared Cross-Domain Timing Activations
        </h2>
        <span className="text-xs font-mono-code text-slate-400">
          ({sharedTiming.length})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sharedTiming.map((timing) => {
          // Stable composite key derived from deterministic source, activation title, and active period
          const stableKey = `${timing.source}-${timing.title}-${timing.period || 'active'}`;

          return (
            <article
              key={stableKey}
              className={`rounded-2xl border p-5 transition-all ${
                timing.isConflict
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {timing.source}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-200">
                    {timing.title}
                  </h3>
                </div>

                {timing.isConflict && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Current Tension / Divergent Effects</span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-astro">
                {timing.statement}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono-code text-slate-400">
                    Impact by Domain:
                  </span>
                  {timing.domains.map((d) => (
                    <span
                      key={d.domain}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${getEffectBadgeClass(
                        d.effect
                      )}`}
                    >
                      <span className="font-semibold">{formatDomainDisplayName(d.domain)}:</span>
                      <span>{formatEnum(d.effect)}</span>
                    </span>
                  ))}
                </div>

                <span className="text-[10px] font-mono-code text-slate-500">
                  {timing.evidenceCount} linked evidence points
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
