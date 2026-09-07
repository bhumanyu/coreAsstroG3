import React from 'react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';
import { AlertTriangle } from 'lucide-react';

export interface OverviewErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const OverviewErrorState: React.FC<OverviewErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Overview Computation Error"
        message={
          errorMessage ||
          'An error occurred while compiling the unified astrological overview. Please verify birth details and retry.'
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
