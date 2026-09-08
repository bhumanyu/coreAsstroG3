import React from 'react';
import type { OverviewDasha } from '../../product/analysis/overviewViewModel';
import type { ProductDashaPeriod } from '../../product/analysis/productAnalysisTypes';
import { formatDirection, formatEvidenceRole } from './overviewFormat';
import { Clock, ArrowRight, Calendar, Sparkles } from 'lucide-react';

export interface CurrentDashaCardProps {
  readonly dasha: OverviewDasha;
  readonly onOpenDasha?: () => void;
}

export const CurrentDashaCard: React.FC<CurrentDashaCardProps> = ({
  dasha,
  onOpenDasha
}) => {
  const levelNames: Record<string, string> = {
    MD: 'Mahadasha (MD)',
    AD: 'Antardasha (AD)',
    PD: 'Pratyantardasha (PD)'
  };

  const renderPeriodRow = (
    levelKey: 'MD' | 'AD' | 'PD',
    period?: ProductDashaPeriod
  ) => {
    const title = levelNames[levelKey];

    if (!period) {
      return (
        <div
          key={levelKey}
          className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase text-slate-400">
              {title}
            </span>
            <span className="text-xs text-slate-400">Unavailable</span>
          </div>
          <span className="text-xs font-mono-code text-slate-400">
            Timing Unavailable
          </span>
        </div>
      );
    }

    const planetName = period.planet || 'Unavailable';
    const roleText = formatEvidenceRole(period.role);
    const directionText = formatDirection(period.direction);

    return (
      <div
        key={levelKey}
        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-indigo-400">
              {title}
            </span>
            <span className="text-sm font-semibold text-slate-100">
              {planetName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              {roleText}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
              {directionText}
            </span>
          </div>
        </div>

        {period.statement && (
          <p className="text-xs text-slate-300 leading-relaxed">
            {period.statement}
          </p>
        )}

        {(period.start || period.end) && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span>
              {period.start || 'Start N/A'} — {period.end || 'End N/A'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      aria-label="Planetary Timing & Active Dasha Hierarchy"
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Current Planetary Timing (Vimshottari Dasha)
            </h3>
            <span className="text-xs text-slate-400">
              Hierarchical temporal activation window
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dasha.status === 'PARTIAL' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Partial
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono-code bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <Sparkles className="w-3 h-3 text-purple-400" aria-hidden="true" />
            <span>{dasha.currentPeriodLabel}</span>
          </span>
        </div>
      </div>

      {/* Summary */}
      {dasha.summary && (
        <div className="mt-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {dasha.summary}
          </p>
        </div>
      )}

      {/* Dasha Hierarchy */}
      <div className="mt-4 space-y-2.5">
        <h4 className="text-xs font-mono-code uppercase font-semibold text-slate-400 tracking-wider">
          Active Dasha Hierarchy (MD → AD → PD)
        </h4>
        <div className="space-y-2">
          {renderPeriodRow('MD', dasha.md)}
          {renderPeriodRow('AD', dasha.ad)}
          {renderPeriodRow('PD', dasha.pd)}
        </div>
      </div>

      {/* Footer Navigation */}
      {onOpenDasha && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onOpenDasha}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer group"
          >
            <span>View Complete Dasha Timeline & Activation Windows</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
};
