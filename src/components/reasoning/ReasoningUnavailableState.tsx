import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface ReasoningUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const ReasoningUnavailableState: React.FC<ReasoningUnavailableStateProps> = ({ onRetry }) => {
  const { t } = useTranslation('reports');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('reasoning.status.unavailableTitle')}
        message={t('reasoning.status.unavailableMessage')}
        icon={<BrainCircuit className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
