import React from 'react';
import type { ReasoningTransitViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatAvailability,
  formatTransitEffect,
  getAvailabilityBadgeClass
} from './reasoningFormat';
import { Compass, AlertCircle } from 'lucide-react';

export interface ReasoningTransitSectionProps {
  readonly transit: ReasoningTransitViewModel;
}

export const ReasoningTransitSection: React.FC<ReasoningTransitSectionProps> = ({ transit }) => {
  const isAvailableOrPartial = transit.status === 'AVAILABLE' || transit.status === 'PARTIAL';
  const badgeClass = getAvailabilityBadgeClass(transit.status);
  const formattedEffect = formatTransitEffect(transit.effect);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Gochara (Transit) Triggers</h2>
            <p className="text-xs text-slate-400">Secondary real-time planetary catalysts relative to natal baseline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
            {formattedEffect}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formatAvailability(transit.status)}
          </span>
        </div>
      </div>

      {isAvailableOrPartial ? (
        <div className="space-y-2">
          {transit.statement ? (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {transit.statement}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No significant material transit triggers active for this period.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {transit.statement || 'Planetary transit data is unavailable for this calculation.'}
          </span>
        </div>
      )}
    </div>
  );
};
