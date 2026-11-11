import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';
import { AlertTriangle } from 'lucide-react';

export interface OverviewErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const OverviewErrorState: React.FC<OverviewErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('error.title')}
        message={
          errorMessage ||
          t('error.message')
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
