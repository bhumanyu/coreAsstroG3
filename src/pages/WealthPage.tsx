/**
 * Wealth Page (P-UI-05)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/D2/Dasha/transit/AI calculations.
 */

import React, { useMemo } from 'react';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import {
  WealthHero,
  WealthOverallSection,
  WealthDimensionsSection,
  WealthD2Section,
  WealthDashaSection,
  WealthTransitSection,
  WealthSpeculativeRiskSection,
  WealthQualificationsSection,
  WealthEvidenceSection,
  WealthConclusionSection,
  WealthLoadingState,
  WealthUnavailableState,
  WealthErrorState
} from '../components/wealth';

export interface WealthPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const WealthPage: React.FC<WealthPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectWealthViewModel(analysis) : undefined),
    [analysis]
  );

  // 1. Error state when no analysis is available
  if (status === 'ERROR' && !analysis) {
    return <WealthErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 2. Loading state when calculation is actively running or idle
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <WealthLoadingState />;
  }

  // 3. Unavailable state when no analysis can be projected
  if (!analysis || !viewModel) {
    return <WealthUnavailableState onRetry={onRetry} />;
  }

  // 4. Render pure presentation sections in spec order
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <WealthHero hero={viewModel.hero} />

      <WealthOverallSection overall={viewModel.overall} />

      <WealthDimensionsSection dimensions={viewModel.dimensions} />

      <WealthD2Section d2={viewModel.d2} />

      <WealthDashaSection dasha={viewModel.dasha} />

      <WealthTransitSection transit={viewModel.transit} />

      <WealthSpeculativeRiskSection speculativeRisk={viewModel.speculativeRisk} />

      <WealthQualificationsSection qualifications={viewModel.qualifications} />

      <WealthEvidenceSection
        evidence={viewModel.evidence}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />

      <WealthConclusionSection
        conclusion={viewModel.conclusion}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />
    </div>
  );
};
