import React from 'react';
import { PageHeading } from '../layout/PageHeading';
import type { DashaHeroViewModel } from '../../product/analysis/dashaViewModel';
import { formatAvailability, getAvailabilityBadgeClass } from './dashaFormat';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface DashaHeroProps {
  readonly hero: DashaHeroViewModel;
}

export const DashaHero: React.FC<DashaHeroProps> = ({ hero }) => {
  const warnings = hero.warnings || [];

  const mdPlanet = hero.mdPlanet || 'Unavailable';
  const adPlanet = hero.adPlanet || 'Unavailable';
  const pdPlanet = hero.pdPlanet || 'Unavailable';

  const availabilityLabel = formatAvailability(hero.availability);
  const availabilityClass = getAvailabilityBadgeClass(hero.availability);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Planetary Period Timing"
        title="Dasha & Planetary Timing"
        description="Chronological Vimshottari Dasha activation hierarchy (Mahadasha, Antardasha, Pratyantardasha) synthesized with domain activations and transit triggers."
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-code ${availabilityClass}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{availabilityLabel}</span>
          </div>

          {warnings.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono-code">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>
                {warnings.length} {warnings.length === 1 ? 'Notice' : 'Notices'}
              </span>
            </div>
          )}
        </div>
      </PageHeading>

      {/* Active Periods Overview Card */}
      <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              Active Hierarchy Window
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-400">
            Current: {hero.currentPeriodLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              Mahadasha (MD)
            </span>
            <div className="text-base font-bold text-slate-100">{mdPlanet}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              Antardasha (AD)
            </span>
            <div className="text-base font-bold text-slate-100">{adPlanet}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              Pratyantardasha (PD)
            </span>
            <div className="text-base font-bold text-slate-100">{pdPlanet}</div>
          </div>
        </div>

        {hero.summary && (
          <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1 border-t border-slate-800/60">
            {hero.summary}
          </p>
        )}
      </div>
    </div>
  );
};
