import React from 'react';
import { GitFork, ArrowRight, Network } from 'lucide-react';

export interface EvidencePreviewProps {
  readonly onOpenReasoning?: () => void;
  readonly totalEvidenceCount?: number;
}

export const EvidencePreview: React.FC<EvidencePreviewProps> = ({
  onOpenReasoning,
  totalEvidenceCount
}) => {
  return (
    <section
      aria-label="Reasoning Graph & Evidence Trace Preview"
      className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
          <Network className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Deterministic Evidence Framework & Evidence Trace
            </h3>
            {totalEvidenceCount !== undefined && totalEvidenceCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                {totalEvidenceCount} evidence items indexed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Every career and wealth conclusion is mathematically derived from transparent Vedic rule trees, Shadbala strengths, divisional chart alignments (D10, D2), and Vimshottari timing windows.
          </p>
        </div>
      </div>

      {onOpenReasoning && (
        <button
          type="button"
          onClick={onOpenReasoning}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0 cursor-pointer group"
        >
          <GitFork className="w-4 h-4" aria-hidden="true" />
          <span>Explore Reasoning Graph</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </button>
      )}
    </section>
  );
};
