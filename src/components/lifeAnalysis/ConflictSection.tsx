import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { LifeAnalysisConflictViewModel } from '../../product/life-analysis/lifeAnalysisTypes';
import { formatEnum, getSeverityBadgeClass } from './lifeAnalysisUx';

interface ConflictSectionProps {
  readonly conflicts: readonly LifeAnalysisConflictViewModel[];
}

export const ConflictSection: React.FC<ConflictSectionProps> = ({ conflicts }) => {
  return (
    <section aria-labelledby="conflicts-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
        <h2 id="conflicts-heading" className="text-base sm:text-lg font-semibold text-slate-100">
          Cross-Domain Conflicts & Tensions
        </h2>
        <span className="text-xs font-mono-code text-slate-400">
          ({conflicts.length})
        </span>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center flex items-center justify-center gap-3 text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium text-slate-300">
            No structural cross-domain polarities or timing clashes detected.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map((conflict) => {
            const stableKey = `${conflict.type}-${conflict.domains.join('-')}-${conflict.severity}`;

            return (
              <article
                key={stableKey}
                className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadgeClass(
                        conflict.severity
                      )}`}
                    >
                      {formatEnum(conflict.severity)} Severity
                    </span>
                    <span className="text-xs font-mono-code text-slate-400 uppercase">
                      {formatEnum(conflict.type)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono-code text-slate-400">
                      Domains:
                    </span>
                    {conflict.domains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700"
                      >
                        {formatEnum(dom)}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-astro">
                  {conflict.statement}
                </p>

                <div className="text-right">
                  <span className="text-[10px] font-mono-code text-slate-500">
                    {conflict.evidenceCount} conflicting evidence factors evaluated
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
