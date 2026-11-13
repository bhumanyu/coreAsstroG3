import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WealthSpeculativePropensityViewModel, WealthRiskAndSuitabilityViewModel } from '../../product/analysis/wealthViewModel';
import { getSpeculativeRiskBadgeClass } from './wealthFormat';
import { Flame, AlertCircle, ShieldAlert } from 'lucide-react';

export interface WealthSpeculativeRiskSectionProps {
  readonly speculativePropensity: WealthSpeculativePropensityViewModel;
  readonly riskAndSuitability: WealthRiskAndSuitabilityViewModel;
}

export const WealthSpeculativeRiskSection: React.FC<WealthSpeculativeRiskSectionProps> = ({
  speculativePropensity,
  riskAndSuitability
}) => {
  const { t } = useTranslation('wealth');
  const isAvailable = speculativePropensity.status !== 'INSUFFICIENT_DATA';
  const badgeClass = getSpeculativeRiskBadgeClass(speculativePropensity.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 light:bg-white/80 light:border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Flame className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">{t('speculation.title')}</h2>
            <p className="text-xs text-slate-400 light:text-slate-500">{t('speculation.description')}</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {speculativePropensity.label}
          </span>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-3">
          {speculativePropensity.description && (
            <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans">
              {speculativePropensity.description}
            </p>
          )}

          {/* Explicit regulatory & methodological disclaimer - visually separated from accumulation */}
          <div className="flex items-start gap-2.5 text-xs text-slate-400 light:text-slate-500 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 light:bg-slate-50 light:border-slate-200">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">{t('disclaimers.speculative')}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 light:text-slate-500 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 light:bg-slate-50 light:border-slate-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {speculativePropensity.description ||
              t('speculation.unavailable')}
          </span>
        </div>
      )}
      {!isAvailable && (
        <div className="flex items-start gap-2.5 text-xs text-slate-400 light:text-slate-500 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 light:bg-slate-50 light:border-slate-200">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-relaxed">{t('disclaimers.speculative')}</span>
        </div>
      )}
      <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400 light:bg-slate-50 light:border-slate-200 light:text-slate-500">
        <p><strong className="text-slate-200 light:text-slate-900">{t('risk.actualExposure')}:</strong> {riskAndSuitability.actualExposure === 'AVAILABLE' ? t('speculation.sourceAvailable') : t('speculation.sourceUnavailable')}</p>
        <p><strong className="text-slate-200 light:text-slate-900">{t('risk.tradingHistory')}:</strong> {riskAndSuitability.tradingHistory === 'AVAILABLE' ? t('speculation.sourceAvailable') : t('speculation.historyUnavailable')}</p>
        <p><strong className="text-slate-200 light:text-slate-900">{t('risk.suitability')}:</strong> {t('speculation.suitabilityUnavailable')} {riskAndSuitability.suitabilityReason}</p>
      </div>
    </div>
  );
};
