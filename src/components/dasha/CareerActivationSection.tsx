import React from 'react';
import type { DashaDomainActivationViewModel } from '../../product/analysis/dashaViewModel';
import { formatAvailability, getAvailabilityBadgeClass } from './dashaFormat';
import { DashaPeriodCard } from './DashaPeriodCard';
import { Briefcase, AlertCircle } from 'lucide-react';

export interface CareerActivationSectionProps {
  readonly activation: DashaDomainActivationViewModel;
}

export const CareerActivationSection: React.FC<CareerActivationSectionProps> = ({ activation }) => {
  const isAvailable = activation.status !== 'UNAVAILABLE';
  const availabilityLabel = formatAvailability(activation.status);
  const availabilityClass = getAvailabilityBadgeClass(activation.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Briefcase className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Career Activation</h2>
            <p className="text-xs text-slate-400">
              Vocational activation and timing triggers for professional trajectory
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

      {/* Pressure/Challenge Notice */}
      {activation.currentPressure && (
        <div className="flex items-start gap-2.5 text-xs text-amber-300 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold block text-[11px] uppercase tracking-wider font-mono-code text-amber-200">
              Active Structural Pressure
            </span>
            <p className="mt-0.5 leading-relaxed">{activation.currentPressure}</p>
          </div>
        </div>
      )}

      {/* Domain Specific Dasha Periods */}
      {isAvailable && activation.periods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activation.periods.map((period, idx) => (
            <DashaPeriodCard key={`career-${period.level}-${period.planet ?? 'p'}-${idx}`} period={period} />
          ))}
        </div>
      ) : !activation.statement ? (
        <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
          Career dasha activation data unavailable for current chart date.
        </div>
      ) : null}
    </div>
  );
};
