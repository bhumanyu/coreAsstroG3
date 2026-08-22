import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import type { DashaTimelinePeriodProduct, DashaTimelineProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatPlanetName } from '../fullNatalReport/reportUtils';
import { EmptyState } from '../fullNatalReport/EmptyState';

export interface DashaTimelineProps {
  readonly timeline: DashaTimelineProduct;
  readonly activeMahadashaPlanet?: string;
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  timeline,
  activeMahadashaPlanet
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (timeline.availability === 'UNAVAILABLE' || timeline.periods.length === 0) {
    return (
      <EmptyState
        title="Vimshottari Timeline Unavailable"
        message="Vimshottari 120-year planetary progression timeline could not be resolved."
        icon={<Clock className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section aria-labelledby="timeline-heading" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="timeline-heading" className="text-base sm:text-lg font-semibold text-slate-100">
              Vimshottari 120-Year Mahadasha Timeline
            </h2>
            <p className="text-xs text-slate-400">
              Complete chronological lifecycle sequence of major planetary cycles
            </p>
          </div>
        </div>
        <span className="text-xs font-mono-code text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
          {timeline.periods.length} Mahadashas
        </span>
      </div>

      {/* Grid of Mahadashas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {timeline.periods.map((period: DashaTimelinePeriodProduct, idx: number) => {
          const isActive = activeMahadashaPlanet
            ? period.planet.toUpperCase() === activeMahadashaPlanet.toUpperCase()
            : false;
          const isExpanded = expandedIndex === idx;
          const hasSubPeriods = period.antardashas && period.antardashas.length > 0;

          return (
            <div
              key={`${period.planet}-${period.start}-${idx}`}
              className={`rounded-2xl border transition-all ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base font-serif-astro text-slate-100">
                      {formatPlanetName(period.planet)}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Cycle #{period.index ?? idx + 1}
                  </span>
                </div>

                {/* Dates & Duration */}
                <div className="space-y-1 text-xs font-mono-code">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Start:</span>
                    <span>{period.start}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">End:</span>
                    <span>{period.end}</span>
                  </div>
                  {period.durationYears !== undefined && (
                    <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/40">
                      <span>Duration:</span>
                      <span className="text-indigo-300 font-semibold">{period.durationYears} Years</span>
                    </div>
                  )}
                </div>

                {/* Sub-Periods Toggle */}
                {hasSubPeriods && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono-code text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Antardashas' : `View 9 Antardashas`}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>

              {/* Collapsible Antardashas List */}
              {isExpanded && hasSubPeriods && (
                <div className="bg-slate-950/80 border-t border-slate-800/80 p-3 space-y-1.5 rounded-b-2xl max-h-48 overflow-y-auto">
                  <span className="text-[10px] font-mono-code uppercase text-slate-500 block mb-1">
                    Antardasha Sequence:
                  </span>
                  {period.antardashas!.map((ad, adIdx) => (
                    <div
                      key={`${ad.planet}-${ad.start}-${adIdx}`}
                      className="flex items-center justify-between text-[11px] font-mono-code p-1.5 rounded bg-slate-900/60 border border-slate-800/60"
                    >
                      <span className="text-purple-300 font-semibold">
                        {formatPlanetName(ad.planet)}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {ad.start} — {ad.end}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
