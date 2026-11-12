import React from 'react';
import { PageHeading } from '../layout/PageHeading';
import type { WealthHeroViewModel } from '../../product/analysis/wealthViewModel';
import { formatConfidence } from './wealthFormat';
import { Compass, Moon, Sun, Star, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface WealthHeroProps {
  readonly hero: WealthHeroViewModel;
}

export const WealthHero: React.FC<WealthHeroProps> = ({ hero }) => {
  const { t } = useTranslation('wealth');
  const ascendant = hero.ascendantSign || t('ui.hero.unavailable');
  const moon = hero.moonSign || t('ui.hero.unavailable');
  const sun = hero.sunSign || t('ui.hero.unavailable');
  const nakshatra = hero.moonNakshatra || t('ui.hero.unavailable');
  const warnings = hero.warnings || [];

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={t('ui.hero.eyebrow')}
        title={t('ui.hero.title')}
        description={t('ui.hero.description')}
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
                {t(warnings.length === 1 ? 'ui.hero.notices' : 'ui.hero.noticePlural', { count: warnings.length })}
              </span>
            </div>
          )}
        </div>
      </PageHeading>

      {/* Astrological Chart Context Chips */}
      <div
        aria-label={t('ui.hero.chartPositions')}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-2"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Compass className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('ui.hero.ascendant')}</span>
            <span className="font-semibold text-slate-200">{ascendant}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Moon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('ui.hero.moonSign')}</span>
            <span className="font-semibold text-slate-200">{moon}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('ui.hero.sunSign')}</span>
            <span className="font-semibold text-slate-200">{sun}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Star className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('ui.hero.nakshatra')}</span>
            <span className="font-semibold text-slate-200">{nakshatra}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
