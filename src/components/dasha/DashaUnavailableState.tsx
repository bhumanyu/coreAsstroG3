import React from 'react';
import { Clock } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface DashaUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const DashaUnavailableState: React.FC<DashaUnavailableStateProps> = ({ onRetry }) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Dasha & Timing Analysis Unavailable"
        message="No timing or dasha analysis could be calculated for the current chart. Please calculate or select an astrological birth profile to inspect chronological activation hierarchy."
        icon={<Clock className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
