import React from 'react';
import type { CareerExpressionViewModel } from '../../product/analysis/careerViewModel';
import { Target, Compass, Sparkles } from 'lucide-react';

export interface CareerExpressionSectionProps {
  readonly expression: CareerExpressionViewModel;
}

export const CareerExpressionSection: React.FC<CareerExpressionSectionProps> = ({ expression }) => {
  if (!expression.available) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">Vocational Expression & Style</h2>
            <p className="text-xs text-slate-500">Working style and leadership orientation</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">
          Vocational expression nuances unavailable for this profile.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Compass className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">Vocational Expression & Working Style</h2>
          <p className="text-xs text-slate-400">Operational temperament, executive capacity, and functional orientation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {expression.primaryStyle && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-code uppercase tracking-wider text-slate-400">
              <Target className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Primary Operating Style</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{expression.primaryStyle}</p>
          </div>
        )}

        {expression.leadershipPotential && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-code uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Leadership Potential</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{expression.leadershipPotential}</p>
          </div>
        )}
      </div>

      {expression.secondaryTraits && expression.secondaryTraits.length > 0 && (
        <div className="pt-2 space-y-2">
          <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 block">
            Functional Competencies & Traits
          </span>
          <div className="flex flex-wrap gap-2">
            {expression.secondaryTraits.map((trait, idx) => (
              <span
                key={`${trait}-${idx}`}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-950/60 border border-slate-800/80 text-slate-300"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
