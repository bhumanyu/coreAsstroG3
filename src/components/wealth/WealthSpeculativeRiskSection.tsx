import React from 'react';
import type { WealthSpeculativePropensityViewModel, WealthRiskAndSuitabilityViewModel } from '../../product/analysis/wealthViewModel';
import { formatSpeculativeRiskLevel, getSpeculativeRiskBadgeClass } from './wealthFormat';
import { Flame, AlertCircle, ShieldAlert } from 'lucide-react';

export interface WealthSpeculativeRiskSectionProps {
  readonly speculativePropensity: WealthSpeculativePropensityViewModel;
  readonly riskAndSuitability: WealthRiskAndSuitabilityViewModel;
}

export const WealthSpeculativeRiskSection: React.FC<WealthSpeculativeRiskSectionProps> = ({
  speculativePropensity,
  riskAndSuitability
}) => {
  const isAvailable = speculativePropensity.status !== 'INSUFFICIENT_DATA';
  const formattedLevel = formatSpeculativeRiskLevel(speculativePropensity.status);
  const badgeClass = getSpeculativeRiskBadgeClass(speculativePropensity.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Flame className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Astrological Speculative Propensity</h2>
            <p className="text-xs text-slate-400">Chart-derived indication only; not a measurement of behaviour, exposure, or risk capacity.</p>
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
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {speculativePropensity.description}
            </p>
          )}

          {/* Explicit regulatory & methodological disclaimer - visually separated from accumulation */}
          <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">
              Astrological indication only. It is not a measure of actual trading exposure, trading history, risk capacity, expected return, or probability of profit/loss. It does not provide buy, sell, hold, options, leverage, instrument, or position-size recommendations.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {speculativePropensity.description ||
              'Astrological speculative propensity is unavailable for this chart calculation.'}
          </span>
        </div>
      )}
      <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400">
        <p><strong className="text-slate-200">Actual exposure:</strong> {riskAndSuitability.actualExposure === 'AVAILABLE' ? 'Explicit financial source data is available.' : 'Unavailable — no user-reported or connected financial source was supplied.'}</p>
        <p><strong className="text-slate-200">Trading history:</strong> {riskAndSuitability.tradingHistory === 'AVAILABLE' ? 'Explicit source data is available.' : 'Unavailable — not inferred from a horoscope.'}</p>
        <p><strong className="text-slate-200">Suitability:</strong> Unavailable. {riskAndSuitability.suitabilityReason}</p>
      </div>
    </div>
  );
};
