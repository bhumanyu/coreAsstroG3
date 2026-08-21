import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LifeAnalysisErrorProps {
  readonly message?: string;
  readonly onRetry?: () => void;
}

export const LifeAnalysisError: React.FC<LifeAnalysisErrorProps> = ({
  message = 'An unexpected error occurred while calculating life domain synthesis.',
  onRetry
}) => {
  return (
    <div
      role="alert"
      className="bg-red-950/30 border border-red-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 text-red-200 my-6"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-900/30 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-lg">
        <h3 className="text-base font-semibold text-red-300">
          Life Analysis Computation Error
        </h3>
        <p className="text-xs text-red-200/80 leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-800/50 border border-red-500/40 rounded-xl text-xs font-semibold text-red-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Retry Analysis</span>
        </button>
      )}
    </div>
  );
};
