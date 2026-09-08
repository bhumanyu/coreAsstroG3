import React from 'react';
import type { CareerPromiseViewModel } from '../../product/analysis/careerViewModel';
import { formatStrength, formatConfidence } from './careerFormat';
import { Briefcase, Award, CheckCircle2 } from 'lucide-react';

export interface CareerPromiseSectionProps {
  readonly promise: CareerPromiseViewModel;
}

export const CareerPromiseSection: React.FC<CareerPromiseSectionProps> = ({ promise }) => {
  const formattedStrength = formatStrength(promise.strength);
  const formattedConfidence = formatConfidence(promise.confidence);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Briefcase className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Natal Vocational Promise</h2>
            <p className="text-xs text-slate-400">Foundational 10th house, Lagna, and planetary governance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-indigo-950/60 border border-indigo-800/80 text-indigo-300">
            {formattedStrength}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {formattedConfidence}
          </span>
        </div>
      </div>

      {promise.headline && (
        <h3 className="text-sm font-semibold text-slate-200">
          {promise.headline}
        </h3>
      )}

      {promise.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {promise.statement}
        </p>
      )}

      {promise.manifestations.length > 0 && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono-code uppercase tracking-wider text-slate-400">
            <Award className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Dominant Vocational Manifestations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {promise.manifestations.map((manifestation, idx) => (
              <span
                key={`${manifestation}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-950/60 border border-slate-800 text-slate-200"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                {manifestation}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
