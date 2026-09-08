import React from 'react';
import type { ReasoningProvenanceViewModel } from '../../product/analysis/reasoningViewModel';
import { Database, GitFork, BookOpen } from 'lucide-react';

export interface ReasoningProvenanceProps {
  readonly provenance: ReasoningProvenanceViewModel;
}

export const ReasoningProvenance: React.FC<ReasoningProvenanceProps> = ({ provenance }) => {
  if (!provenance || (!provenance.ruleId && (!provenance.derivedFromIds || provenance.derivedFromIds.length === 0))) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono-code text-slate-400">
      {provenance.ruleId && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-indigo-300">
          <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" aria-hidden="true" />
          <span>Rule: {provenance.ruleId}</span>
        </span>
      )}

      {provenance.derivedFromIds && provenance.derivedFromIds.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-teal-300">
          <GitFork className="w-3 h-3 text-teal-400 shrink-0" aria-hidden="true" />
          <span>Derived from: {provenance.derivedFromIds.join(', ')}</span>
        </span>
      )}

      {provenance.source && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
          <Database className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
          <span>Source: {provenance.source}</span>
        </span>
      )}
    </div>
  );
};
