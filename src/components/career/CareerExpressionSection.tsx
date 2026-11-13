import React from 'react';
import type { CareerExpressionViewModel } from '../../product/analysis/careerViewModel';
import { Target, Compass, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface CareerExpressionSectionProps {
  readonly expression: CareerExpressionViewModel;
}

export const CareerExpressionSection: React.FC<CareerExpressionSectionProps> = ({ expression }) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  if (expression.status === 'EXECUTED_NO_CANDIDATES') {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">{t('ui.expression.executedNoCandidatesTitle')}</h2>
            <p className="text-xs text-slate-500">{t('ui.expression.executedNoCandidatesDescription')}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">{t('ui.expression.executedNoCandidatesMessage')}</p>
      </div>
    );
  }
  if (!expression.available) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">{t('ui.expression.unavailableTitle')}</h2>
            <p className="text-xs text-slate-500">{t('ui.expression.unavailableDescription')}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">
          {t('ui.expression.unavailableMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Compass className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">{t('ui.expression.title')}</h2>
          <p className="text-xs text-slate-400">{t('ui.expression.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {expression.primaryStyle && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-code uppercase tracking-wider text-slate-400">
              <Target className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>{t('ui.expression.operatingStyle')}</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{expression.primaryStyle}</p>
          </div>
        )}

        {expression.leadershipPotential && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-code uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>{t('ui.expression.leadership')}</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{expression.leadershipPotential}</p>
          </div>
        )}
      </div>

      {expression.secondaryTraits && expression.secondaryTraits.length > 0 && (
        <div className="pt-2 space-y-2">
          <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 block">
            {t('ui.expression.competencies')}
          </span>
          <div className="flex flex-wrap gap-2">
            {expression.secondaryTraits.map((trait, idx) => (
              <span
                key={`${trait}-${idx}`}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-950/60 border border-slate-800/80 text-slate-300"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {expression.candidates.length > 0 && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 block">
            {t('ui.expression.candidates')}
          </span>
          <ul className="space-y-2">
            {expression.candidates.map(candidate => (
              <li key={candidate.expressionId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-200">{enumLabel(tEnum, 'professionExpressionType', candidate.expressionType)}</span>
                <span className="text-slate-400">{enumLabel(tEnum, 'careerExpressionQualification', candidate.qualificationStatus)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
