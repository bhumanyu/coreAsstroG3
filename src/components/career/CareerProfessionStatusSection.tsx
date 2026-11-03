import React from 'react';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';
import { getMissingInputLabel } from '../../product/analysis/careerQualificationPresentation';

export interface CareerProfessionStatusSectionProps {
  readonly profession: CareerProfessionViewModel;
}

export const CareerProfessionStatusSection: React.FC<CareerProfessionStatusSectionProps> = ({
  profession
}) => (
  <section
    aria-labelledby="career-profession-status-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2"
  >
    <div className="flex items-center justify-between gap-3">
      <h2 id="career-profession-status-heading" className="text-sm font-semibold text-slate-100">
        Profession Analysis Status
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {profession.status}
      </span>
    </div>
    <p className="text-sm text-slate-200">{profession.statusCopy.label}</p>
    <p className="text-xs leading-relaxed text-slate-400">{profession.statusCopy.explanation}</p>
    {profession.missingInputs.length > 0 && (
      <div className="space-y-1 pt-1">
        <h3 className="text-xs font-semibold text-slate-300">Missing inputs</h3>
        <ul
          aria-label="Missing profession analysis inputs"
          className="list-disc space-y-1 pl-5 text-xs text-slate-400"
        >
          {profession.missingInputs.map((input) => (
            <li key={input}>{getMissingInputLabel(input)}</li>
          ))}
        </ul>
      </div>
    )}
    <div className="space-y-2 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-300">Profession family ranking</h3>
        <span className="text-[11px] text-slate-400">{profession.ranking.status}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        Evidence-weighted policy points compare broad profession families. Scores are not probabilities,
        job-title predictions, salary estimates, or employability forecasts. D1 establishes the promise;
        D10 only qualifies an existing expression.
      </p>
      {profession.ranking.diagnostics.length > 0 && (
        <ul aria-label="Profession ranking diagnostics" className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          {profession.ranking.diagnostics.map((diagnostic) => <li key={diagnostic}>{diagnostic}</li>)}
        </ul>
      )}
      {profession.ranking.rankedCandidates.length > 0 ? (
        <ol aria-label="Ranked profession families" className="space-y-2">
          {profession.ranking.rankedCandidates.map((candidate) => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">
                  #{candidate.rank} · {candidate.domain} / {candidate.family}
                </h4>
                <span className="text-xs text-slate-300">{candidate.score} policy points · {candidate.confidence} confidence</span>
              </div>
              <p className="text-xs text-slate-400">{candidate.alternativeExplanation}</p>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">D10: </dt><dd className="inline">{candidate.d10Status} ({candidate.d10Direction})</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Evidence coverage: </dt><dd className="inline">{candidate.evidenceCoverage.status} · {candidate.evidenceCoverage.occurrenceCount} occurrences · {candidate.evidenceCoverage.rootIdentityCount} roots</dd></div>
              </dl>
              {candidate.reasons.length > 0 && (
                <ul aria-label={`Reasons for ${candidate.domain} ${candidate.family}`} className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                  {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              {candidate.counterEvidenceReasons.length > 0 && (
                <ul aria-label={`Counter-evidence for ${candidate.domain} ${candidate.family}`} className="list-disc space-y-1 pl-5 text-xs text-amber-300">
                  {candidate.counterEvidenceReasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              <p className="text-[11px] text-slate-500">
                Supporting occurrences: {candidate.supportingEvidenceOccurrenceIds.join(', ') || 'None'}.
                D10 occurrences: {candidate.d10EvidenceOccurrenceIds.join(', ') || 'None'}.
                Counter occurrences: {candidate.counterEvidenceOccurrenceIds.join(', ') || 'None'}.
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs leading-relaxed text-slate-400">
          No profession-family ranking is available. This can mean the C11 D1 promise gate is not met,
          no supported profession family was derived, or required evidence is unavailable.
        </p>
      )}
    </div>
    <div className="space-y-2 pt-2">
      <h3 className="text-xs font-semibold text-slate-300">Profession candidates</h3>
      {profession.candidates.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate-400">
          No profession candidates are available from the current inputs. This is not a negative career conclusion.
        </p>
      ) : (
        <ul aria-label="Profession candidates" className="space-y-3">
          {profession.candidates.map((candidate) => (
            <li
              key={candidate.candidateId}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
            >
              <h4 className="text-sm font-medium text-slate-100">
                {candidate.domain} · {candidate.family} ({candidate.candidateId})
              </h4>
              <dl className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">Basis: </dt><dd className="inline">{candidate.basis}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">D10 status: </dt><dd className="inline">{candidate.d10Status}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Pattern refs: </dt><dd className="inline">{candidate.patternIds.join(', ') || 'None'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Expressions: </dt><dd className="inline">{candidate.expressionTypes.join(', ') || 'None'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Mechanism types: </dt><dd className="inline">{candidate.mechanismTypes.join(', ') || 'None'}</dd></div>
              </dl>
              {candidate.evidence.length > 0 && (
                <ul aria-label={`Evidence for ${candidate.domain} ${candidate.family}`} className="space-y-2">
                  {candidate.evidence.map((evidence) => (
                    <li key={evidence.evidenceId} className="border-t border-slate-800 pt-2 text-xs text-slate-400">
                      <p>{evidence.statement}</p>
                      <dl className="mt-1 grid gap-1 sm:grid-cols-2">
                        <div><dt className="inline font-semibold text-slate-300">Evidence ID: </dt><dd className="inline">{evidence.evidenceId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">Rule ID: </dt><dd className="inline">{evidence.ruleId}</dd></div>
                        <div><dt className="inline font-semibold text-slate-300">Source IDs: </dt><dd className="inline">{evidence.sourceIds.join(', ') || 'None'}</dd></div>
                        {evidence.linkage && (
                          <div><dt className="inline font-semibold text-slate-300">Linkage: </dt><dd className="inline">{evidence.linkage}</dd></div>
                        )}
                        {evidence.unresolvedMechanismIds && evidence.unresolvedMechanismIds.length > 0 && (
                          <div><dt className="inline font-semibold text-slate-300">Unresolved mechanism IDs: </dt><dd className="inline">{evidence.unresolvedMechanismIds.join(', ')}</dd></div>
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
