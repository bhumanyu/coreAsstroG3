import React from 'react';
import type { ReasoningQualificationViewModel } from '../../product/analysis/reasoningViewModel';
import { formatSeverity, getSeverityBadgeClass } from './reasoningFormat';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export interface ReasoningQualificationSectionProps {
  readonly qualifications: readonly ReasoningQualificationViewModel[];
}

export const ReasoningQualificationSection: React.FC<ReasoningQualificationSectionProps> = ({
  qualifications
}) => {
  const hasQualifications = qualifications && qualifications.length > 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Reasoning Qualifications & Caveats</h2>
            <p className="text-xs text-slate-400">Countervailing planetary afflictions, combustion, or structural constraints</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          {qualifications.length} {qualifications.length === 1 ? 'Condition' : 'Conditions'}
        </span>
      </div>

      {hasQualifications ? (
        <div className="space-y-3">
          {qualifications.map((q, idx) => {
            const severityClass = getSeverityBadgeClass(q.severity);
            const formattedSeverity = formatSeverity(q.severity);

            return (
              <div
                key={`${q.type}_${idx}`}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-code font-bold uppercase text-slate-200">
                    {q.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${severityClass}`}>
                    {formattedSeverity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {q.description}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>No qualifying conditions, severe afflictions, or adverse factors detected.</span>
        </div>
      )}
    </div>
  );
};
