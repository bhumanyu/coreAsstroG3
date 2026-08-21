import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { LifeAnalysisConflictViewModel } from '../../product/life-analysis/lifeAnalysisTypes';

interface ConflictSectionProps {
  readonly conflicts: readonly LifeAnalysisConflictViewModel[];
}

export const ConflictSection: React.FC<ConflictSectionProps> = ({ conflicts }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MODERATE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">
          Cross-Domain Conflicts & Tensions
        </h2>
        <span className="text-xs font-mono-code text-slate-400">
          ({conflicts.length})
        </span>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center flex items-center justify-center gap-3 text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium text-slate-300">
            No structural cross-domain polarities or timing clashes detected.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map((conflict, idx) => (
            <article
              key={`${conflict.type}-${idx}`}
              className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(
                      conflict.severity
                    )}`}
                  >
                    {conflict.severity} Severity
                  </span>
                  <span className="text-xs font-mono-code text-slate-400 uppercase">
                    {conflict.type.replace(/_/g, ' ')}
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
                      {dom}
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
          ))}
        </div>
      )}
    </section>
  );
};
