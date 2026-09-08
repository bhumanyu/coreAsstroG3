import React from 'react';
import { Coins } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface WealthUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const WealthUnavailableState: React.FC<WealthUnavailableStateProps> = ({ onRetry }) => {
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title="Wealth Analysis Unavailable"
        message="No wealth analysis could be calculated for the current chart. Please calculate or select an astrological birth profile to inspect financial assets and timing."
        icon={<Coins className="w-6 h-6 text-amber-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
