import React from 'react';
import { PageHeading } from '../layout/PageHeading';
import type { DashaHeroViewModel } from '../../product/analysis/dashaViewModel';
import { getAvailabilityBadgeClass } from './dashaFormat';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface DashaHeroProps {
  readonly hero: DashaHeroViewModel;
}

export const DashaHero: React.FC<DashaHeroProps> = ({ hero }) => {
  const { t } = useTranslation('dasha');
  const { t: tEnum } = useTranslation('enums');
  const warnings = hero.warnings || [];

  const unavailablePlanet = t('hero.unavailablePlanet');
  const mdPlanet = hero.mdPlanet || unavailablePlanet;
  const adPlanet = hero.adPlanet || unavailablePlanet;
  const pdPlanet = hero.pdPlanet || unavailablePlanet;

  const availabilityLabel = enumLabel(tEnum, 'dashaAvailability', hero.availability);
  const availabilityClass = getAvailabilityBadgeClass(hero.availability);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        description={t('hero.description')}
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
              <span>{t('hero.notices', { count: warnings.length })}</span>
            </div>
          )}
        </div>
      </PageHeading>

      <p className="text-xs text-slate-400" role="note">
        {t('hero.disclaimer')}
      </p>

      {/* Active Periods Overview Card */}
      <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              {t('hero.activeHierarchyWindow')}
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-400">
            {t('hero.currentPeriod', { period: hero.currentPeriodLabel })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              {t('hero.mahadasha')}
            </span>
            <div className="text-base font-bold text-slate-100">{mdPlanet}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              {t('hero.antardasha')}
            </span>
            <div className="text-base font-bold text-slate-100">{adPlanet}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              {t('hero.pratyantardasha')}
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
