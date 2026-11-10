import type { Dispatch, SetStateAction } from 'react';
import type { AppState, DashaTimingProjectionState } from './AppState';
import type { BirthDetails } from '../types';
import type { AppPage } from './navigation/navigationTypes';
import { ProductAnalysisService, type ProductAnalysisRunSnapshot } from '../product/analysis';
import {
  buildDashaTimingViewModel,
  type BuildDashaTimingViewModelInput,
  type DashaTimingViewModel
} from '../product/dasha-timing';

export interface AppController {
  navigate: (page: AppPage) => void;
  openBirthForm: () => void;
  closeBirthForm: () => void;
  resetPreset: () => void;
  analyze: (birthDetails: BirthDetails) => Promise<void>;
  selectPeriod: (mahadashaId: string, antardashaId: string) => Promise<void>;
  /** Rebuilds only the optional Dasha projection for the active canonical analysis. */
  retryDashaTiming: () => Promise<void>;
}

export type DashaTimingProjectionBuilder = (input: BuildDashaTimingViewModelInput) => DashaTimingViewModel;

export function createAppController(
  setState: Dispatch<SetStateAction<AppState>>,
  service: ProductAnalysisService = new ProductAnalysisService(),
  projectionBuilder: DashaTimingProjectionBuilder = buildDashaTimingViewModel
): AppController {
  let analysisRequestId = 0;
  let selectionRequestId = 0;
  let projectionRequestId = 0;
  let currentRunSnapshot: ProductAnalysisRunSnapshot | undefined;
  let currentAnalysisId: string | undefined;
  let projectionRetryInFlight = false;

  const buildProjection = (snapshot: ProductAnalysisRunSnapshot): DashaTimingViewModel | undefined => {
    const pipelineState = snapshot.pipelineState;
    const temporalState = pipelineState?.temporalState;
    if (!temporalState || !snapshot.horoscope || !pipelineState) return undefined;
    return projectionBuilder({
      temporalState,
      horoscope: snapshot.horoscope,
      careerTiming: pipelineState.analysis?.careerDetail?.timing,
      wealthTiming: pipelineState.analysis?.wealthDetail?.timing
    });
  };

  return {
    navigate: (page: AppPage) => setState(prev => ({ ...prev, activePage: page })),
    openBirthForm: () => setState(prev => ({ ...prev, isBirthFormOpen: true })),
    closeBirthForm: () => setState(prev => ({ ...prev, isBirthFormOpen: false })),
    resetPreset: () => setState(prev => ({ ...prev, activePage: 'overview' })),

    analyze: async (birthDetails: BirthDetails) => {
      const requestId = ++analysisRequestId;
      ++selectionRequestId;
      ++projectionRequestId;
      projectionRetryInFlight = false;
      currentRunSnapshot = undefined;
      currentAnalysisId = undefined;

      setState(prev => ({
        ...prev,
        productAnalysis: { status: 'LOADING', requestId },
        lifeAnalysisState: { status: 'LOADING' },
        horoscope: undefined,
        selectionState: { status: 'IDLE' },
        dashaTimingViewModel: undefined,
        dashaTimingProjectionError: undefined,
        dashaTimingProjectionState: { status: 'IDLE', requestId }
      }));

      try {
        const run = await service.analyzeRun(birthDetails);
        if (requestId !== analysisRequestId) return;

        const { analysis, snapshot } = run;
        const isCanonicalSuccess = analysis.status !== 'ERROR';
        currentRunSnapshot = isCanonicalSuccess ? snapshot : undefined;
        currentAnalysisId = isCanonicalSuccess ? analysis.analysisId : undefined;

        let dashaTimingViewModel: DashaTimingViewModel | undefined;
        let dashaTimingProjectionError: string | undefined;
        let projectionState: DashaTimingProjectionState = { status: 'IDLE', requestId, ...(isCanonicalSuccess ? { analysisId: analysis.analysisId } : {}) };

        if (isCanonicalSuccess) {
          try {
            dashaTimingViewModel = buildProjection(snapshot);
            projectionState = dashaTimingViewModel
              ? { status: 'READY', requestId, analysisId: analysis.analysisId }
              : { status: 'IDLE', requestId, analysisId: analysis.analysisId };
          } catch (error) {
            dashaTimingProjectionError = error instanceof Error
              ? error.message
              : 'Dasha timing projection failed for an unknown reason.';
            projectionState = { status: 'ERROR', requestId, analysisId: analysis.analysisId, error: dashaTimingProjectionError };
          }
        }

        const errorMessage = analysis.status === 'ERROR'
          ? analysis.warnings.find(warning => warning.severity === 'ERROR')?.message ?? 'Analysis calculation failed.'
          : undefined;

        setState(prev => ({
          ...prev,
          productAnalysis: {
            status: isCanonicalSuccess ? 'READY' : 'ERROR',
            analysis,
            ...(errorMessage ? { error: errorMessage } : {}),
            requestId,
            ...(isCanonicalSuccess ? { analysisId: analysis.analysisId, sourceAnalysisId: analysis.analysisId } : {})
          },
          lifeAnalysisState: snapshot.pipelineState ?? (errorMessage
            ? { status: 'ERROR', errorMessage }
            : { status: 'READY' }),
          horoscope: snapshot.horoscope,
          dashaTimingViewModel,
          dashaTimingProjectionError,
          dashaTimingProjectionState: projectionState
        }));
      } catch (error) {
        if (requestId !== analysisRequestId) return;
        currentRunSnapshot = undefined;
        currentAnalysisId = undefined;
        const errorMessage = error instanceof Error ? error.message : 'Analysis calculation failed.';
        setState(prev => ({
          ...prev,
          productAnalysis: { status: 'ERROR', error: errorMessage, requestId },
          lifeAnalysisState: { status: 'ERROR', errorMessage },
          horoscope: undefined,
          dashaTimingViewModel: undefined,
          dashaTimingProjectionError: undefined,
          dashaTimingProjectionState: { status: 'IDLE', requestId }
        }));
      }
    },

    selectPeriod: async (mahadashaId: string, antardashaId: string) => {
      const snapshot = currentRunSnapshot;
      const analysisId = currentAnalysisId;
      if (!snapshot || !analysisId) {
        const requestId = ++selectionRequestId;
        setState(prev => ({
          ...prev,
          selectionState: {
            status: 'ERROR',
            error: 'No active analysis run. Analyze birth details before selecting a period.',
            requestId
          }
        }));
        return;
      }

      const requestId = ++selectionRequestId;
      setState(prev => ({
        ...prev,
        selectionState: { status: 'SUBMITTING', requestId, analysisId, mahadashaId, antardashaId }
      }));

      try {
        const analysis = await service.selectPeriodForRun(snapshot, mahadashaId, antardashaId, true);
        if (requestId !== selectionRequestId || analysisId !== currentAnalysisId) return;
        setState(prev => ({
          ...prev,
          productAnalysis: {
            ...prev.productAnalysis,
            analysis,
            analysisId: analysis.analysisId,
            sourceAnalysisId: analysisId,
            requestId: prev.productAnalysis.requestId
          },
          selectionState: { status: 'READY', requestId, analysisId, mahadashaId, antardashaId }
        }));
      } catch (error) {
        if (requestId !== selectionRequestId || analysisId !== currentAnalysisId) return;
        const errorMessage = error instanceof Error ? error.message : 'Period selection failed.';
        setState(prev => ({
          ...prev,
          selectionState: { status: 'ERROR', error: errorMessage, requestId, analysisId, mahadashaId, antardashaId }
        }));
      }
    },

    retryDashaTiming: async () => {
      const snapshot = currentRunSnapshot;
      const analysisId = currentAnalysisId;
      if (!snapshot || !analysisId) {
        setState(prev => ({
          ...prev,
          dashaTimingProjectionState: {
            status: 'IDLE'
          },
          dashaTimingProjectionError: 'No active canonical analysis is available for Dasha timing retry.'
        }));
        return;
      }
      if (projectionRetryInFlight) return;

      projectionRetryInFlight = true;
      const requestId = ++projectionRequestId;
      setState(prev => ({
        ...prev,
        dashaTimingProjectionState: { status: 'RETRYING', requestId, analysisId }
      }));

      try {
        const viewModel = buildProjection(snapshot);
        if (requestId !== projectionRequestId || analysisId !== currentAnalysisId) return;
        if (!viewModel) throw new Error('Dasha timing data is unavailable for the active analysis.');
        setState(prev => ({
          ...prev,
          dashaTimingViewModel: viewModel,
          dashaTimingProjectionError: undefined,
          dashaTimingProjectionState: { status: 'READY', requestId, analysisId }
        }));
      } catch (error) {
        if (requestId !== projectionRequestId || analysisId !== currentAnalysisId) return;
        const errorMessage = error instanceof Error ? error.message : 'Dasha timing projection failed for an unknown reason.';
        setState(prev => ({
          ...prev,
          dashaTimingViewModel: undefined,
          dashaTimingProjectionError: errorMessage,
          dashaTimingProjectionState: { status: 'ERROR', requestId, analysisId, error: errorMessage }
        }));
      } finally {
        if (requestId === projectionRequestId) projectionRetryInFlight = false;
      }
    }
  };
}
