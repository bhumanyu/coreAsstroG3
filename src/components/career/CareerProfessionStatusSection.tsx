import React from 'react';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';
import { getMissingInputLabel } from '../../product/analysis/careerQualificationPresentation';
import type { CareerProfessionStatus } from '../../product/analysis/careerQualificationPresentation';
import { useTranslation } from 'react-i18next';

export interface CareerProfessionStatusSectionProps {
  readonly profession: CareerProfessionViewModel;
}

export const CareerProfessionStatusSection: React.FC<CareerProfessionStatusSectionProps> = ({ profession }) => {
  const { t } = useTranslation('career');
  const statusCopyKeyByStatus: Record<CareerProfessionStatus, string> = {
    COMPLETE: 'complete',
    PARTIAL: 'partial',
    INSUFFICIENT_DATA: 'insufficient'
  };
  const statusCopyKey = statusCopyKeyByStatus[profession.status];
  const statusLabel = t(`ui.profession.${statusCopyKey}Label`);
  const statusExplanation = t(`ui.profession.${statusCopyKey}Explanation`);
  const missingInputKeys: Record<string, string> = {
    career10HFoundation: 'missingCareer10H',
    career10LFoundation: 'missingCareer10L',
    careerD10CanonicalAnalysis: 'missingD10',
    domainEvidence: 'missingDomainEvidence'
  };
  return (
  <section
    aria-labelledby="career-profession-status-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2"
  >
    <div className="flex items-center justify-between gap-3">
      <h2 id="career-profession-status-heading" className="text-sm font-semibold text-slate-100">
        {t('ui.profession.title')}
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {profession.status}
      </span>
    </div>
    <p className="text-sm text-slate-200">{statusLabel}</p>
    <p className="text-xs leading-relaxed text-slate-400">{statusExplanation}</p>
    {profession.missingInputs.length > 0 && (
      <div className="space-y-1 pt-1">
        <h3 className="text-xs font-semibold text-slate-300">{t('ui.profession.missingInputs')}</h3>
        <ul
          aria-label={t('ui.profession.missingInputsAria')}
          className="list-disc space-y-1 pl-5 text-xs text-slate-400"
        >
          {profession.missingInputs.map((input) => {
            const key = missingInputKeys[input];
            return <li key={input}>{key ? t(`ui.profession.${key}`) : getMissingInputLabel(input)}</li>;
          })}
        </ul>
      </div>
    )}
    <div className="space-y-2 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-300">{t('ui.profession.ranking')}</h3>
        <span className="text-[11px] text-slate-400">{profession.ranking.status}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        {t('ui.profession.rankingDescription')}
      </p>
      {profession.ranking.diagnostics.length > 0 && (
        <ul aria-label={t('ui.profession.rankingDiagnostics')} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          {profession.ranking.diagnostics.map((diagnostic) => <li key={diagnostic}>{diagnostic}</li>)}
        </ul>
      )}
      {profession.ranking.rankedCandidates.length > 0 ? (
        <ol aria-label={t('ui.profession.rankingAria')} className="space-y-2">
          {profession.ranking.rankedCandidates.map((candidate) => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">
                  #{candidate.rank} · {candidate.domain} / {candidate.family}
                </h4>
                <span className="text-xs text-slate-300">{t('ui.profession.scorePoints', { points: candidate.score })} · {t('ui.profession.confidence', { confidence: candidate.confidence })}</span>
              </div>
              <p className="text-xs text-slate-400">{candidate.alternativeExplanation}</p>
              {candidate.scoreContributions.length > 0 && (
                <ul aria-label={t('ui.profession.contributionsAria', { domain: candidate.domain, family: candidate.family })} className="space-y-1 text-xs text-slate-400">
                  {candidate.scoreContributions.map((contribution) => (
                    <li key={`${contribution.referenceType}:${contribution.referenceId}`}>
                      <span className="font-medium text-slate-300">{contribution.referenceType}</span>
                      {' · '}{contribution.referenceId}{' · '}
                      <span className={contribution.points < 0 ? 'text-amber-300' : 'text-slate-200'}>
                        {t(contribution.points > 0 ? 'ui.profession.pointsPositive' : 'ui.profession.points', { points: contribution.points })}
                      </span>
                      {' — '}{contribution.explanation}
                    </li>
                  ))}
                </ul>
              )}
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.d10')}: </dt><dd className="inline">{candidate.d10Status} ({candidate.d10Direction})</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.evidenceCoverage')}: </dt><dd className="inline">{candidate.evidenceCoverage.status} · {t('ui.profession.occurrences', { count: candidate.evidenceCoverage.occurrenceCount })} · {t('ui.profession.roots', { count: candidate.evidenceCoverage.rootIdentityCount })}</dd></div>
              </dl>
              {candidate.reasons.length > 0 && (
                <ul aria-label={t('ui.profession.reasonsAria', { domain: candidate.domain, family: candidate.family })} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                  {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              {candidate.counterEvidenceReasons.length > 0 && (
                <ul aria-label={t('ui.profession.counterEvidenceAria', { domain: candidate.domain, family: candidate.family })} className="list-disc space-y-1 pl-5 text-xs text-amber-300">
                  {candidate.counterEvidenceReasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              <p className="text-[11px] text-slate-500">
                {t('ui.profession.supportingOccurrences')}: {candidate.supportingEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
                {t('ui.profession.d10Occurrences')}: {candidate.d10EvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
                {t('ui.profession.counterOccurrences')}: {candidate.counterEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs leading-relaxed text-slate-400">
          {t('ui.profession.noRanking')}
        </p>
      )}
    </div>
    <div className="space-y-2 pt-2">
      <h3 className="text-xs font-semibold text-slate-300">{t('ui.profession.expressionCandidates')}</h3>
      <p className="text-xs text-slate-500">
        {t('ui.profession.candidateDescription')}
      </p>
      {profession.candidates.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate-400">
          {t('ui.profession.noCandidates')}
        </p>
      ) : (
        <ul aria-label={t('ui.profession.candidatesAria')} className="space-y-3">
          {profession.candidates.map((candidate) => (
            <li
              key={candidate.candidateId}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
            >
              <h4 className="text-sm font-medium text-slate-100">
                {candidate.domain} · {candidate.family} ({candidate.candidateId})
              </h4>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.basis')}: </dt><dd className="inline">{candidate.basis}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.d10Status')}: </dt><dd className="inline">{candidate.d10Status}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.patternRefs')}: </dt><dd className="inline">{candidate.patternIds.join(', ') || t('ui.axes.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.expressions')}: </dt><dd className="inline">{candidate.expressionTypes.join(', ') || t('ui.axes.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.mechanismTypes')}: </dt><dd className="inline">{candidate.mechanismTypes.join(', ') || t('ui.axes.none')}</dd></div>
              </dl>
              {candidate.evidence.length > 0 && (
                <ul aria-label={t('ui.profession.evidenceForAria', { domain: candidate.domain, family: candidate.family })} className="space-y-2">
                  {candidate.evidence.map((evidence) => (
                    <li key={evidence.evidenceId} className="border-t border-slate-800 pt-2 text-xs text-slate-400">
                      <p>{evidence.statement}</p>
                      <dl className="mt-1 grid gap-1 sm:grid-cols-2">
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.evidenceId')}: </dt><dd className="inline">{evidence.evidenceId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.ruleId')}: </dt><dd className="inline">{evidence.ruleId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.sourceIds')}: </dt><dd className="inline">{evidence.sourceIds.join(', ') || t('ui.axes.none')}</dd></div>
                        {evidence.linkage && (
                          <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.linkage')}: </dt><dd className="inline">{evidence.linkage}</dd></div>
                        )}
                        {evidence.unresolvedMechanismIds && evidence.unresolvedMechanismIds.length > 0 && (
                          <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.unresolvedMechanisms')}: </dt><dd className="inline">{evidence.unresolvedMechanismIds.join(', ')}</dd></div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
  );
};
