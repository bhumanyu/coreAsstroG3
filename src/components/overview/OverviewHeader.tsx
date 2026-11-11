import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '../layout/PageHeading';
import type { OverviewChart } from '../../product/analysis/overviewViewModel';
import type { ProductWarning } from '../../product/analysis/productAnalysisTypes';
import { Compass, Moon, Sun, Star, AlertTriangle } from 'lucide-react';

export interface OverviewHeaderProps {
  readonly chart?: OverviewChart;
  readonly warnings?: readonly ProductWarning[];
}

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  chart,
  warnings = []
}) => {
  const { t } = useTranslation('dashboard');
  const ascendant = chart?.ascendantSign || t('unavailable');
  const moon = chart?.moonSign || t('unavailable');
  const sun = chart?.sunSign || t('unavailable');
  const nakshatra = chart?.moonNakshatra || t('unavailable');

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={t('header.eyebrow')}
        title={t('header.title')}
        description={t('header.description')}
      >
        {warnings.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono-code">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>{t(warnings.length === 1 ? 'header.notice' : 'header.notices', { count: warnings.length })}</span>
          </div>
        )}
      </PageHeading>

      {/* Astrological Chart Context Chips */}
      <div
        aria-label={t('header.signPositions')}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-2"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Compass className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('header.ascendant')}</span>
            <span className="font-semibold text-slate-200">{ascendant}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Moon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('header.moonSign')}</span>
            <span className="font-semibold text-slate-200">{moon}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('header.sunSign')}</span>
            <span className="font-semibold text-slate-200">{sun}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Star className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px] uppercase font-mono-code">{t('header.nakshatra')}</span>
            <span className="font-semibold text-slate-200">{nakshatra}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
