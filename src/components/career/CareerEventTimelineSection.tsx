import React from 'react';
import type { ProductCareerEventTimeline } from '../../product/analysis/productAnalysisTypes';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface CareerEventTimelineSectionProps {
  readonly eventTimeline: ProductCareerEventTimeline;
}

function formatTiming(timing: ProductCareerEventTimeline['genericWindows'][number]['timing'], untimedLabel: string): string {
  return timing.type === 'DASHA_PERIOD_WINDOW' && timing.start && timing.end
    ? `${timing.start} — ${timing.end}`
    : untimedLabel;
}

export const CareerEventTimelineSection: React.FC<CareerEventTimelineSectionProps> = ({ eventTimeline }) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  return (
  <section
    aria-labelledby="career-event-timeline-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="career-event-timeline-heading" className="text-sm font-semibold text-slate-100">
        {t('ui.timeline.title')}
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {enumLabel(tEnum, 'careerEventTimelineStatus', eventTimeline.status)}
      </span>
    </div>

    <p className="text-sm text-slate-300">{eventTimeline.statement}</p>
    <p className="text-xs text-amber-300">
      {t('ui.timeline.disclaimer')}
    </p>

    {eventTimeline.eventCandidates.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-200">{t('ui.timeline.eventCandidates')}</h3>
        <ul aria-label={t('ui.timeline.eventCandidatesAria')} className="space-y-3">
          {eventTimeline.eventCandidates.map(candidate => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{candidate.eventType.replaceAll('_', ' ')}</h4>
                <span className="text-xs text-slate-300">{t('ui.timeline.candidateNoGuarantee')}</span>
              </div>
              <p className="text-xs text-slate-400">{formatTiming(candidate.timing, t('ui.timeline.untimed'))}</p>
              <p className="text-xs text-slate-500">
                {t('ui.timeline.evidenceOccurrences')}: {candidate.evidenceOccurrenceIds.join(', ') || t('ui.timeline.none')} · {t('ui.timeline.rootIdentities')}: {candidate.rootIdentityKeys.join(', ') || t('ui.timeline.none')}
              </p>
              <p className="text-xs text-slate-500">{t('ui.timeline.rules')}: {candidate.ruleIds.join(', ') || t('ui.timeline.none')}</p>
              {candidate.counterEvidenceOccurrenceIds.length > 0 && (
                <p className="text-xs text-amber-300">{t('ui.timeline.counterEvidence')}: {candidate.counterEvidenceOccurrenceIds.join(', ')}</p>
              )}
              <ul className="list-disc pl-4 text-xs text-slate-500">
                {candidate.limitations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-200">{t('ui.timeline.genericWindows')}</h3>
      {eventTimeline.genericWindows.length === 0 ? (
        <p className="text-xs text-slate-400">
          {t('ui.timeline.noGeneric')}
        </p>
      ) : (
        <ul aria-label={t('ui.timeline.genericWindowsAria')} className="space-y-3">
          {eventTimeline.genericWindows.map(window => (
            <li key={window.windowId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{window.genericType.replaceAll('_', ' ')}</h4>
                <span className="text-xs text-slate-300">{t('ui.timeline.genericCandidateOnly')}</span>
              </div>
              <p className="text-xs text-slate-400">{formatTiming(window.timing, t('ui.timeline.untimed'))}</p>
              <p className="text-xs text-slate-400">
                {t('ui.timeline.qualification')}: {window.qualificationBasis.replaceAll('_', ' ')}
              </p>
              <p className="text-xs text-slate-400">
                {t('ui.timeline.conditions')}: {window.conditions.join(', ').replaceAll('_', ' ')}
              </p>
              {window.counterEvidenceOccurrenceIds.length > 0 && (
                <p className="text-xs text-amber-300">
                  {t('ui.timeline.counterOccurrences')}: {window.counterEvidenceOccurrenceIds.join(', ')}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {t('ui.timeline.noInference')}
              </p>
              <dl className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.opportunity')}: </dt><dd className="inline">{window.opportunityId ?? t('ui.timeline.notApplicable')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.activation')}: </dt><dd className="inline">{window.activationId}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.semanticIdentities')}: </dt><dd className="inline">{window.evidence.semanticIdentityIds.join(', ') || t('ui.timeline.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.occurrences')}: </dt><dd className="inline">{window.evidence.occurrenceIds.join(', ') || t('ui.timeline.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.natalRoots')}: </dt><dd className="inline">{window.evidence.rootIdentityKeys.join(', ') || t('ui.timeline.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.timeline.rules')}: </dt><dd className="inline">{window.evidence.ruleIds.join(', ') || t('ui.timeline.none')}</dd></div>
              </dl>
              <ul aria-label={t('ui.timeline.limitations', { id: window.windowId })} className="list-disc pl-4 text-xs text-slate-500">
                {window.limitations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="space-y-2 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">{t('ui.timeline.taxonomy')}</h3>
      <p className="text-xs text-slate-400">
        {t('ui.timeline.taxonomyDescription')}
      </p>
      <ul aria-label={t('ui.timeline.taxonomyAria')} className="space-y-2">
        {eventTimeline.taxonomy.map(item => (
          <li key={item.eventType} className="rounded-md border border-slate-800 p-2 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-200">{item.eventType.replaceAll('_', ' ')}</span>
              <span className="text-xs text-amber-300">{t('ui.timeline.disabled', { status: item.validationStatus })}</span>
            </div>
            <p className="text-xs text-slate-500">{item.validationGap}</p>
            <p className="text-xs text-slate-500">
              {t('ui.timeline.required')}: {item.requiredEvidence.join(', ').replaceAll('_', ' ')}
            </p>
          </li>
        ))}
      </ul>
    </div>

    <div className="space-y-1 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">{t('ui.timeline.observed')}</h3>
      {eventTimeline.observedOutcomeReportIds.length === 0 ? (
        <p className="text-xs text-slate-400">{t('ui.timeline.noOutcomeReferences')}</p>
      ) : (
        <p className="text-xs text-slate-400">
          {t('ui.timeline.outcomeReferences', { count: eventTimeline.observedOutcomeReportIds.length })}: {eventTimeline.observedOutcomeReportIds.join(', ')}. {t('ui.timeline.separateCandidates')}
        </p>
      )}
    </div>

    {eventTimeline.diagnostics.length > 0 && (
      <ul aria-label={t('ui.timeline.diagnostics')} className="list-disc pl-4 text-xs text-slate-500">
        {eventTimeline.diagnostics.map(item => <li key={item}>{item}</li>)}
      </ul>
    )}
  </section>
  );
};
