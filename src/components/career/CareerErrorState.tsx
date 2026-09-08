import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface CareerErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const CareerErrorState: React.FC<CareerErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Career Analysis Computation Error"
        message={
          errorMessage ||
          'An error occurred while compiling the vocational analysis. Please verify birth details and retry.'
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
