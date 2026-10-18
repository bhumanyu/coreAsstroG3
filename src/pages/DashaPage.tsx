/**
 * Dasha & Timing Page (P-UI-07)
 *
 * Pure presentation projection over canonical ProductAnalysis aggregate.
 * Does NOT perform any astrology/domain/Vimshottari/Dasha/transit/AI calculations.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
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
  readonly selectionState?: { status: 'IDLE' | 'SUBMITTING' | 'READY' | 'ERROR'; error?: string };
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
  readonly onSelectPeriod?: (mahadashaId: string, antardashaId: string) => Promise<void>;
}

export const DashaPage: React.FC<DashaPageProps> = ({
  productAnalysisState,
  selectionState,
  onRetry,
  onNavigate,
  onSelectPeriod
}) => {
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;
  const selectionStatus = selectionState?.status;
  const selectionError = selectionState?.error;

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
  const [domainToggle, setDomainToggle] = useState<'CAREER' | 'WEALTH' | 'BOTH'>('BOTH');
  const [submittedPeriod, setSubmittedPeriod] = useState<{ mahadashaId: string; antardashaId: string } | null>(null);
  const requestRef = useRef(0);

  // isSubmitting is derived from selectionState
  const isSubmitting = selectionStatus === 'SUBMITTING';

  // Clear submitted period when dropdown changes (hides stale report)
  const handleSelectionChange = useCallback(() => {
    setSubmittedPeriod(null);
  }, []);

  // Handle period selection with stale-response guard
  const handleSelectPeriod = useCallback(async (mahadashaId: string, antardashaId: string) => {
    if (!onSelectPeriod) return;

    const requestId = ++requestRef.current;
    setSubmittedPeriod({ mahadashaId, antardashaId });

    try {
      await onSelectPeriod(mahadashaId, antardashaId);
    } catch (error) {
      console.error('Period selection failed:', error);
    } finally {
      // Only clear submitting state if this is still the current request
      if (requestId === requestRef.current) {
        // isSubmitting is derived from selectionState, no local state to clear
      }
    }
  }, [onSelectPeriod]);

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
          onSelectionChange={handleSelectionChange}
        />
      )}

      {/* Selection Error Banner */}
      {selectionStatus === 'ERROR' && selectionError && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-rose-300">
              Selection Error
            </span>
          </div>
          <div className="text-xs text-slate-300">{selectionError}</div>
        </div>
      )}

      {/* Selected Period Report */}
      {selectedPeriod &&
        selectedPeriod.status === 'OK' &&
        selectedPeriod.synthesis &&
        submittedPeriod &&
        selectedPeriod.synthesis.period.mahadashaId === submittedPeriod.mahadashaId &&
        selectedPeriod.synthesis.period.antardashaId === submittedPeriod.antardashaId && (
          <SelectedPeriodReport
            synthesis={selectedPeriod.synthesis}
            domainToggle={domainToggle}
            onDomainToggle={setDomainToggle}
          />
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
