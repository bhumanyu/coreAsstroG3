import React from 'react';
import type { DashaQualificationViewModel } from '../../product/analysis/dashaViewModel';
import { formatSeverity, getSeverityBadgeClass } from './dashaFormat';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface DashaQualificationSectionProps {
  readonly qualifications: readonly DashaQualificationViewModel[];
}

export const DashaQualificationSection: React.FC<DashaQualificationSectionProps> = ({
  qualifications
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Qualifications & Modifiers</h2>
            <p className="text-xs text-slate-400">
              Combustions, retrogression, debilities, and functional mitigating factors
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          {qualifications.length} {qualifications.length === 1 ? 'Condition' : 'Conditions'}
        </span>
      </div>

      {qualifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qualifications.map((q) => {
            const severityLabel = formatSeverity(q.severity);
            const severityClass = getSeverityBadgeClass(q.severity);

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono-code tracking-wider">
                    {q.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${severityClass}`}
                  >
                    {severityLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {q.statement}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>No astrological qualifications or mitigating conditions identified.</span>
        </div>
      )}
    </div>
  );
};
