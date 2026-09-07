import React from 'react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';
import { Compass } from 'lucide-react';

export interface OverviewEmptyStateProps {
  readonly onRetry?: () => void;
}

export const OverviewEmptyState: React.FC<OverviewEmptyStateProps> = ({ onRetry }) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Chart Overview Unavailable"
        message="Calculate or select an astrological birth profile to view unified life domain synthesis, career and wealth indicators, and active planetary timing."
        icon={<Compass className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
