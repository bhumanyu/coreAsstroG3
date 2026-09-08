import React from 'react';
import type { ReasoningVargaViewModel } from '../../product/analysis/reasoningViewModel';
import { formatVargaRelationship, getVargaRelationshipBadgeClass } from './reasoningFormat';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ReasoningVargaSectionProps {
  readonly varga: ReasoningVargaViewModel;
}

export const ReasoningVargaSection: React.FC<ReasoningVargaSectionProps> = ({ varga }) => {
  const chartName = varga.chart === 'D2' ? 'Hora (D2)' : 'Dasamsa (D10)';
  const domainTarget = varga.chart === 'D2' ? 'liquid asset accumulation' : 'vocational capacity';
  const formattedRelationship = formatVargaRelationship(varga.relationship);
  const badgeClass = getVargaRelationshipBadgeClass(varga.relationship);
  const isAvailable = varga.relationship !== 'UNAVAILABLE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{chartName} Divisional Confirmation</h2>
            <p className="text-xs text-slate-400">Harmonic verification of {domainTarget} against natal indicators</p>
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
          {varga.statement && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {varga.statement}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>
              {chartName} harmonic verification evaluates qualitative concordance with the natal chart without overriding foundational promise.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {varga.statement || `${chartName} divisional relationship data is unavailable for this calculation.`}
          </span>
        </div>
      )}
    </div>
  );
};
