import React from 'react';
import { Briefcase } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface CareerUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const CareerUnavailableState: React.FC<CareerUnavailableStateProps> = ({ onRetry }) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Career Analysis Unavailable"
        message="No career analysis could be calculated for the current chart. Please calculate or select an astrological birth profile to inspect vocational capacity and timing."
        icon={<Briefcase className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
