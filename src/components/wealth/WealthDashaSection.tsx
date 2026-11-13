import React from 'react';
import type {
  WealthDashaViewModel,
  WealthDashaPeriodViewModel
} from '../../product/analysis/wealthViewModel';
import {
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass
} from './wealthFormat';
import { Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface WealthDashaSectionProps {
  readonly dasha: WealthDashaViewModel;
}

const PeriodCard: React.FC<{ period: WealthDashaPeriodViewModel }> = ({ period }) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  const roleLabel = enumLabel(tEnum, 'productEvidenceRole', period.role);
  const directionLabel = enumLabel(tEnum, 'productDirection', period.direction);
  const effectLabel = enumLabel(tEnum, 'activationEffect', period.effect);
  const directionClass = getDirectionBadgeClass(period.direction);
  const roleClass = getEvidenceRoleBadgeClass(period.role);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 light:bg-slate-50 light:border-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 light:border-slate-200">
        <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
          {enumLabel(tEnum, 'dashaLevel', period.level)}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleClass}`}>
          {roleLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-slate-100 light:text-slate-900 font-sans">
          {period.planet || t('ui.dasha.unknownPlanet')}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}>
            {directionLabel}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80 light:bg-slate-100 light:border-slate-200 light:text-slate-700">
            {effectLabel}
          </span>
        </div>
      </div>

      {period.statement && (
        <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans pt-1">
          {period.statement}
        </p>
      )}
    </div>
  );
};

export const WealthDashaSection: React.FC<WealthDashaSectionProps> = ({ dasha }) => {
  const { t } = useTranslation('wealth');
  const isUnavailable = dasha.status === 'UNAVAILABLE';
  const isPartial = dasha.status === 'PARTIAL';
  const isAvailable = dasha.status === 'AVAILABLE' || dasha.status === 'PARTIAL';

  const badgeLabel = isPartial
    ? t('ui.dasha.partialWindow')
    : isAvailable
      ? t('ui.dasha.activeWindow')
      : t('ui.dasha.unavailable');

  const badgeClass = isPartial
    ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
    : isAvailable
      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 light:bg-slate-100 light:border-slate-200 light:text-slate-500';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 light:bg-white/80 light:border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">{t('ui.dasha.title')}</h2>
            <p className="text-xs text-slate-400 light:text-slate-500">{t('ui.dasha.description')}</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      {isAvailable && dasha.periods.length > 0 ? (
        <div className="space-y-3">
          {dasha.currentActivation && (
            <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans">
              {dasha.currentActivation}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {dasha.periods.map((period, idx) => (
              <PeriodCard key={`${period.level}-${period.planet || 'unknown'}-${idx}`} period={period} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 light:text-slate-500 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 light:bg-slate-50 light:border-slate-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {t('ui.dasha.unavailableMessage')}
          </span>
        </div>
      )}
    </div>
  );
};
