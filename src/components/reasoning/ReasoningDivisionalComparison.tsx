import React from 'react';
import type { ReasoningVargaViewModel } from '../../product/analysis/reasoningViewModel';
import { formatVargaRelationship, getVargaRelationshipBadgeClass } from './reasoningFormat';
import { Layers, CheckCircle2, AlertCircle, Briefcase, Coins } from 'lucide-react';

export interface ReasoningDivisionalComparisonProps {
  readonly d10?: ReasoningVargaViewModel;
  readonly d2?: ReasoningVargaViewModel;
}

export const ReasoningDivisionalComparison: React.FC<ReasoningDivisionalComparisonProps> = ({
  d10,
  d2
}) => {
  const d10Rel = d10?.relationship ?? 'UNAVAILABLE';
  const isD10Available = d10Rel !== 'UNAVAILABLE';
  const d10BadgeClass = getVargaRelationshipBadgeClass(d10Rel);

  const d2Rel = d2?.relationship ?? 'UNAVAILABLE';
  const isD2Available = d2Rel !== 'UNAVAILABLE';
  const d2BadgeClass = getVargaRelationshipBadgeClass(d2Rel);

  return (
    <section
      id="section-divisional-confirmation"
      aria-label="Divisional Confirmation"
      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Divisional Confirmation</h2>
            <p className="text-xs text-slate-400">
              Cross-domain harmonic verification of vocational (D10) and financial (D2) capacity
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          Harmonic Alignment
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Career D10 Cell */}
        <div
          id="divisional-cell-d10"
          className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3.5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Dasamsa (D10) Divisional Confirmation
                  </h3>
                  <span className="text-[11px] font-mono-code text-slate-400 block">
                    Career & Vocational Concordance
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${d10BadgeClass}`}
              >
                {formatVargaRelationship(d10Rel)}
              </span>
            </div>

            {isD10Available ? (
              <div className="space-y-2.5">
                {d10?.statement ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {d10.statement}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Dasamsa (D10) harmonic relationship is confirmed; no specific statement provided.
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                  <span>
                    Dasamsa evaluates qualitative vocational concordance without overriding foundational promise.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {d10?.statement || 'Unavailable: Dasamsa (D10) harmonic data is unavailable for this calculation.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Wealth D2 Cell */}
        <div
          id="divisional-cell-d2"
          className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3.5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Hora (D2) Divisional Confirmation
                  </h3>
                  <span className="text-[11px] font-mono-code text-slate-400 block">
                    Wealth & Liquid Asset Concordance
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${d2BadgeClass}`}
              >
                {formatVargaRelationship(d2Rel)}
              </span>
            </div>

            {isD2Available ? (
              <div className="space-y-2.5">
                {d2?.statement ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {d2.statement}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Hora (D2) harmonic relationship is confirmed; no specific statement provided.
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                  <span>
                    Hora evaluates qualitative liquid asset accumulation without overriding foundational promise.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {d2?.statement || 'Unavailable: Hora (D2) harmonic data is unavailable for this calculation.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
