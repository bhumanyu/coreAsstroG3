import React from 'react';
import type { WealthQualificationViewModel } from '../../product/analysis/wealthViewModel';
import { formatSeverity, getSeverityBadgeClass } from './wealthFormat';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface WealthQualificationsSectionProps {
  readonly qualifications: readonly WealthQualificationViewModel[];
}

export const WealthQualificationsSection: React.FC<WealthQualificationsSectionProps> = ({
  qualifications
}) => {
  const hasQualifications = qualifications.length > 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Qualifications & Modifiers</h2>
            <p className="text-xs text-slate-400">Expenditure pressures (12th house), combustions, debilities, and functional mitigating factors</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          {qualifications.length} {qualifications.length === 1 ? 'Condition' : 'Conditions'}
        </span>
      </div>

      {hasQualifications ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {qualifications.map((q, idx) => {
            const severityLabel = formatSeverity(q.severity);
            const severityClass = getSeverityBadgeClass(q.severity);

            return (
              <div
                key={`${q.type}-${idx}`}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
                    {q.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${severityClass}`}
                  >
                    {severityLabel}
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
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>No critical functional debilities or adverse qualifications detected in this analysis.</span>
        </div>
      )}
    </div>
  );
};
