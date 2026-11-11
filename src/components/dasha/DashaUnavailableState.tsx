import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface DashaUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const DashaUnavailableState: React.FC<DashaUnavailableStateProps> = ({ onRetry }) => {
  const { t } = useTranslation('dasha');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('status.unavailableTitle')}
        message={t('status.unavailableMessage')}
        icon={<Clock className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
