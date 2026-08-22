import React from 'react';
import { BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';
import type { DashaInterpretationProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatConfidence } from '../fullNatalReport/reportUtils';
import { getEffectBadgeClass } from '../lifeAnalysis/lifeAnalysisUx';
import { EmptyState } from '../fullNatalReport/EmptyState';

export interface DashaInterpretationPanelProps {
  readonly interpretation?: DashaInterpretationProduct;
  readonly onOpenEvidence?: () => void;
}

export const DashaInterpretationPanel: React.FC<DashaInterpretationPanelProps> = ({
  interpretation,
  onOpenEvidence
}) => {
  if (!interpretation || interpretation.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title="Dasha Interpretation Unavailable"
        message="Deterministic astrological interpretation is not available for the active period."
        icon={<BookOpen className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const { evidence, confidence } = interpretation;

  return (
    <section aria-labelledby="interpretation-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="interpretation-heading" className="text-base sm:text-lg font-semibold text-slate-100">
              Active Dasha Astrological Interpretation
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic rule synthesis across planetary ownership, yogas, aspects, and functional nature
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {confidence && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono-code">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span className="text-slate-400">Confidence:</span>
              <span className="font-semibold text-indigo-300">
                {formatConfidence(confidence)}
              </span>
            </div>
          )}

          {onOpenEvidence && (
            <button
              type="button"
              onClick={onOpenEvidence}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Explore Evidence</span>
            </button>
          )}
        </div>
      </div>

      {/* Evidence items list */}
      {evidence && evidence.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evidence.map((item, idx) => (
            <div
              key={`${item.ruleId}-${item.level}-${idx}`}
              className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-code font-bold text-[10px] px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                    {item.level}
                  </span>
                  <span className="font-mono-code text-slate-500 text-[10px]">
                    {item.ruleId}
                  </span>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${getEffectBadgeClass(
                    item.effect
                  )}`}
                >
                  {item.effect}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed font-serif-astro">
                {item.statement}
              </p>

              {item.source && (
                <div className="text-[10px] font-mono-code text-slate-500 pt-1 border-t border-slate-800/40">
                  Source: {item.source}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
          No individual rule evidence items were recorded for the active dasha period.
        </div>
      )}
    </section>
  );
};
