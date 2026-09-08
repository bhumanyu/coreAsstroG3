import React from 'react';
import type { ReasoningChainNodeViewModel } from '../../product/analysis/reasoningViewModel';
import { ReasoningNode } from './ReasoningNode';
import { GitBranch } from 'lucide-react';

export interface ReasoningChainProps {
  readonly chain: readonly ReasoningChainNodeViewModel[];
}

export const ReasoningChain: React.FC<ReasoningChainProps> = ({ chain }) => {
  if (!chain || chain.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <GitBranch className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Deterministic Evidence Framework</h2>
            <p className="text-xs text-slate-400">The evidence layers contributing to this conclusion</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          {chain.length} Evidence Layers
        </span>
      </div>

      <div className="space-y-3">
        {chain.map((node) => (
          <ReasoningNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
};
