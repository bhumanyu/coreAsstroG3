import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface ReasoningUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const ReasoningUnavailableState: React.FC<ReasoningUnavailableStateProps> = ({ onRetry }) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Astrological Reasoning Unavailable"
        message="No reasoning graph could be calculated for the current chart. Please calculate or select an astrological birth profile to inspect the decision hierarchy and rule evidence."
        icon={<BrainCircuit className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
