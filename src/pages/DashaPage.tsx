/**
 * Dasha & Timing Page (P-UI-07)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/Vimshottari/Dasha/transit/AI calculations.
 */

import React, { useMemo, useState, useCallback } from 'react';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectDashaViewModel } from '../product/analysis/dashaViewModel';
import {
  selectDashaPeriodOptions,
  selectSelectedPeriod
} from '../product/analysis/productAnalysisSelectors';
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
  DashaErrorState,
  SelectedPeriodSection,
  SelectedPeriodReport
} from '../components/dasha';

export interface DashaPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
  readonly onSelectPeriod?: (mahadashaId: string, antardashaId: string) => Promise<void>;
}

export const DashaPage: React.FC<DashaPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate,
  onSelectPeriod
}) => {
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectDashaViewModel(analysis) : undefined),
    [analysis]
  );

  const dashPeriodOptions = useMemo(
    () => (analysis ? selectDashaPeriodOptions(analysis) : undefined),
    [analysis]
  );

  const selectedPeriod = useMemo(
    () => (analysis ? selectSelectedPeriod(analysis) : undefined),
    [analysis]
  );

  // State for period selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionRequestToken, setSelectionRequestToken] = useState(0);
  const [domainToggle, setDomainToggle] = useState<'CAREER' | 'WEALTH' | 'BOTH'>('BOTH');

  // Handle period selection with stale-response guard
  const handleSelectPeriod = useCallback(async (mahadashaId: string, antardashaId: string) => {
    if (!onSelectPeriod) return;

    const currentToken = selectionRequestToken + 1;
    setSelectionRequestToken(currentToken);
    setIsSubmitting(true);

    try {
      await onSelectPeriod(mahadashaId, antardashaId);

      // Stale-response guard: if token changed during request, ignore result
      if (currentToken !== selectionRequestToken + 1) {
        return;
      }
    } catch (error) {
      console.error('Period selection failed:', error);
    } finally {
      // Only clear submitting state if this is still the current request
      if (currentToken === selectionRequestToken) {
        setIsSubmitting(false);
      }
    }
  }, [onSelectPeriod, selectionRequestToken]);

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

      {/* Period Selection Section */}
      {dashPeriodOptions && onSelectPeriod && (
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={handleSelectPeriod}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Selected Period Report */}
      {selectedPeriod && selectedPeriod.status === 'OK' && selectedPeriod.synthesis && (
        <SelectedPeriodReport
          synthesis={selectedPeriod.synthesis}
          domainToggle={domainToggle}
          onDomainToggle={setDomainToggle}
        />
      )}

      {/* Error states for selected period */}
      {selectedPeriod && selectedPeriod.status !== 'OK' && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-rose-300">
              Selection Error: {selectedPeriod.status}
            </span>
          </div>
          {selectedPeriod.error && (
            <div className="text-xs text-slate-300">{selectedPeriod.error}</div>
          )}
        </div>
      )}

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
