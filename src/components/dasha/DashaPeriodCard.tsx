import React from 'react';
import type { DashaPeriodViewModel } from '../../product/analysis/dashaViewModel';
import {
  formatDashaLevel,
  formatRole,
  formatDirection,
  getRoleBadgeClass,
  getDirectionBadgeClass
} from './dashaFormat';
import { Calendar } from 'lucide-react';

export interface DashaPeriodCardProps {
  readonly period: DashaPeriodViewModel;
}

export const DashaPeriodCard: React.FC<DashaPeriodCardProps> = ({ period }) => {
  const levelLabel = formatDashaLevel(period.level);
  const roleLabel = formatRole(period.role);
  const directionLabel = formatDirection(period.direction);
  const roleClass = getRoleBadgeClass(period.role);
  const directionClass = getDirectionBadgeClass(period.direction);

  const hasDates = Boolean(period.start && period.end);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Top Header: Level & Role */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
          {levelLabel}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleClass}`}
        >
          {roleLabel}
        </span>
      </div>

      {/* Planet & Direction */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-bold text-slate-100 font-sans">
          {period.planet || 'Unavailable'}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}
          >
            {directionLabel}
          </span>
          {period.effect && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
              {period.effect}
            </span>
          )}
        </div>
      </div>

      {/* Dates Interval */}
      {hasDates && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono-code">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <span>
            {period.start} → {period.end}
          </span>
        </div>
      )}

      {/* Statement */}
      {period.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
          {period.statement}
        </p>
      )}

      {!period.available && (
        <div className="text-[10px] font-mono-code text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
          Period data partially unavailable
        </div>
      )}
    </div>
  );
};
