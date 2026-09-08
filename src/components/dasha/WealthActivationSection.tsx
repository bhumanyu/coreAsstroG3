import React from 'react';
import type { DashaDomainActivationViewModel } from '../../product/analysis/dashaViewModel';
import { formatAvailability, getAvailabilityBadgeClass } from './dashaFormat';
import { DashaPeriodCard } from './DashaPeriodCard';
import { Coins } from 'lucide-react';

export interface WealthActivationSectionProps {
  readonly activation: DashaDomainActivationViewModel;
}

export const WealthActivationSection: React.FC<WealthActivationSectionProps> = ({ activation }) => {
  const isAvailable = activation.status !== 'UNAVAILABLE';
  const availabilityLabel = formatAvailability(activation.status);
  const availabilityClass = getAvailabilityBadgeClass(activation.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Coins className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Wealth Activation</h2>
            <p className="text-xs text-slate-400">
              Financial asset activation, gains, and capital accumulation timing
            </p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${availabilityClass}`}
          >
            {availabilityLabel}
          </span>
        </div>
      </div>

      {/* Synthesis Statement */}
      {activation.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/50 p-4 rounded-xl border border-slate-800/70">
          {activation.statement}
        </p>
      )}

      {/* Domain Specific Dasha Periods */}
      {isAvailable && activation.periods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activation.periods.map((period, idx) => (
            <DashaPeriodCard key={`wealth-${period.level}-${period.planet ?? 'p'}-${idx}`} period={period} />
          ))}
        </div>
      ) : !activation.statement ? (
        <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
          Wealth dasha activation data unavailable for current chart date.
        </div>
      ) : null}
    </div>
  );
};
