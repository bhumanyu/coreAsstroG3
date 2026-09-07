import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface AnalysisEmptyStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly icon?: React.ReactNode;
  readonly onRetry?: () => void;
}

export const AnalysisEmptyState: React.FC<AnalysisEmptyStateProps> = ({
  title = 'Analysis Unavailable',
  message = 'Product analysis has not been computed or is unavailable for the current chart.',
  icon,
  onRetry
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-400 my-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400">
        {icon || <AlertCircle className="w-6 h-6 text-amber-400" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold uppercase font-mono-code tracking-wider text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          Recalculate Analysis
        </button>
      )}
    </div>
  );
};

export const ProductAnalysisRequired = AnalysisEmptyState;
