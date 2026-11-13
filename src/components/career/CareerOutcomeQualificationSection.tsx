import React from 'react';
import type { ProductCareerOutcomeAnalysis } from '../../product/analysis/productAnalysisTypes';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface CareerOutcomeQualificationSectionProps {
  readonly outcomeQualification: ProductCareerOutcomeAnalysis;
}

function timingLabel(timing: ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['timing'], untimedLabel: string): string {
  return timing.type === 'DASHA_PERIOD_WINDOW' && timing.start && timing.end
    ? `${timing.start} — ${timing.end}`
    : untimedLabel;
}

export const CareerOutcomeQualificationSection: React.FC<CareerOutcomeQualificationSectionProps> = ({
  outcomeQualification
}) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  return (
  <section
    aria-labelledby="career-outcome-qualification-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
  >
    <div className="flex items-center justify-between gap-3">
      <h2 id="career-outcome-qualification-heading" className="text-sm font-semibold text-slate-100">
        {t('ui.outcomes.title')}
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {enumLabel(tEnum, 'careerOutcomeStatus', outcomeQualification.status)}
      </span>
    </div>

    <p className="text-sm text-slate-300">{outcomeQualification.statement}</p>

    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-200">{t('ui.outcomes.candidates')}</h3>
      {outcomeQualification.candidateOutcomes.length === 0 ? (
        <p className="text-xs text-slate-400">
          {t('ui.outcomes.noCandidate')}
        </p>
      ) : (
        <ul aria-label={t('ui.outcomes.candidatesAria')} className="space-y-3">
          {outcomeQualification.candidateOutcomes.map(candidate => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{enumLabel(tEnum, 'careerOutcomeType', candidate.outcomeType)}</h4>
                <span className="text-xs text-slate-300">{enumLabel(tEnum, 'careerOutcomeQualification', candidate.qualification)}</span>
              </div>
              <p className="text-xs text-slate-400">
                {t('ui.outcomes.candidateOnly')} · {t('ui.outcomes.noGuarantee')} · {timingLabel(candidate.timing, t('ui.outcomes.untimed'))}
              </p>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">{t('ui.outcomes.d10Qualification')}: </dt><dd className="inline">{enumLabel(tEnum, 'careerOutcomeD10Qualification', candidate.executionConditions.d10Qualification)}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.outcomes.professionAnalysis')}: </dt><dd className="inline">{enumLabel(tEnum, 'careerOutcomeProfessionAnalysis', candidate.executionConditions.professionAnalysisStatus)}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.outcomes.practicalExecution')}: </dt><dd className="inline">{enumLabel(tEnum, 'careerPathwayAssessment', candidate.executionConditions.practicalExecution)}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.outcomes.counterSeverity')}: </dt><dd className="inline">{enumLabel(tEnum, 'careerCounterIndicationSeverity', candidate.counterIndications.severity)}</dd></div>
              </dl>
              <p className="text-xs text-slate-400">
                {t('ui.outcomes.practicalChecks')}: {candidate.executionConditions.requiredChecks.map((check) =>
                  enumLabel(tEnum, 'careerRequiredCheck', check)
                ).join(', ')}
              </p>
              {candidate.counterIndications.conflicts.length > 0 && (
                <ul aria-label={t('ui.outcomes.counterIndications', { id: candidate.candidateId })} className="space-y-1 text-xs text-amber-300">
                  {candidate.counterIndications.conflicts.map((conflict, index) => (
                    <li key={`${conflict.source}-${conflict.evidenceIdentityIds.join('|')}-${index}`}>
                      {enumLabel(tEnum, 'careerConflictSource', conflict.source)}: {enumLabel(tEnum, 'productDirection', conflict.direction)} ({enumLabel(tEnum, 'careerCounterIndicationSeverity', conflict.severity)})
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500">
                {t('ui.outcomes.evidenceRefs')}: Promise [{candidate.supportingEvidence.natalPromiseOccurrenceIds.join(', ') || t('ui.axes.none')}] · Activation [{candidate.supportingEvidence.activationOccurrenceIds.join(', ') || t('ui.axes.none')}]
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="space-y-2 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">{t('ui.outcomes.observed')}</h3>
      {outcomeQualification.observedOutcomes.length === 0 ? (
        <p className="text-xs text-slate-400">
          {t('ui.outcomes.noObserved')}
        </p>
      ) : (
        <ul aria-label={t('ui.outcomes.observedAria')} className="space-y-2">
          {outcomeQualification.observedOutcomes.map(outcome => (
            <li key={outcome.reportId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-sm font-medium text-slate-100">{enumLabel(tEnum, 'observedOutcomeType', outcome.outcomeType)}</p>
              <p className="text-xs text-slate-300">{outcome.statement}</p>
              <p className="text-xs text-slate-500">
                {enumLabel(tEnum, 'observedOutcomeSource', outcome.source)}{outcome.occurredAt ? ` · ${outcome.occurredAt}` : ''} · {outcome.reportId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>

    <p className="text-xs text-slate-500">
      {t('ui.outcomes.noSuccessRate')}
    </p>
  </section>
  );
};
