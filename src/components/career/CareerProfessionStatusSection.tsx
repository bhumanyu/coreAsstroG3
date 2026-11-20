import React from 'react';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';
import { getMissingInputLabel } from '../../product/analysis/careerQualificationPresentation';
import type { CareerProfessionStatus } from '../../product/analysis/careerQualificationPresentation';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';
import { selectPatternQualificationReasons } from './patternQualificationReasons';

export interface CareerProfessionStatusSectionProps {
  readonly profession: CareerProfessionViewModel;
}

const isValidStageCounts = (
  stageCounts: CareerProfessionViewModel['stageCounts']
): stageCounts is NonNullable<CareerProfessionViewModel['stageCounts']> => {
  if (!stageCounts || typeof stageCounts !== 'object') {
    return false;
  }

  const countsAreNonNegativeIntegers = [
    stageCounts.inputExpressions,
    stageCounts.matchedRules,
    stageCounts.generatedCandidates,
    stageCounts.d10QualifiedCandidates,
    stageCounts.d10RemovedCandidates,
    stageCounts.rankingEligibleCandidates,
    stageCounts.rankedCandidates
  ].every(count => Number.isInteger(count) && count >= 0);

  return countsAreNonNegativeIntegers &&
    stageCounts.d10QualifiedCandidates + stageCounts.d10RemovedCandidates === stageCounts.generatedCandidates &&
    stageCounts.d10QualifiedCandidates <= stageCounts.generatedCandidates &&
    stageCounts.rankingEligibleCandidates <= stageCounts.d10QualifiedCandidates &&
    stageCounts.rankedCandidates <= stageCounts.rankingEligibleCandidates;
};

