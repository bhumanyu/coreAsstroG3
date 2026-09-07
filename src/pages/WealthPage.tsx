import React from 'react';
import { Coins } from 'lucide-react';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import { PageHeading } from '../components/layout/PageHeading';
import { WealthAnalysisCard } from '../components/lifeAnalysis/WealthAnalysisCard';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';
import { LifeAnalysisError } from '../components/lifeAnalysis/LifeAnalysisError';
import { EmptyState } from '../components/fullNatalReport/EmptyState';
import type { AppPage } from '../app/navigation/navigationTypes';

export interface WealthPageProps {
  readonly state: LifeAnalysisProductState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const WealthPage: React.FC<WealthPageProps> = ({
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
        title="Wealth Analysis Unavailable"
        message="No wealth analysis could be calculated for the current chart."
        icon={<Coins className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const { analysis } = state;
  const wealthSummary = analysis.domains.find((d) => d.domain === 'WEALTH');

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Life Domain Analysis"
        title="Wealth & Financial Prosperity"
        description="Classical evaluation of 2nd house (accumulation), 11th house (gains), Dhana yoga formations, and financial manifestation potential."
      />

      <WealthAnalysisCard
        detail={analysis.wealthDetail}
        summary={wealthSummary}
        why={analysis.wealthWhy}
      />
    </div>
  );
};
