import React from 'react';
import type { ReasoningTransitViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatAvailability,
  formatTransitEffect,
  getAvailabilityBadgeClass
} from './reasoningFormat';
import { Compass, AlertCircle, Briefcase, Coins } from 'lucide-react';

export interface ReasoningTransitComparisonProps {
  readonly careerTransit?: ReasoningTransitViewModel;
  readonly wealthTransit?: ReasoningTransitViewModel;
}

export const ReasoningTransitComparison: React.FC<ReasoningTransitComparisonProps> = ({
  careerTransit,
  wealthTransit
}) => {
  const isCareerAvailable =
    careerTransit?.status === 'AVAILABLE' || careerTransit?.status === 'PARTIAL';
  const careerBadgeClass = getAvailabilityBadgeClass(careerTransit?.status ?? 'UNAVAILABLE');
  const careerFormattedEffect = formatTransitEffect(careerTransit?.effect ?? 'UNAVAILABLE');

  const isWealthAvailable =
    wealthTransit?.status === 'AVAILABLE' || wealthTransit?.status === 'PARTIAL';
  const wealthBadgeClass = getAvailabilityBadgeClass(wealthTransit?.status ?? 'UNAVAILABLE');
  const wealthFormattedEffect = formatTransitEffect(wealthTransit?.effect ?? 'UNAVAILABLE');

  return (
    <section
      id="section-transit-timing"
      aria-label="Transit Timing"
      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Transit Timing</h2>
            <p className="text-xs text-slate-400">
              Independent real-time Gochara planetary catalysts for Career and Wealth
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          Gochara Catalysts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Career Transit Cell */}
        <div
          id="transit-cell-career"
          className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3.5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Career Transit Timing</h3>
                  <span className="text-[11px] font-mono-code text-slate-400 block">
                    Vocational Triggers & Pressure
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
                  {careerFormattedEffect}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${careerBadgeClass}`}
                >
                  {formatAvailability(careerTransit?.status ?? 'UNAVAILABLE')}
                </span>
              </div>
            </div>

            {isCareerAvailable ? (
              <div className="space-y-2">
                {careerTransit?.statement ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {careerTransit.statement}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Career transit timing is active; no detailed transit statement provided.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {careerTransit?.statement || 'Unavailable: Career planetary transit data is unavailable.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Wealth Transit Cell */}
        <div
          id="transit-cell-wealth"
          className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3.5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Wealth Transit Timing</h3>
                  <span className="text-[11px] font-mono-code text-slate-400 block">
                    Financial Catalysts & Modifiers
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
                  {wealthFormattedEffect}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${wealthBadgeClass}`}
                >
                  {formatAvailability(wealthTransit?.status ?? 'UNAVAILABLE')}
                </span>
              </div>
            </div>

            {isWealthAvailable ? (
              <div className="space-y-2">
                {wealthTransit?.statement ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {wealthTransit.statement}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Wealth transit timing is active; no detailed transit statement provided.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {wealthTransit?.statement || 'Unavailable: Wealth planetary transit data is unavailable.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
