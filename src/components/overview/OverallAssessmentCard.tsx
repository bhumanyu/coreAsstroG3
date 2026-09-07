import React from 'react';
import type { OverviewOverall } from '../../product/analysis/overviewViewModel';
import { formatConfidence } from './overviewFormat';
import { Sparkles, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

export interface OverallAssessmentCardProps {
  readonly overall: OverviewOverall;
}

export const OverallAssessmentCard: React.FC<OverallAssessmentCardProps> = ({ overall }) => {
  const statusBadge = () => {
    switch (overall.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Complete Assessment</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Partial Assessment</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
            <span>Assessment Issue</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-slate-800 text-slate-300 border border-slate-700">
            <span>Assessment In Progress</span>
          </span>
        );
    }
  };

  const confidenceBadge = () => {
    const text = formatConfidence(overall.confidence);
    const colorClass =
      overall.confidence === 'HIGH'
        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
        : overall.confidence === 'MEDIUM'
        ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
        : 'bg-slate-800 border-slate-700 text-slate-300';

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-mono-code border ${colorClass}`}
      >
        {text}
      </span>
    );
  };

  return (
    <section
      aria-label="Overall Astrological Assessment"
      className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Overall Synthesis & Assessment
            </h2>
            <span className="text-xs text-slate-400">
              Aggregated life domain synthesis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge()}
          {confidenceBadge()}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
          {overall.summary}
        </p>
      </div>
    </section>
  );
};
