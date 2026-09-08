import React from 'react';
import type { ReasoningChainNodeViewModel } from '../../product/analysis/reasoningViewModel';
import { formatDirection, getDirectionBadgeClass } from './reasoningFormat';
import { GitCommit } from 'lucide-react';

export interface ReasoningNodeProps {
  readonly node: ReasoningChainNodeViewModel;
  readonly stepNumber?: number;
}

export const ReasoningNode: React.FC<ReasoningNodeProps> = ({ node, stepNumber }) => {
  const directionBadgeClass = getDirectionBadgeClass(node.direction);
  const formattedDirection = formatDirection(node.direction);

  return (
    <div className="relative flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs font-mono-code font-bold text-indigo-300">
          {stepNumber !== undefined ? String(stepNumber).padStart(2, '0') : <GitCommit className="w-4 h-4" />}
        </div>
      </div>

      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{node.label}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase bg-slate-800/80 text-slate-400 border border-slate-700/60">
              {node.type}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionBadgeClass}`}>
            {formattedDirection}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {node.statement}
        </p>
      </div>
    </div>
  );
};
