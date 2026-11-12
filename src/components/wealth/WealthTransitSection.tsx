import React from 'react';
import type { WealthTransitViewModel } from '../../product/analysis/wealthViewModel';
import { formatTransitEffect } from './wealthFormat';
import { Orbit, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface WealthTransitSectionProps {
  readonly transit: WealthTransitViewModel;
}

export const WealthTransitSection: React.FC<WealthTransitSectionProps> = ({ transit }) => {
  const { t } = useTranslation('wealth');
  const isAvailable = transit.status === 'AVAILABLE';
  const formattedEffect = formatTransitEffect(transit.effect);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Orbit className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t('ui.transit.title')}</h2>
            <p className="text-xs text-slate-400">{t('ui.transit.description')}</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
              isAvailable
                ? 'bg-sky-950/60 border-sky-800/80 text-sky-300'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
            }`}
          >
            {formattedEffect}
          </span>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-2">
          {transit.statement ? (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {transit.statement}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-sans italic">
              {t('ui.transit.active')}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {transit.statement || t('ui.transit.unavailable')}
          </span>
        </div>
      )}
    </div>
  );
};
