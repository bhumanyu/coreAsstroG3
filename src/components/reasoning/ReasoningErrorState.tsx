import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface ReasoningErrorStateProps {
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

export const ReasoningErrorState: React.FC<ReasoningErrorStateProps> = ({
  errorMessage,
  onRetry
}) => {
  const { t } = useTranslation('reports');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('reasoning.status.errorTitle')}
        message={
          errorMessage ||
          t('reasoning.status.errorMessage')
        }
        icon={<AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
