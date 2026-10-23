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
  SelectedPeriodReport,
  SelectedPeriodAiExplanation
} from '../components/dasha';

export interface DashaPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly selectionState?: { status: 'IDLE' | 'SUBMITTING' | 'READY' | 'ERROR'; error?: string };
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
  readonly onSelectPeriod?: (mahadashaId: string, antardashaId: string) => Promise<void>;
}

// Helper to determine if selection error banner should be shown
// Shows generic selectionState error only when there's no typed selectedPeriod failure
function deriveSelectionErrorBanner(
  selectionState: { status: 'IDLE' | 'SUBMITTING' | 'READY' | 'ERROR'; error?: string } | undefined,
  selectedPeriod: { status: string } | undefined
): boolean {
  if (!selectionState || selectionState.status !== 'ERROR') {
    return false;
  }
  // Suppress generic selectionState banner when selectedPeriod is already in a non-OK state
  // (the typed selectedPeriod banner is more specific and carries domain error codes)
  if (selectedPeriod && selectedPeriod.status !== 'OK') {
    return false;
  }
  return true;
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

  // isSubmitting is derived from selectionState
  const isSubmitting = selectionStatus === 'SUBMITTING';

  // Clear submitted period when dropdown changes (hides stale report)
  const handleSelectionChange = useCallback(() => {
    setSubmittedPeriod(null);
  }, []);

  // Handle period selection
  const handleSelectPeriod = useCallback(async (mahadashaId: string, antardashaId: string) => {
    if (!onSelectPeriod) return;

    setSubmittedPeriod({ mahadashaId, antardashaId });

    await onSelectPeriod(mahadashaId, antardashaId);
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
      {deriveSelectionErrorBanner(selectionState, selectedPeriod) && selectionError && (
        <div role="alert" aria-live="assertive" className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-rose-300">
              Selection Error
            </span>
          </div>
          <div className="text-xs text-slate-300">{selectionError}</div>
        </div>
      )}

      {/* Selected Period Typed Failure Banner */}
      {selectedPeriod && selectedPeriod.status !== 'OK' && (
        <div role="alert" aria-live="assertive" key={`selected-period-error-${selectedPeriod.status}`} className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-amber-300">
              Period Selection Failed
            </span>
          </div>
          <div className="text-xs text-slate-300">
            Status: {selectedPeriod.status}
            {selectedPeriod.error && <span> — {selectedPeriod.error}</span>}
          </div>
        </div>
      )}

      {/* Selected Period Report */}
      {(() => {
        const canShowSelectedPeriodReport =
          selectedPeriod &&
          selectedPeriod.status === 'OK' &&
          selectedPeriod.synthesis &&
          selectionStatus === 'READY' &&
          submittedPeriod &&
          selectedPeriod.synthesis.period.mahadashaId === submittedPeriod.mahadashaId &&
          selectedPeriod.synthesis.period.antardashaId === submittedPeriod.antardashaId;
        return canShowSelectedPeriodReport ? (
          <>
            <SelectedPeriodReport
              synthesis={selectedPeriod.synthesis}
              domainToggle={domainToggle}
              onDomainToggle={setDomainToggle}
            />
            {/* Selected Period AI Explanation (PBA-09) */}
            <SelectedPeriodAiExplanation
              synthesis={selectedPeriod.synthesis}
              submittedPeriod={submittedPeriod}
            />
          </>
        ) : null;
      })()}

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
