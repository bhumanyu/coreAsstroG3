import React from 'react';
import type { WealthD2ViewModel } from '../../product/analysis/wealthViewModel';
import { formatD2Relationship, getD2RelationshipBadgeClass } from './wealthFormat';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export interface WealthD2SectionProps {
  readonly d2: WealthD2ViewModel;
}

export const WealthD2Section: React.FC<WealthD2SectionProps> = ({ d2 }) => {
  const formattedRelationship = formatD2Relationship(d2.relationship);
  const badgeClass = getD2RelationshipBadgeClass(d2.relationship);
  const isAvailable = d2.relationship !== 'UNAVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Hora (D2) Divisional Alignment</h2>
            <p className="text-xs text-slate-400">Harmonic verification of liquid asset retention and prosperity</p>
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
          {d2.statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {d2.statement}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>
              Hora is evaluated strictly as a qualitative harmonic relationship with the natal Rasi (D1) 2nd and 11th houses.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {d2.statement || 'Hora (D2) divisional relationship data is unavailable for this calculation.'}
          </span>
        </div>
      )}
    </div>
  );
};
