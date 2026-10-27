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
