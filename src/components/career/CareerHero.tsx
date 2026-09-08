import React from 'react';
import { PageHeading } from '../layout/PageHeading';
import type { CareerHeroViewModel } from '../../product/analysis/careerViewModel';
import { formatConfidence } from './careerFormat';
import { Compass, Moon, Sun, Star, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface CareerHeroProps {
  readonly hero: CareerHeroViewModel;
}

export const CareerHero: React.FC<CareerHeroProps> = ({ hero }) => {
  const ascendant = hero.ascendantSign || 'Unavailable';
  const moon = hero.moonSign || 'Unavailable';
  const sun = hero.sunSign || 'Unavailable';
  const nakshatra = hero.moonNakshatra || 'Unavailable';
  const warnings = hero.warnings || [];

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Life Domain Analysis"
        title="Career & Professional Trajectory"
        description="Comprehensive evaluation of vocational capacity, Dasamsa (D10) divisional alignment, active dasha timing, and transit triggers."
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono-code">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{formatConfidence(hero.confidence)}</span>
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

      {/* Astrological Chart Context Chips */}
      <div
        aria-label="Natal Chart Sign Positions"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-2"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Compass className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Ascendant</span>
            <span className="font-semibold text-slate-200">{ascendant}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Moon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Moon Sign</span>
            <span className="font-semibold text-slate-200">{moon}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Sun Sign</span>
            <span className="font-semibold text-slate-200">{sun}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Star className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Nakshatra</span>
            <span className="font-semibold text-slate-200">{nakshatra}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
