import React from 'react';
import { Anchor, Compass, Calendar } from 'lucide-react';
import type { DashaBirthAnchorProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatPlanetName } from '../fullNatalReport/reportUtils';

export interface DashaBirthAnchorProps {
  readonly birthAnchor?: DashaBirthAnchorProduct;
}

export const DashaBirthAnchor: React.FC<DashaBirthAnchorProps> = ({ birthAnchor }) => {
  if (!birthAnchor) {
    return null;
  }

  const hasBalance =
    birthAnchor.balanceYears !== undefined ||
    birthAnchor.balanceMonths !== undefined ||
    birthAnchor.balanceDays !== undefined;

  return (
    <div
      aria-label="Vimshottari Birth Dasha Anchor"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Anchor className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Birth Dasha Anchor (Janma Nakshatra)
            </h3>
            <p className="text-xs text-slate-400">
              Initial Vimshottari period determined by Moon's natal nakshatra degree
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Vimshottari Baseline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-code text-xs">
        {/* Janma Nakshatra */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            Moon Nakshatra
          </span>
          <p className="text-sm font-bold text-indigo-300">
            {birthAnchor.nakshatra}
          </p>
        </div>

        {/* Nakshatra Lord (Starting MD Lord) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <Anchor className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            Starting Dasha Lord
          </span>
          <p className="text-sm font-bold text-purple-300 font-serif-astro">
            {formatPlanetName(birthAnchor.nakshatraLord)}
          </p>
        </div>

        {/* Balance of Dasha at Birth */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            Balance at Birth
          </span>
          <p className="text-sm font-bold text-amber-300">
            {hasBalance
              ? `${birthAnchor.balanceYears ?? 0}y ${birthAnchor.balanceMonths ?? 0}m ${birthAnchor.balanceDays ?? 0}d`
              : birthAnchor.remainingFraction !== undefined
              ? `${(birthAnchor.remainingFraction * 100).toFixed(1)}% remaining`
              : 'Computed'}
          </p>
        </div>
      </div>
    </div>
  );
};
