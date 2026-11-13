import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OverviewOverall } from '../../product/analysis/overviewViewModel';
import { Sparkles, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { enumLabel } from '../../i18n/enumLabels';

export interface OverallAssessmentCardProps {
  readonly overall: OverviewOverall;
}

export const OverallAssessmentCard: React.FC<OverallAssessmentCardProps> = ({ overall }) => {
  const { t } = useTranslation('dashboard');
  const { t: tEnum } = useTranslation('enums');
  const statusBadge = () => {
    switch (overall.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>{t('assessment.complete')}</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>{t('assessment.partial')}</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
            <span>{t('assessment.issue')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono-code bg-slate-800 text-slate-300 border border-slate-700">
            <span>{t('assessment.inProgress')}</span>
          </span>
        );
    }
  };

  const confidenceBadge = () => {
    const text = enumLabel(tEnum, 'productConfidence', overall.confidence);
    const colorClass =
      overall.confidence === 'HIGH'
        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
        : overall.confidence === 'MEDIUM'
        ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
        : 'bg-slate-800 border-slate-700 text-slate-300';

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-mono-code border ${colorClass}`}
      >
        {text}
      </span>
    );
  };
  const assessmentDimensions = [
    overall.assessment.foundation,
    overall.assessment.dashaSupport,
    overall.assessment.timing,
    overall.assessment.confidence
  ];

  return (
    <section
      aria-label={t('assessment.ariaLabel')}
      className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {t('assessment.title')}
            </h2>
            <span className="text-xs text-slate-400">
              {t('assessment.subtitle')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge()}
          {confidenceBadge()}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
          {overall.summary}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {assessmentDimensions.map((dimension) => (
          <div key={dimension.title} className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3">
            <h3 className="text-xs font-semibold text-slate-300">{dimension.title}</h3>
            <p className="mt-1 text-sm text-indigo-300">{dimension.label}</p>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">{dimension.explanation}</p>
          </div>
        ))}
      </div>

      <details className="mt-3 rounded-xl bg-slate-950/40 border border-slate-800/80 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-300">
          {overall.assessment.detailsLabel}
        </summary>
        <div className="mt-3 space-y-2">
          {overall.assessment.details.map((detail) => (
            <div key={detail.label} className="text-xs">
              <p className="font-medium text-slate-300">{detail.label}</p>
              <p className="mt-0.5 text-slate-400 leading-relaxed">{detail.explanation}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
};
