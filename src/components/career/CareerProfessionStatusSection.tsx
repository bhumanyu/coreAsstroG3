import React from 'react';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';

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
  </section>
);
