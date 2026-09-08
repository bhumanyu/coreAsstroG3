import React from 'react';
import type { ReasoningEvidenceGroupViewModel } from '../../product/analysis/reasoningViewModel';
import { ReasoningEvidenceCard } from './ReasoningEvidenceCard';
import { Layers } from 'lucide-react';

export interface ReasoningEvidenceGroupProps {
  readonly group: ReasoningEvidenceGroupViewModel;
}

export const ReasoningEvidenceGroup: React.FC<ReasoningEvidenceGroupProps> = ({ group }) => {
  if (!group || group.items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-200">{group.title}</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800/80 text-slate-400 border border-slate-700/60">
          {group.items.length} {group.items.length === 1 ? 'Rule' : 'Rules'}
        </span>
      </div>

      <div className="space-y-2.5">
        {group.items.map((item) => (
          <ReasoningEvidenceCard key={item.id} evidence={item} />
        ))}
      </div>
    </div>
  );
};
