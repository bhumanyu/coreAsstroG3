import React from 'react';
import { Briefcase } from 'lucide-react';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import { PageHeading } from '../components/layout/PageHeading';
import { CareerAnalysisCard } from '../components/lifeAnalysis/CareerAnalysisCard';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';
import { LifeAnalysisError } from '../components/lifeAnalysis/LifeAnalysisError';
import { EmptyState } from '../components/fullNatalReport/EmptyState';
import type { AppPage } from '../app/navigation/navigationTypes';

export interface CareerPageProps {
  readonly state: LifeAnalysisProductState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({
  state,
  onRetry
}) => {
  if (state.status === 'LOADING') {
    return <LifeAnalysisLoading />;
  }

  if (state.status === 'ERROR' && !state.analysis) {
    return (
      <LifeAnalysisError
        message={state.errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (!state.analysis) {
    return (
      <EmptyState
        title="Career Analysis Unavailable"
        message="No career analysis could be calculated for the current chart."
        icon={<Briefcase className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const { analysis } = state;
  const careerSummary = analysis.domains.find((d) => d.domain === 'CAREER');

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Life Domain Analysis"
        title="Career & Professional Trajectory"
        description="Comprehensive evaluation of status, vocational capacity, D10 Dashamsha divisional strength, and career dasha timing."
      />

      <CareerAnalysisCard
        detail={analysis.careerDetail}
        summary={careerSummary}
        why={analysis.careerWhy}
      />
    </div>
  );
};
