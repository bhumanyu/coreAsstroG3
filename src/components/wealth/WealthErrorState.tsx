import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface WealthErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const WealthErrorState: React.FC<WealthErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  const { t } = useTranslation('wealth');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('status.errorTitle')}
        message={
          errorMessage ||
          t('status.errorMessage')
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
