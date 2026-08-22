import React from 'react';
import { Calendar, Shield, Sparkles, Home, Star } from 'lucide-react';
import type { DashaCurrentPeriodProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatPlanetName, formatSignName } from '../fullNatalReport/reportUtils';
import { formatEnum } from '../lifeAnalysis/lifeAnalysisUx';

export interface DashaPeriodCardProps {
  readonly period: DashaCurrentPeriodProduct;
  readonly isPrimary?: boolean;
}

export const DashaPeriodCard: React.FC<DashaPeriodCardProps> = ({
  period,
  isPrimary = false
}) => {
  const { level, planet, start, end, placement, ownedHouses, functionalRoles, functionalNature, dignity, state, confidence } = period;

  const levelConfigs = {
    MD: {
      title: 'Mahadasha',
      subtitle: 'Major Period',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      borderClass: 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950',
      headingSize: 'text-2xl',
      glowColor: 'shadow-indigo-500/10'
    },
    AD: {
      title: 'Antardasha',
      subtitle: 'Sub-Period',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      borderClass: 'border-purple-500/30 bg-gradient-to-b from-purple-950/30 via-slate-900 to-slate-950',
      headingSize: 'text-xl',
      glowColor: 'shadow-purple-500/10'
    },
    PD: {
      title: 'Pratyantardasha',
      subtitle: 'Sub-Sub-Period',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderClass: 'border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950',
      headingSize: 'text-lg',
      glowColor: 'shadow-amber-500/10'
    }
  }[level];

  return (
    <article
      aria-label={`${levelConfigs.title} Active Period for ${formatPlanetName(planet)}`}
      className={`rounded-2xl border p-5 space-y-4 shadow-lg transition-all ${levelConfigs.borderClass} ${levelConfigs.glowColor}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono-code font-bold uppercase tracking-wider border ${levelConfigs.badgeBg}`}
          >
            {level} • {levelConfigs.title}
          </span>
          <span className="text-xs text-slate-400 font-sans">
            ({levelConfigs.subtitle})
          </span>
        </div>

        {confidence && (
          <span className="text-[11px] font-mono-code text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Confidence: <span className="text-indigo-300 font-semibold">{formatEnum(confidence)}</span>
          </span>
        )}
      </div>

      {/* Planet & Duration */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className={`font-bold font-serif-astro text-slate-100 tracking-wide ${levelConfigs.headingSize}`}>
            {formatPlanetName(planet)}
          </h3>
          {placement && (
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-400 font-mono-code">Placed in:</span>
              <span className="font-semibold text-slate-200">
                {formatSignName(placement.sign)} (House {placement.house})
              </span>
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-code text-slate-300 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
            <span>{start}</span>
            <span className="text-slate-500">→</span>
            <span>{end}</span>
          </div>
        </div>
      </div>

      {/* Astrological Attributes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        {/* House Ownership */}
        {ownedHouses && ownedHouses.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <Home className="w-3 h-3 text-indigo-400" aria-hidden="true" />
              Owned Houses
            </span>
            <p className="font-mono-code font-bold text-slate-200">
              {ownedHouses.map(h => `H${h}`).join(', ')}
            </p>
          </div>
        )}

        {/* Functional Roles */}
        {functionalRoles && functionalRoles.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" aria-hidden="true" />
              Functional Nature
            </span>
            <p className="font-medium text-purple-300 truncate" title={functionalRoles.map(formatEnum).join(', ')}>
              {functionalRoles.map(formatEnum).join(', ')}
            </p>
          </div>
        )}

        {/* Dignity & State */}
        {(dignity || state) && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" aria-hidden="true" />
              Dignity / State
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-[11px]">
              {dignity && (
                <span className="font-bold text-amber-300">
                  {formatEnum(dignity)}
                </span>
              )}
              {state && state !== 'NORMAL' && (
                <span className="text-rose-400">
                  • {formatEnum(state)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
