import React from 'react';
import type {
  ReasoningDashaViewModel,
  ReasoningDashaPeriodViewModel
} from '../../product/analysis/reasoningViewModel';
import {
  formatEvidenceRole,
  formatDirection,
  formatActivationEffect,
  formatAvailability,
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass,
  getAvailabilityBadgeClass
} from './reasoningFormat';
import { Clock, AlertCircle } from 'lucide-react';

export interface ReasoningDashaSectionProps {
  readonly dasha: ReasoningDashaViewModel;
}

const LEVEL_LABELS: Record<'MD' | 'AD' | 'PD', string> = {
  MD: 'Mahadasha (MD)',
  AD: 'Antardasha (AD)',
  PD: 'Pratyantardasha (PD)'
};

const PeriodCard: React.FC<{ period: ReasoningDashaPeriodViewModel }> = ({ period }) => {
  const roleLabel = formatEvidenceRole(period.role);
  const directionLabel = formatDirection(period.direction);
  const effectLabel = formatActivationEffect(period.effect);
  const directionClass = getDirectionBadgeClass(period.direction);
  const roleClass = getEvidenceRoleBadgeClass(period.role);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
          {LEVEL_LABELS[period.level] || period.level}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleClass}`}>
          {roleLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-slate-100 font-sans">
          {period.planet ?? 'Unavailable'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}>
            {directionLabel}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
            {effectLabel}
          </span>
        </div>
      </div>

      {period.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
          {period.statement}
        </p>
      )}

      {(period.start || period.end) && (
        <div className="text-[10px] font-mono-code text-slate-400 pt-1">
          <span>
            {period.start ?? ''} {period.end ? `→ ${period.end}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export const ReasoningDashaSection: React.FC<ReasoningDashaSectionProps> = ({ dasha }) => {
  // CRITICAL: Render available cards for both AVAILABLE and PARTIAL. Only treat UNAVAILABLE as empty.
  const isAvailableOrPartial = dasha.status === 'AVAILABLE' || dasha.status === 'PARTIAL';
  const hasPeriods = dasha.periods && dasha.periods.length > 0;
  const badgeClass = getAvailabilityBadgeClass(dasha.status);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Chronological Vimshottari Dasha Activation</h2>
            <p className="text-xs text-slate-400">Temporal activation hierarchy via Mahadasha, Antardasha, and Pratyantardasha</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formatAvailability(dasha.status)}
          </span>
        </div>
      </div>

      {dasha.currentActivation && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {dasha.currentActivation}
        </p>
      )}

      {isAvailableOrPartial && hasPeriods ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dasha.periods.map((period, idx) => (
            <PeriodCard key={`${period.level}_${period.planet ?? idx}`} period={period} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            Dasha timing periods are unavailable for this calculation.
          </span>
        </div>
      )}
    </div>
  );
};
