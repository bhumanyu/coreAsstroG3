import React from 'react';
import type { CareerD10ViewModel } from '../../product/analysis/careerViewModel';
import { formatD10Relationship, getD10RelationshipBadgeClass } from './careerFormat';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CareerD10SectionProps {
  readonly d10: CareerD10ViewModel;
}

export const CareerD10Section: React.FC<CareerD10SectionProps> = ({ d10 }) => {
  const formattedRelationship = formatD10Relationship(d10.relationship);
  const badgeClass = getD10RelationshipBadgeClass(d10.relationship);
  const isAvailable = d10.available && d10.relationship !== 'UNAVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Dasamsa (D10) Divisional Alignment</h2>
            <p className="text-xs text-slate-400">Harmonic verification of vocation, status, and societal standing</p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
          >
            {formattedRelationship}
          </span>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-3">
          {d10.statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {d10.statement}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>
              Dasamsa is evaluated strictly as a qualitative harmonic relationship with the natal Rasi (D1) 10th house.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {d10.statement || 'Dasamsa (D10) divisional relationship data is unavailable for this calculation.'}
          </span>
        </div>
      )}
    </div>
  );
};
