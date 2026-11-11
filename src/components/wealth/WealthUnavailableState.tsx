import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface WealthUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const WealthUnavailableState: React.FC<WealthUnavailableStateProps> = ({ onRetry }) => {
  const { t } = useTranslation('wealth');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('status.unavailableTitle')}
        message={t('status.unavailableMessage')}
        icon={<Coins className="w-6 h-6 text-amber-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
