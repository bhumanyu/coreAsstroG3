import React from 'react';
import type { WealthDimensionsViewModel } from '../../product/analysis/wealthViewModel';
import { WealthDimensionCard } from './WealthDimensionCard';
import { PieChart } from 'lucide-react';

export interface WealthDimensionsSectionProps {
  readonly dimensions: WealthDimensionsViewModel;
}

export const WealthDimensionsSection: React.FC<WealthDimensionsSectionProps> = ({
  dimensions
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <PieChart className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Core Financial Dimensions</h2>
            <p className="text-xs text-slate-400">Analysis across classical houses of wealth, profit, fortune, and speculative ventures</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
          4 Dimensions Evaluated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.items.map((dim) => (
          <WealthDimensionCard key={dim.id} dimension={dim} />
        ))}
      </div>
    </div>
  );
};
