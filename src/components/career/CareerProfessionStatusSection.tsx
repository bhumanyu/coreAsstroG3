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
  </section>
);
