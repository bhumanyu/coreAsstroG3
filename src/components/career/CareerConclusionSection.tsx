import React from 'react';
import type { CareerConclusionViewModel } from '../../product/analysis/careerViewModel';
import { formatConfidence } from './careerFormat';
import { Sparkles, Network, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CareerConclusionSectionProps {
  readonly conclusion: CareerConclusionViewModel;
  readonly onOpenReasoning?: () => void;
}

export const CareerConclusionSection: React.FC<CareerConclusionSectionProps> = ({
  conclusion,
  onOpenReasoning
}) => {
  const { t } = useTranslation('career');
  const formattedConfidence = formatConfidence(conclusion.confidence);
  const title = conclusion.integratedSynthesisAvailable
    ? t('ui.conclusion.integratedTitle')
    : t('ui.conclusion.title');
  const subtitle = conclusion.integratedSynthesisAvailable
    ? t('ui.conclusion.integratedSubtitle')
    : t('ui.conclusion.subtitle');

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          {formattedConfidence}
        </span>
      </div>

      {conclusion.headline && (
        <h3 className="text-sm font-semibold text-slate-200">
          {conclusion.headline}
        </h3>
      )}

      {conclusion.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {conclusion.statement}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code">
          <span className="text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/60">
            {conclusion.primaryEvidenceCount} {t('ui.conclusion.primaryDrivers')}
          </span>
          <span className="text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            {conclusion.supportingEvidenceCount} {t('ui.conclusion.supportingFactors')}
          </span>
          <span className="text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/60">
            {conclusion.challengingEvidenceCount} {t('ui.conclusion.challengingFactors')}
          </span>
        </div>

        {onOpenReasoning && (
          <button
            type="button"
            onClick={onOpenReasoning}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-indigo-100 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('ui.conclusion.traceReasoning')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
