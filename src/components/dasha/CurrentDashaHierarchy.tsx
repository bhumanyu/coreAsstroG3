import React from 'react';
import type { DashaPeriodViewModel } from '../../product/analysis/dashaViewModel';
import type { ProductAvailability } from '../../product/analysis/productAnalysisTypes';
import { DashaPeriodCard } from './DashaPeriodCard';
import { formatAvailability, getAvailabilityBadgeClass } from './dashaFormat';
import { Clock, Info } from 'lucide-react';

export interface CurrentDashaHierarchyProps {
  readonly hierarchy: readonly DashaPeriodViewModel[];
  readonly availability?: ProductAvailability;
}

export const CurrentDashaHierarchy: React.FC<CurrentDashaHierarchyProps> = ({
  hierarchy,
  availability = 'AVAILABLE'
}) => {
  const isAvailable = availability !== 'UNAVAILABLE';
  const availabilityLabel = formatAvailability(availability);
  const availabilityClass = getAvailabilityBadgeClass(availability);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Current Dasha Hierarchy</h2>
            <p className="text-xs text-slate-400">
              Planetary period sequence from primary Mahadasha ruler down to active Pratyantardasha refinement
            </p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${availabilityClass}`}
          >
            {availabilityLabel}
          </span>
        </div>
      </div>

      {/* Period Cards Grid */}
      {isAvailable && hierarchy.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hierarchy.map((period, idx) => (
            <DashaPeriodCard key={`${period.level}-${period.planet ?? 'unknown'}-${idx}`} period={period} />
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
          No active dasha periods available for current chart date.
        </div>
      )}

      {/* Semantic Hierarchy Notice */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Hierarchical Distinction:</strong> Mahadasha establishes primary baseline promise, Antardasha serves as active manifestation modifier, and Pratyantardasha operates as granular operational refinement. Evidential role and direction are independent dimensions.
        </p>
      </div>
    </div>
  );
};
