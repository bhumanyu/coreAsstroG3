import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';
import { Compass } from 'lucide-react';

export interface OverviewEmptyStateProps {
  readonly onRetry?: () => void;
}

export const OverviewEmptyState: React.FC<OverviewEmptyStateProps> = ({ onRetry }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('empty.title')}
        message={t('empty.message')}
        icon={<Compass className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