export const CareerProfessionStatusSection: React.FC<CareerProfessionStatusSectionProps> = ({ profession }) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  const statusCopyKeyByStatus: Record<CareerProfessionStatus, string> = {
    COMPLETE: 'complete',
    PARTIAL: 'partial',
    INSUFFICIENT_DATA: 'insufficient'
  };
  const statusCopyKey = statusCopyKeyByStatus[profession.status];
  const coverage = profession.coverageSummary;
  const hasCompleteCoverage = Boolean(
    coverage &&
    coverage.mechanismCandidateCount !== undefined &&
    coverage.patternCandidateCount !== undefined &&
    coverage.patternCandidateRecordCount !== undefined &&
    coverage.distinctCandidateIdCount !== undefined &&
    coverage.conflictedCandidateCount !== undefined &&
    coverage.conflictedQualificationCount !== undefined &&
    coverage.qualificationResultMissingCount !== undefined &&
    coverage.qualifiedPatternCount !== undefined &&
    coverage.eligiblePatternCount !== undefined &&
    coverage.invalidRolePatternCount !== undefined &&
    coverage.roleAssignmentSkippedPatternCount !== undefined &&
    coverage.resolvedMechanismCount !== undefined &&
    coverage.networkResolutionStatus !== undefined &&
    coverage.expressionCount !== undefined &&
    coverage.expressionsWithEvidenceCount !== undefined &&
    coverage.evidenceCount !== undefined &&
    coverage.evidenceWithPlanetAttributionCount !== undefined
  );
  const hasNoResolvedMechanisms =
    profession.status === 'INSUFFICIENT_DATA' &&
    hasCompleteCoverage &&
    coverage?.conflictedCandidateCount === 0 &&
    coverage?.conflictedQualificationCount === 0 &&
    coverage?.qualificationResultMissingCount === 0 &&
    coverage?.resolvedMechanismCount === 0;
  const stageCounts = profession.stageCounts;
  const hasValidStageCounts = isValidStageCounts(stageCounts);
  const hasMissingProfessionInputs =
    profession.missingInputs.length > 0 ||
    profession.diagnostics.includes('PROFESSION_INPUTS_MISSING');
  const stageExplanationKey = hasValidStageCounts && !hasMissingProfessionInputs
    ? stageCounts.inputExpressions === 0
      ? 'noInputExpressionsExplanation'
      : stageCounts.matchedRules === 0
        ? 'noMatchedRulesExplanation'
        : stageCounts.generatedCandidates === 0
          ? 'noGeneratedCandidatesExplanation'
          : stageCounts.d10QualifiedCandidates === 0 &&
              stageCounts.d10RemovedCandidates === stageCounts.generatedCandidates
            ? 'noD10QualifiedCandidatesExplanation'
            : stageCounts.d10QualifiedCandidates > 0 && stageCounts.rankingEligibleCandidates === 0
              ? 'noRankingEligibleCandidatesExplanation'
              : undefined
    : undefined;
  const statusExplanation = hasMissingProfessionInputs
    ? t(`ui.profession.${statusCopyKey}Explanation`)
    : stageExplanationKey
      ? t(`ui.profession.${stageExplanationKey}`)
      : hasNoResolvedMechanisms
        ? t('ui.profession.noResolvedMechanismsExplanation')
        : t(`ui.profession.${statusCopyKey}Explanation`);
  const stageLabels = [
    ['inputExpressions', 'stageInputExpressions'],
    ['matchedRules', 'stageMatchedRules'],
    ['generatedCandidates', 'stageGeneratedCandidates'],
    ['d10QualifiedCandidates', 'stageD10QualifiedCandidates'],
    ['d10RemovedCandidates', 'stageD10RemovedCandidates'],
    ['rankingEligibleCandidates', 'stageRankingEligibleCandidates'],
    ['rankedCandidates', 'stageRankedCandidates']
  ] as const;
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
        {enumLabel(tEnum, 'professionStatus', profession.status)}
      </span>
    </div>
    <p className="text-xs leading-relaxed text-slate-400">{statusExplanation}</p>
    {hasCompleteCoverage && hasValidStageCounts && stageCounts.inputExpressions === 0 && coverage && (
      <p className="text-[11px] leading-relaxed text-slate-500">
        {t('ui.profession.upstreamCoverageSummary', {
          patternsDetected: coverage.patternCandidateCount,
          qualifiedPatterns: coverage.qualifiedPatternCount,
          eligiblePatterns: coverage.eligiblePatternCount,
          mechanismsResolved: coverage.resolvedMechanismCount,
          expressions: coverage.expressionCount
        })}
      </p>
    )}
    {profession.patternQualifications && profession.patternQualifications.length > 0 && (
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-semibold text-slate-300">
          {t('ui.profession.patternQualificationBreakdown')}
        </h3>
        <ol
          aria-label={t('ui.profession.patternQualificationsAria')}
          className="space-y-3"
        >
          {profession.patternQualifications.map(pattern => (
            <li
              key={pattern.patternId}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-xs font-medium text-slate-100">
                  {(() => {
                    const classificationLabel = tEnum(`careerPatternClassification.${pattern.classification}`);
                    const normalizedClassification = classificationLabel.trim().toLowerCase();
                    const normalizedName = pattern.name.trim().toLowerCase();
                    return normalizedClassification === normalizedName || !normalizedName
                      ? classificationLabel
                      : `${classificationLabel} · ${pattern.name.trim()}`;
                  })()}
                </h4>
                <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-300">
                  {tEnum(`careerPatternQualificationStatus.${pattern.status}`)}
                </span>
              </div>
              {selectPatternQualificationReasons(pattern).length > 0 && (
                <ul
                  aria-label={t('ui.profession.patternQualificationReasons')}
                  className="list-disc space-y-1 pl-5 text-xs text-slate-400"
                >
                  {selectPatternQualificationReasons(pattern).map((reason, index) => (
                    <li key={`${reason.category}-${index}`}>
                      {reason.category === 'FULLY_ASSESSED_WEAK_PARTICIPANT'
                        ? t('ui.profession.patternFullyAssessedWeakParticipant', {
                            planet: tEnum(`careerPatternParticipantPlanet.${reason.planet}`),
                            condition: t(`ui.profession.patternAdverseCondition.${reason.condition}`)
                          })
                        : t(`ui.profession.patternReason.${reason.category}`)}
                    </li>
                  ))}
                </ul>
              )}
              {pattern.decisionBlockingReasons.length > 0 && (
                <ul
                  aria-label={t('ui.profession.patternBlockingReasons')}
                  className="list-disc space-y-1 pl-5 text-xs text-slate-400"
                >
                  {pattern.decisionBlockingReasons.map((reason, index) => (
                    <li key={`${reason.kind}-${index}`}>
                      {t('ui.profession.patternBlockingReasonLine', {
                        kind: tEnum(`careerPatternBlockingReasonKind.${reason.kind}`),
                        reason: reason.reason
                      })}
                    </li>
                  ))}
                </ul>
              )}
              {pattern.deferredDimensions.length > 0 && (
                <p className="text-xs text-slate-500">
                  {t('ui.profession.patternDeferredDimensions', {
                    dimensions: pattern.deferredDimensions
                      .map(dimension => tEnum(`careerPatternDeferredDimension.${dimension}`))
                      .join(', ')
                  })}
                </p>
              )}
              {pattern.participants.length > 0 && (
                <ul
                  aria-label={t('ui.profession.patternParticipantEvidence')}
                  className="space-y-1 text-xs text-slate-400"
                >
                  {pattern.participants.map((participant, index) => {
                    const factors = [
                      participant.combustion
                        ? t('ui.profession.patternParticipantCombustion', {
                            value: tEnum(`careerPatternCombustion.${participant.combustion}`)
                          })
                        : undefined,
                      participant.affliction
                        ? t('ui.profession.patternParticipantAffliction', {
                            value: tEnum(`careerPatternAffliction.${participant.affliction}`)
                          })
                        : undefined,
                      participant.dignity
                        ? t('ui.profession.patternParticipantDignity', {
                            value: tEnum(`careerPatternDignity.${participant.dignity}`)
                          })
                        : undefined,
                      participant.positiveFactorLabels.length > 0
                        ? t('ui.profession.patternParticipantPositiveFactors', {
                            factors: participant.positiveFactorLabels
                              .map(factor => tEnum(`careerPatternFactor.${factor}`))
                              .join(', ')
                          })
                        : undefined,
                      participant.negativeFactorLabels.length > 0
                        ? t('ui.profession.patternParticipantNegativeFactors', {
                            factors: participant.negativeFactorLabels
                              .map(factor => tEnum(`careerPatternFactor.${factor}`))
                              .join(', ')
                          })
                        : undefined
                    ].filter((factor): factor is string => factor !== undefined);
                    return (
                      <li key={`${pattern.patternId}-participant-${index}`}>
                        {t('ui.profession.patternParticipantEvidenceLine', {
                          planet: tEnum(`careerPatternParticipantPlanet.${participant.planet}`),
                          relevance: tEnum(`careerPatternRelevance.${participant.relevance}`),
                          condition: tEnum(`careerPatternCondition.${participant.condition}`),
                          assessment: participant.conditionAssessment
                            ? tEnum(`careerPatternConditionAssessment.${participant.conditionAssessment}`)
                            : t('ui.profession.patternAssessmentUnavailable'),
                          factors: factors.length > 0
                            ? factors.join('; ')
                            : t('ui.profession.patternParticipantNoFactors')
                        })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    )}
    {hasValidStageCounts && (
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-semibold text-slate-300">{t('ui.profession.stageCountsHeading')}</h3>
        <ol aria-label={t('ui.profession.stageCountsAria')} className="grid gap-2 sm:grid-cols-2">
          {stageLabels.map(([countKey, labelKey], index) => (
            <li key={countKey} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs">
              <span className="text-slate-400">{index + 1}. {t(`ui.profession.${labelKey}`)}</span>
              <span className="font-semibold tabular-nums text-slate-100">{stageCounts[countKey]}</span>
            </li>
          ))}
        </ol>
      </div>
    )}
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
    {profession.diagnostics.length > 0 && (
      <ul aria-label={t('ui.profession.analysisDiagnostics')} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
        {profession.diagnostics.map((diagnostic) => (
          <li key={diagnostic}>{enumLabel(tEnum, 'professionDiagnostic', diagnostic)}</li>
        ))}
      </ul>
    )}
    <div className="space-y-2 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-300">{t('ui.profession.ranking')}</h3>
        <span className="text-[11px] text-slate-400">{enumLabel(tEnum, 'productAvailability', profession.ranking.status)}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        {t('ui.profession.rankingDescription')}
      </p>
      {profession.ranking.diagnostics.length > 0 && (
        <ul aria-label={t('ui.profession.rankingDiagnostics')} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          {profession.ranking.diagnostics.map((diagnostic) => (
            <li key={diagnostic} title={diagnostic}>
              {enumLabel(tEnum, 'professionDiagnostic', diagnostic)}
            </li>
          ))}
        </ul>
      )}
      {profession.ranking.rankedCandidates.length > 0 ? (
        <ol aria-label={t('ui.profession.rankingAria')} className="space-y-2">
          {profession.ranking.rankedCandidates.map((candidate) => {
            const domain = enumLabel(tEnum, 'professionDomain', candidate.domain);
            const family = enumLabel(tEnum, 'professionFamily', candidate.family);
            return (
                <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-100">
                      #{candidate.rank} · {domain} / {family}
                    </h4>
                    <span className="text-xs text-slate-300">{t('ui.profession.scorePoints', { points: candidate.score })} · {t('ui.profession.confidence', { confidence: enumLabel(tEnum, 'productConfidence', candidate.confidence) })}</span>
                  </div>
                  <p className="text-xs text-slate-400">{candidate.alternativeExplanation}</p>
                  {candidate.scoreContributions.length > 0 && (
                    <ul aria-label={t('ui.profession.contributionsAria', { domain, family })} className="space-y-1 text-xs text-slate-400">
                      {candidate.scoreContributions.map((contribution) => (
                        <li key={`${contribution.referenceType}:${contribution.referenceId}`}>
                          <span className="font-medium text-slate-300">{enumLabel(tEnum, 'professionReferenceType', contribution.referenceType)}</span>
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
                    <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.d10')}: </dt><dd className="inline">{enumLabel(tEnum, 'professionCandidateStatus', candidate.d10Status)} ({enumLabel(tEnum, 'productDirection', candidate.d10Direction)})</dd></div>
                    <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.evidenceCoverage')}: </dt><dd className="inline">{enumLabel(tEnum, 'careerAxisCoverage', candidate.evidenceCoverage.status)} · {t('ui.profession.occurrences', { count: candidate.evidenceCoverage.occurrenceCount })} · {t('ui.profession.roots', { count: candidate.evidenceCoverage.rootIdentityCount })}</dd></div>
                  </dl>
                  {candidate.reasons.length > 0 && (
                    <ul aria-label={t('ui.profession.reasonsAria', { domain, family })} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                      {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  )}
                  {candidate.counterEvidenceReasons.length > 0 && (
                    <ul aria-label={t('ui.profession.counterEvidenceAria', { domain, family })} className="list-disc space-y-1 pl-5 text-xs text-amber-300">
                      {candidate.counterEvidenceReasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {t('ui.profession.supportingOccurrences')}: {candidate.supportingEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
                    {t('ui.profession.d10Occurrences')}: {candidate.d10EvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
                    {t('ui.profession.counterOccurrences')}: {candidate.counterEvidenceOccurrenceIds.join(', ') || t('ui.axes.none')}.
                  </p>
                </li>
            );
          })}
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
          {profession.candidates.map((candidate) => {
            const domain = enumLabel(tEnum, 'professionDomain', candidate.domain);
            const family = enumLabel(tEnum, 'professionFamily', candidate.family);
            return (
              <li
              key={candidate.candidateId}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
            >
              <h4 className="text-sm font-medium text-slate-100">
                {domain} · {family} ({candidate.candidateId})
              </h4>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.basis')}: </dt><dd className="inline">{enumLabel(tEnum, 'professionBasis', candidate.basis)}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.d10Status')}: </dt><dd className="inline">{enumLabel(tEnum, 'professionCandidateStatus', candidate.d10Status)}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.patternRefs')}: </dt><dd className="inline">{candidate.patternIds.join(', ') || t('ui.axes.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.expressions')}: </dt><dd className="inline">{candidate.expressionTypes.map((value) => enumLabel(tEnum, 'professionExpressionType', value)).join(', ') || t('ui.axes.none')}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.mechanismTypes')}: </dt><dd className="inline">{candidate.mechanismTypes.map((value) => enumLabel(tEnum, 'professionMechanismType', value)).join(', ') || t('ui.axes.none')}</dd></div>
              </dl>
              {candidate.evidence.length > 0 && (
                <ul aria-label={t('ui.profession.evidenceForAria', { domain, family })} className="space-y-2">
                  {candidate.evidence.map((evidence) => (
                    <li key={evidence.evidenceId} className="border-t border-slate-800 pt-2 text-xs text-slate-400">
                      <p>{evidence.statement}</p>
                      <dl className="mt-1 grid gap-1 sm:grid-cols-2">
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.evidenceId')}: </dt><dd className="inline">{evidence.evidenceId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.ruleId')}: </dt><dd className="inline">{evidence.ruleId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.sourceIds')}: </dt><dd className="inline">{evidence.sourceIds.join(', ') || t('ui.axes.none')}</dd></div>
                        {evidence.linkage && (
                          <div><dt className="inline font-semibold text-slate-300">{t('ui.profession.linkage')}: </dt><dd className="inline">{enumLabel(tEnum, 'professionEvidenceLinkage', evidence.linkage)}</dd></div>
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
            );
          })}
        </ul>
      )}
    </div>
  </section>
  );
};
