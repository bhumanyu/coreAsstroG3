import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface WealthErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const WealthErrorState: React.FC<WealthErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Wealth Analysis Computation Error"
        message={
          errorMessage ||
          'An error occurred while compiling the financial analysis. Please verify birth details and retry.'
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
