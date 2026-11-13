import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ReasoningVargaViewModel } from '../../product/analysis/reasoningViewModel';
import { getVargaRelationshipBadgeClass } from './reasoningFormat';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { enumLabel } from '../../i18n/enumLabels';

export interface ReasoningVargaSectionProps {
  readonly varga: ReasoningVargaViewModel;
}

export const ReasoningVargaSection: React.FC<ReasoningVargaSectionProps> = ({ varga }) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  const relationship = varga.chart === 'D2' ? 'UNAVAILABLE' : varga.relationship;
  const statement = varga.chart === 'D2'
    ? t('reasoning.detail.d2Unavailable')
    : varga.statement;
  const formattedRelationship = enumLabel(tEnum, 'divisionalRelationship', relationship);
  const badgeClass = getVargaRelationshipBadgeClass(relationship);
  const isAvailable = relationship !== 'UNAVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t(varga.chart === 'D2' ? 'reasoning.detail.d2Title' : 'reasoning.detail.d10Title')}</h2>
            <p className="text-xs text-slate-400">
              {t('reasoning.detail.vargaDescription', { domain: t(varga.chart === 'D2' ? 'reasoning.detail.vargaD2Domain' : 'reasoning.detail.vargaD10Domain') })}
            </p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formattedRelationship}
          </span>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-3">
          {statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {statement}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>
              {t(varga.chart === 'D2' ? 'reasoning.detail.d2Evaluated' : 'reasoning.detail.d10Evaluated')}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {statement || t('reasoning.detail.vargaD10Unavailable')}
          </span>
        </div>
      )}
    </div>
  );
};
