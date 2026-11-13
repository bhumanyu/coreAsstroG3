import React from 'react';
import type { WealthOverallViewModel } from '../../product/analysis/wealthViewModel';
import {
  getPromiseStrengthBadgeClass,
  getConclusionStatusBadgeClass
} from './wealthFormat';
import { Coins, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel, enumLabelWithFallback } from '../../i18n/enumLabels';

export interface WealthOverallSectionProps {
  readonly overall: WealthOverallViewModel;
}

export const WealthOverallSection: React.FC<WealthOverallSectionProps> = ({ overall }) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  const formattedStrength = enumLabelWithFallback(tEnum, 'promiseStrength', 'productDirection', overall.promise);
  const formattedStatus = enumLabel(tEnum, 'wealthDimensionStatus', overall.status);
  const formattedConfidence = enumLabel(tEnum, 'productConfidence', overall.confidence);

  const promiseBadgeClass = getPromiseStrengthBadgeClass(overall.promise);
  const statusBadgeClass = getConclusionStatusBadgeClass(overall.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 light:bg-white/80 light:border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Coins className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">{t('ui.overall.title')}</h2>
            <p className="text-xs text-slate-400 light:text-slate-500">{t('ui.overall.description')}</p>
          </div>
        </div>

        {/* Three separate dimensions rendered in header badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${promiseBadgeClass}`}
          >
            {formattedStrength}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${statusBadgeClass}`}
          >
            {formattedStatus}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300 light:bg-slate-100 light:border-slate-200 light:text-slate-700">
            {formattedConfidence}
          </span>
        </div>
      </div>

      {/* Three separate dimension metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 light:bg-slate-50 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 light:text-slate-500 font-mono-code uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{t('ui.overall.natalPromise')}</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-sans">
            {formattedStrength}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500">{t('ui.overall.promiseDescription')}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 light:bg-slate-50 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 light:text-slate-500 font-mono-code uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
            <span>{t('ui.overall.domainConclusion')}</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-sans">
            {formattedStatus}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500">{t('ui.overall.conclusionDescription')}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 light:bg-slate-50 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 light:text-slate-500 font-mono-code uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('ui.overall.confidence')}</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-sans">
            {formattedConfidence}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500">{t('ui.overall.confidenceDescription')}</p>
        </div>
      </div>

      {overall.headline && (
        <h3 className="text-sm font-semibold text-slate-200 light:text-slate-900">
          {overall.headline}
        </h3>
      )}

      {overall.statement && (
        <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans">
          {overall.statement}
        </p>
      )}
    </div>
  );
};
