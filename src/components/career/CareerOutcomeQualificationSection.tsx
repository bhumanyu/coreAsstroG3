import React from 'react';
import type { ProductCareerOutcomeAnalysis } from '../../product/analysis/productAnalysisTypes';

export interface CareerOutcomeQualificationSectionProps {
  readonly outcomeQualification: ProductCareerOutcomeAnalysis;
}

function timingLabel(timing: ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['timing']): string {
  return timing.type === 'DASHA_PERIOD_WINDOW' && timing.start && timing.end
    ? `${timing.start} to ${timing.end}`
    : 'Untimed candidate window';
}

export const CareerOutcomeQualificationSection: React.FC<CareerOutcomeQualificationSectionProps> = ({
  outcomeQualification
}) => (
  <section
    aria-labelledby="career-outcome-qualification-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
  >
    <div className="flex items-center justify-between gap-3">
      <h2 id="career-outcome-qualification-heading" className="text-sm font-semibold text-slate-100">
        Career Outcome Qualification
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {outcomeQualification.status}
      </span>
    </div>

    <p className="text-sm text-slate-300">{outcomeQualification.statement}</p>

    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-200">Candidate outcome windows</h3>
      {outcomeQualification.candidateOutcomes.length === 0 ? (
        <p className="text-xs text-slate-400">
          No outcome candidate is qualified from the current Promise, Activation, and event evidence. This is unresolved/insufficient evidence, not a negative career prediction.
        </p>
      ) : (
        <ul aria-label="Career outcome candidates" className="space-y-3">
          {outcomeQualification.candidateOutcomes.map(candidate => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{candidate.outcomeType.replaceAll('_', ' ')}</h4>
                <span className="text-xs text-slate-300">{candidate.qualification}</span>
              </div>
              <p className="text-xs text-slate-400">
                Candidate only · No guaranteed outcome · {timingLabel(candidate.timing)}
              </p>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">D10 qualification: </dt><dd className="inline">{candidate.executionConditions.d10Qualification}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Profession analysis: </dt><dd className="inline">{candidate.executionConditions.professionAnalysisStatus}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Practical execution: </dt><dd className="inline">{candidate.executionConditions.practicalExecution}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Counter-indication severity: </dt><dd className="inline">{candidate.counterIndications.severity}</dd></div>
              </dl>
              <p className="text-xs text-slate-400">
                Practical checks still required: {candidate.executionConditions.requiredChecks.join(', ')}
              </p>
              {candidate.counterIndications.conflicts.length > 0 && (
                <ul aria-label={`Counter-indications for ${candidate.candidateId}`} className="space-y-1 text-xs text-amber-300">
                  {candidate.counterIndications.conflicts.map((conflict, index) => (
                    <li key={`${conflict.source}-${conflict.evidenceIdentityIds.join('|')}-${index}`}>
                      {conflict.source}: {conflict.direction} ({conflict.severity})
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500">
                Evidence refs: Promise [{candidate.supportingEvidence.natalPromiseOccurrenceIds.join(', ') || 'none'}] · Activation [{candidate.supportingEvidence.activationOccurrenceIds.join(', ') || 'none'}]
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="space-y-2 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">Observed career outcomes (user-reported)</h3>
      {outcomeQualification.observedOutcomes.length === 0 ? (
        <p className="text-xs text-slate-400">
          No user-reported outcomes supplied. Candidate windows are not recorded as observed events.
        </p>
      ) : (
        <ul aria-label="User-reported observed career outcomes" className="space-y-2">
          {outcomeQualification.observedOutcomes.map(outcome => (
            <li key={outcome.reportId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-sm font-medium text-slate-100">{outcome.outcomeType.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-300">{outcome.statement}</p>
              <p className="text-xs text-slate-500">
                USER_REPORTED{outcome.occurredAt ? ` · ${outcome.occurredAt}` : ''} · {outcome.reportId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>

    <p className="text-xs text-slate-500">
      No success percentage or guaranteed outcome is calculated.
    </p>
  </section>
);
