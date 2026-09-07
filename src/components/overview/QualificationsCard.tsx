import React from 'react';
import type { OverviewQualification } from '../../product/analysis/overviewViewModel';
import { formatSeverity } from './overviewFormat';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface QualificationsCardProps {
  readonly qualifications: readonly OverviewQualification[];
}

export const QualificationsCard: React.FC<QualificationsCardProps> = ({
  qualifications
}) => {
  const renderSeverityBadge = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const text = formatSeverity(severity);
    switch (severity) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300">
            {text}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
            {text}
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-slate-800 border border-slate-700 text-slate-300">
            {text}
          </span>
        );
    }
  };

  return (
    <section
      aria-label="Astrological Qualifications & Constraints"
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Qualifications & Modifiers
            </h3>
            <span className="text-xs text-slate-400">
              Astrological mitigating conditions and caveats
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {qualifications.length > 0 ? (
            qualifications.map((q, idx) => (
              <div
                key={`${q.id}-${idx}`}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                    {q.title}
                  </h4>
                  {renderSeverityBadge(q.severity)}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {q.statement}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" aria-hidden="true" />
              <span>No adverse astrological qualifications or mitigating constraints detected.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
