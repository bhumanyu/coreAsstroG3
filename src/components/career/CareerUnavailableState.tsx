import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react';
import { AnalysisEmptyState } from '../../product/analysis/AnalysisEmptyState';

export interface CareerUnavailableStateProps {
  readonly onRetry?: () => void;
}

export const CareerUnavailableState: React.FC<CareerUnavailableStateProps> = ({ onRetry }) => {
  const { t } = useTranslation('career');
  return (
    <div className="py-6">
      <AnalysisEmptyState
        title={t('status.unavailableTitle')}
        message={t('status.unavailableMessage')}
        icon={<Briefcase className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        onRetry={onRetry}
      />
    </div>
  );
};
