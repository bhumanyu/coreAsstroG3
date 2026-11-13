import React from 'react';
import type { WealthEvidenceViewModel } from '../../product/analysis/wealthViewModel';
import {
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass
} from './wealthFormat';
import { FileText, GitFork, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';
import { TechnicalEvidenceDetails } from '../reasoning/TechnicalEvidenceDetails';

export interface WealthEvidenceSectionProps {
  readonly evidence: readonly WealthEvidenceViewModel[];
  readonly onOpenReasoning?: () => void;
}

export const WealthEvidenceSection: React.FC<WealthEvidenceSectionProps> = ({
  evidence,
  onOpenReasoning
}) => {
  const { t } = useTranslation('wealth');
  const { t: tEnum } = useTranslation('enums');
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t('ui.evidence.title')}</h2>
            <p className="text-xs text-slate-400">{t('ui.evidence.description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {evidence.length} {t(evidence.length === 1 ? 'ui.evidence.factor' : 'ui.evidence.factors')}
          </span>
          {onOpenReasoning && (
            <button
              type="button"
              onClick={onOpenReasoning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('ui.evidence.explore')}</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {evidence.map((item) => {
          const roleLabel = enumLabel(tEnum, 'productEvidenceRole', item.role);
          const directionLabel = enumLabel(tEnum, 'productDirection', item.direction);
          const roleClass = getEvidenceRoleBadgeClass(item.role);
          const directionClass = getDirectionBadgeClass(item.direction);

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleClass}`}>
                    {roleLabel}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}>
                    {directionLabel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {item.explanation}
              </p>

              <p className="text-[11px] text-slate-500">{item.sourceLabel}</p>
              <TechnicalEvidenceDetails evidence={item} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
