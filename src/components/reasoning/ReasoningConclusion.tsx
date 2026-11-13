import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ReasoningConclusionViewModel } from '../../product/analysis/reasoningViewModel';
import {
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass
} from './reasoningFormat';
import { Sparkles, ShieldCheck, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { enumLabel } from '../../i18n/enumLabels';

export interface ReasoningConclusionProps {
  readonly conclusion: ReasoningConclusionViewModel;
}

export const ReasoningConclusion: React.FC<ReasoningConclusionProps> = ({ conclusion }) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  const statusBadgeClass = getConclusionStatusBadgeClass(conclusion.status);
  const strengthBadgeClass = getPromiseStrengthBadgeClass(conclusion.strength);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t('reasoning.verdictTitle')}</h2>
            <p className="text-xs text-slate-400">
              {t('reasoning.verdictDescription')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusBadgeClass}`}>
            {enumLabel(tEnum, 'conclusionStatus', conclusion.status)}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${strengthBadgeClass}`}>
            {enumLabel(tEnum, 'promiseStrength', conclusion.strength)}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {enumLabel(tEnum, 'productConfidence', conclusion.confidence)}
          </span>
        </div>
      </div>

      {conclusion.headline && (
        <h3 className="text-sm font-semibold text-slate-200">{conclusion.headline}</h3>
      )}

      {conclusion.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{conclusion.statement}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/60 text-xs font-mono-code">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/60">
            {t('reasoning.evidenceItems', { count: conclusion.evidenceCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>{t('reasoning.supporting', { count: conclusion.supportingEvidenceCount })}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/60">
            <XCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
            <span>{t('reasoning.challenging', { count: conclusion.challengingEvidenceCount })}</span>
          </span>
        </div>

        {conclusion.provenanceAvailable && (
          <div className="inline-flex items-center gap-1.5 text-indigo-300 bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-800/50">
            <FileText className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{t('reasoning.provenanceAvailable')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
