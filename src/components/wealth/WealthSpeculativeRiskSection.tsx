import React from 'react';
import type { WealthSpeculativeRiskViewModel } from '../../product/analysis/wealthViewModel';
import { formatSpeculativeRiskLevel, getSpeculativeRiskBadgeClass } from './wealthFormat';
import { Flame, AlertCircle, ShieldAlert } from 'lucide-react';

export interface WealthSpeculativeRiskSectionProps {
  readonly speculativeRisk?: WealthSpeculativeRiskViewModel;
}

export const WealthSpeculativeRiskSection: React.FC<WealthSpeculativeRiskSectionProps> = ({
  speculativeRisk
}) => {
  const isAvailable = Boolean(
    speculativeRisk &&
      speculativeRisk.level &&
      speculativeRisk.level.toUpperCase() !== 'UNAVAILABLE'
  );
  const formattedLevel = formatSpeculativeRiskLevel(speculativeRisk?.level);
  const badgeClass = getSpeculativeRiskBadgeClass(speculativeRisk?.level);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Flame className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Speculative Risk & Market Exposure Profile</h2>
            <p className="text-xs text-slate-400">Classical 5th house assessment of venture propensity and volatility exposure</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formattedLevel}
          </span>
        </div>
      </div>

      {isAvailable && speculativeRisk ? (
        <div className="space-y-3">
          {speculativeRisk.description && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {speculativeRisk.description}
            </p>
          )}

          {/* Explicit regulatory & methodological disclaimer - visually separated from accumulation */}
          <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">
              Astrological risk evaluation only. This assessment evaluates classical karmic risk appetite and 5th house tendencies. It does not constitute financial, investment, or trading advice. No market recommendations (Buy/Sell/Hold/Options) are provided.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {speculativeRisk?.description ||
              'Speculative risk assessment is unavailable for this chart calculation.'}
          </span>
        </div>
      )}
    </div>
  );
};
