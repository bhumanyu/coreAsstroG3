import React from 'react';
import type { ProductCareerAnalyticalAxes, ProductCareerAxisStatus } from '../../product/analysis/productAnalysisTypes';
import { useTranslation } from 'react-i18next';

export interface CareerAnalyticalAxesSectionProps {
  readonly axes?: ProductCareerAnalyticalAxes;
}

export const CareerAnalyticalAxesSection: React.FC<CareerAnalyticalAxesSectionProps> = ({ axes }) => {
  const { t } = useTranslation('career');
  return (
  <section id="career-risks" aria-labelledby="career-axes-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
    <header className="space-y-1">
      <h2 id="career-axes-heading" className="text-base font-semibold text-slate-100">{t('ui.axes.title')}</h2>
      <p className="text-xs text-slate-400">{t('ui.axes.description')}</p>
    </header>
    {!axes ? (
      <p className="text-sm text-slate-400">{t('ui.axes.unavailable')}</p>
    ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AxisCard label={t('ui.axes.promise')} axis={axes.promise} renderResult={() => (
          axes.promise.result ? <p className="text-xs text-slate-300">{axes.promise.result.direction} · {axes.promise.result.strength}</p> : null
        )} />
        <AxisCard label={t('ui.axes.activation')} axis={axes.activation} renderResult={() => (
          axes.activation.result ? <p className="text-xs text-slate-300">{axes.activation.result.direction} · {axes.activation.result.effect} · {t('ui.axes.dominantLevel')}: {axes.activation.result.dominantLevel}</p> : null
        )} />
        <AxisCard label={t('ui.axes.sustainability')} axis={axes.sustainability} renderResult={() => (
          axes.sustainability.result ? <p className="text-xs text-slate-300">{t('ui.axes.assessment')}: {axes.sustainability.result.assessment}. {t('ui.axes.requiredEvidenceFamily')}: {axes.sustainability.result.requiredEvidenceFamily}.</p> : null
        )} />
        <AxisCard label={t('ui.axes.risk')} axis={axes.risk} renderResult={() => (
          axes.risk.result ? <p className="text-xs text-slate-300">{axes.risk.result.assessment.replaceAll('_', ' ')} · {t('ui.axes.conflictCount', { count: axes.risk.result.conflictCount })}</p> : null
        )} />
        <AxisCard label={t('ui.axes.timing')} axis={axes.timing} renderResult={() => (
          axes.timing.result ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-300">{t('ui.axes.candidateWindows', { count: axes.timing.result.candidateWindows.length })} · {t('ui.axes.untimedLevels', { count: axes.timing.result.untimedLevels.length })} · {t('ui.axes.guarantee')}: {axes.timing.result.guarantee}</p>
              {axes.timing.result.candidateWindows.map((window, index) => (
                <p key={`${window.level}-${window.planet ?? 'unknown'}-${index}`} className="text-xs text-slate-400">
                  {window.level} {window.planet ?? ''}: {window.dated ? `${window.start ?? t('ui.axes.unknown')} — ${window.end ?? t('ui.axes.unknown')}` : t('ui.axes.untimed')} · {window.effect} · {window.direction}
                </p>
              ))}
            </div>
          ) : null
        )} />
      </div>
    )}
  </section>
  );
};

type Axis = ProductCareerAnalyticalAxes['promise']
  | ProductCareerAnalyticalAxes['activation']
  | ProductCareerAnalyticalAxes['sustainability']
  | ProductCareerAnalyticalAxes['risk']
  | ProductCareerAnalyticalAxes['timing'];

const AxisCard: React.FC<{ label: string; axis: Axis; renderResult: () => React.ReactNode }> = ({ label, axis, renderResult }) => {
  const { t } = useTranslation('career');
  const statusKey: Record<ProductCareerAxisStatus, string> = {
    AVAILABLE: 'ui.axes.available',
    PARTIAL: 'ui.axes.partial',
    UNAVAILABLE: 'ui.axes.unavailableStatus',
    BLOCKED: 'ui.axes.blocked',
    INSUFFICIENT: 'ui.axes.insufficient',
    NOT_APPLICABLE: 'ui.axes.notApplicable'
  };
  const statusDescription = axis.unavailableReason || t(statusKey[axis.status]);
  return (
  <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-slate-200">{label}</h3>
      <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{axis.status}</span>
    </div>
    <p className="text-xs leading-relaxed text-slate-400">{statusDescription}</p>
    <p className="text-xs text-slate-300">{t('ui.axes.coverage')}: {axis.coverage.status} · {t('ui.axes.occurrences', { count: axis.coverage.evidenceOccurrenceCount })}</p>
    {axis.diagnostic && <p className="text-xs text-amber-300">{axis.diagnostic}</p>}
    {axis.coverage.missingSources.length > 0 && <p className="text-xs text-amber-300">{t('ui.axes.missingSources')}: {axis.coverage.missingSources.join(', ')}</p>}
    {axis.conflictingEvidenceOccurrenceIds.length > 0 && <p className="text-xs text-amber-300">{t('ui.axes.conflictingOccurrences')}: {axis.conflictingEvidenceOccurrenceIds.join(', ')}</p>}
    {renderResult()}
    <details className="text-[11px] text-slate-500">
      <summary className="cursor-pointer">{t('ui.axes.trace')}</summary>
      <p className="mt-2">{t('ui.axes.supporting')}: {axis.supportingEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}</p>
      <p>{t('ui.axes.conflicting')}: {axis.conflictingEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}</p>
      <p>{t('ui.axes.rules')}: {axis.ruleIds.join(', ') || t('ui.axes.none')}</p>
      <p>{t('ui.axes.method')}: {axis.methodVersion}</p>
    </details>
  </article>
  );
};
