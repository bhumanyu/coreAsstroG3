import React from 'react';
import type { ReasoningEvidenceGroupViewModel } from '../../product/analysis/reasoningViewModel';
import { ReasoningEvidenceCard } from './ReasoningEvidenceCard';

export interface ReasoningEvidenceGroupProps {
  readonly group: ReasoningEvidenceGroupViewModel;
}

export const ReasoningEvidenceGroup: React.FC<ReasoningEvidenceGroupProps> = ({ group }) => {
  const count = group.items.length;
  const countLabel = `${count} ${count === 1 ? 'Rule' : 'Rules'}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
        <h3 className="text-sm font-semibold text-slate-200">{group.title}</h3>
        <span className="text-xs font-mono-code text-slate-400">{countLabel}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {group.items.map((item) => (
          <ReasoningEvidenceCard key={item.id} evidence={item} />
        ))}
      </div>
    </div>
  );
};
