/**
 * Dasha & Timing Page (P-UI-07)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/Vimshottari/Dasha/transit/AI calculations.
 */

import React, { useMemo } from 'react';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectDashaViewModel } from '../product/analysis/dashaViewModel';
import {
  DashaHero,
  CurrentDashaHierarchy,
  CareerActivationSection,
  WealthActivationSection,
  TransitTimingSection,
  DashaQualificationSection,
  DashaEvidenceSection,
  DashaLoadingState,
  DashaUnavailableState,
  DashaErrorState
} from '../components/dasha';

export interface DashaPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const DashaPage: React.FC<DashaPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectDashaViewModel(analysis) : undefined),
    [analysis]
  );

  // 1. Error state when no analysis is available
  if (status === 'ERROR' && !analysis) {
    return <DashaErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 2. Loading state when calculation is actively running or idle
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <DashaLoadingState />;
  }

  // 3. Unavailable state when no analysis can be projected
  if (!analysis || !viewModel) {
    return <DashaUnavailableState onRetry={onRetry} />;
  }

  // 4. Render pure presentation sections
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <DashaHero hero={viewModel.hero} />

      <CurrentDashaHierarchy
        hierarchy={viewModel.hierarchy}
        availability={viewModel.hero.availability}
      />

      <CareerActivationSection activation={viewModel.careerActivation} />

      <WealthActivationSection activation={viewModel.wealthActivation} />

      <TransitTimingSection transit={viewModel.transit} />

      <DashaQualificationSection qualifications={viewModel.qualifications} />

      <DashaEvidenceSection
        evidence={viewModel.evidence}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />
    </div>
  );
};
