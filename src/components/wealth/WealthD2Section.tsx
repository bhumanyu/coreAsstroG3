import React from 'react';
import type { WealthD2ViewModel } from '../../product/analysis/wealthViewModel';
import { getD2RelationshipBadgeClass } from './wealthFormat';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface WealthD2SectionProps {
  readonly d2: WealthD2ViewModel;
}

export const WealthD2Section: React.FC<WealthD2SectionProps> = ({ d2 }) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  const formattedRelationship = enumLabel(tEnum, 'divisionalRelationship', d2.relationship);
  const badgeClass = getD2RelationshipBadgeClass(d2.relationship);
  const isAvailable = d2.relationship !== 'UNAVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 light:bg-white/80 light:border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">{t('ui.d2.title')}</h2>
            <p className="text-xs text-slate-400 light:text-slate-500">{t('ui.d2.description')}</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formattedRelationship}
          </span>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-3">
          {d2.statement && (
            <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans">
              {d2.statement}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 light:text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 light:bg-slate-50 light:border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>
              {t('ui.d2.evaluated')}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 light:text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 light:bg-slate-50 light:border-slate-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {d2.statement ?? (d2.relationship === 'UNAVAILABLE' ? t('ui.d2.unavailable') : '')}
          </span>
        </div>
      )}
    </div>
  );
};
