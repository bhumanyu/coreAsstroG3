import React from 'react';
import type {
  CareerDashaViewModel,
  CareerDashaPeriodViewModel
} from '../../product/analysis/careerViewModel';
import {
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass
} from './careerFormat';
import { Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface CareerDashaSectionProps {
  readonly dasha: CareerDashaViewModel;
}

const PeriodCard: React.FC<{ period: CareerDashaPeriodViewModel }> = ({ period }) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  const roleLabel = enumLabel(tEnum, 'productEvidenceRole', period.role);
  const directionLabel = enumLabel(tEnum, 'productDirection', period.direction);
  const activationEffectLabel = enumLabel(tEnum, 'activationEffect', period.effect);
  const effectLabel = activationEffectLabel === period.effect
    ? enumLabel(tEnum, 'productDirection', period.effect)
    : activationEffectLabel;
  const directionClass = getDirectionBadgeClass(period.direction);
  const roleClass = getEvidenceRoleBadgeClass(period.role);
  const tally = period.evidenceTally;
  const tallyParts = tally
    ? [
        tally.supportingCount > 0
          ? t('ui.dasha.evidenceTally.supporting', { count: tally.supportingCount })
          : null,
        tally.challengingCount > 0
          ? t('ui.dasha.evidenceTally.challenging', { count: tally.challengingCount })
          : null,
        tally.neutralCount > 0
          ? t('ui.dasha.evidenceTally.neutral', { count: tally.neutralCount })
          : null
      ].filter((part): part is string => part !== null)
    : [];

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
          {enumLabel(tEnum, 'dashaLevel', period.level)}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleClass}`}>
          {roleLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-slate-100 font-sans">
          {period.planet || t('ui.dasha.unknownPlanet')}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}>
            {directionLabel}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/80">
            {effectLabel}
          </span>
          {period.conditionAssessment === 'PARTIAL' &&
            (period.effect === 'ACTIVATES' || period.effect === 'CHALLENGES') && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/70">
                {t('ui.dasha.partialAssessment')}
              </span>
            )}
        </div>
      </div>

      {period.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
          {period.statement}
        </p>
      )}

      {tallyParts.length > 0 && (
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          {tallyParts.join(' · ')} {t('ui.dasha.evidenceTally.suffix')}
        </p>
      )}

      {period.evidence.length > 0 && (
        <div className="border-t border-slate-800/60 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {t('ui.dasha.evidence')}
          </p>
          <ul className="mt-1 space-y-1">
            {period.evidence.map((item) => (
              <li key={item.id} className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">{item.title}: </span>
                {item.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const CareerDashaSection: React.FC<CareerDashaSectionProps> = ({ dasha }) => {
  const { t } = useTranslation('career');
  const isAvailable = dasha.status === 'AVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t('ui.dasha.title')}</h2>
            <p className="text-xs text-slate-400">{t('ui.dasha.description')}</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
              isAvailable
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
            }`}
          >
            {isAvailable ? t('ui.dasha.activeWindow') : t('ui.dasha.unavailable')}
          </span>
        </div>
      </div>

      {isAvailable && dasha.periods.length > 0 ? (
        <div className="space-y-3">
          {dasha.currentActivation && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
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
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {t('ui.dasha.unavailableMessage')}
          </span>
        </div>
      )}
    </div>
  );
};
