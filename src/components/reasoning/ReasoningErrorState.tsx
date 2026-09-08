import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface ReasoningErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const ReasoningErrorState: React.FC<ReasoningErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Reasoning Computation Error"
        message={
          errorMessage ||
          'An error occurred while compiling the astrological reasoning graph. Please verify birth details and retry.'
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
