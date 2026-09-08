import React from 'react';
import type { DashaTransitViewModel } from '../../product/analysis/dashaViewModel';
import {
  formatAvailability,
  formatTransitEffect,
  getAvailabilityBadgeClass
} from './dashaFormat';
import { Compass, Info } from 'lucide-react';

export interface TransitTimingSectionProps {
  readonly transit: DashaTransitViewModel;
}

export const TransitTimingSection: React.FC<TransitTimingSectionProps> = ({ transit }) => {
  const isAvailable = transit.status !== 'UNAVAILABLE';
  const availabilityLabel = formatAvailability(transit.status);
  const availabilityClass = getAvailabilityBadgeClass(transit.status);
  const effectLabel = formatTransitEffect(transit.effect);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Transit Timing</h2>
            <p className="text-xs text-slate-400">
              Gochara transit movements evaluated strictly as trigger and timing context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${availabilityClass}`}
          >
            {availabilityLabel}
          </span>
        </div>
      </div>

      {/* Transit State Card */}
      {isAvailable ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
              Transit Effect
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase border bg-sky-950/60 border-sky-800/80 text-sky-300">
              {effectLabel}
            </span>
          </div>

          {transit.statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {transit.statement}
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
          Transit timing data currently unavailable for chart date.
        </div>
      )}

      {/* Methodological Context Callout */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Planetary transits provide timing or trigger context for natal potentials without generating isolated predictions.
        </p>
      </div>
    </div>
  );
};
