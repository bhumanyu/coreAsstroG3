/**
 * Career Page (P-UI-04)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/D10/Dasha/transit/AI calculations.
 */

import React, { useMemo } from 'react';
import type { ProductAnalysisState } from '../app/AppState';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import {
  CareerHero,
  CareerPromiseSection,
  CareerExpressionSection,
  CareerD10Section,
  CareerDashaSection,
  CareerTransitSection,
  CareerQualificationsSection,
  CareerEvidenceSection,
  CareerConclusionSection,
  CareerLoadingState,
  CareerUnavailableState,
  CareerErrorState
} from '../components/career';

export interface CareerPageProps {
  readonly state?: LifeAnalysisProductState;
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectCareerViewModel(analysis) : undefined),
    [analysis]
  );

  // 1. Error state when no analysis is available
  if (status === 'ERROR' && !analysis) {
    return <CareerErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 2. Loading state when calculation is actively running or idle
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <CareerLoadingState />;
  }

  // 3. Unavailable state when no analysis can be projected
  if (!analysis || !viewModel) {
    return <CareerUnavailableState onRetry={onRetry} />;
  }

  // 4. Render pure presentation sections
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <CareerHero hero={viewModel.hero} />

      <CareerPromiseSection promise={viewModel.promise} />

      <CareerExpressionSection expression={viewModel.expression} />

      <CareerD10Section d10={viewModel.d10} />

      <CareerDashaSection dasha={viewModel.dasha} />

      <CareerTransitSection transit={viewModel.transit} />

      <CareerQualificationsSection qualifications={viewModel.qualifications} />

      <CareerEvidenceSection
        evidence={viewModel.evidence}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />

      <CareerConclusionSection
        conclusion={viewModel.conclusion}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />
    </div>
  );
};
