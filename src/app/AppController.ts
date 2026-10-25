import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from './AppState';
import type { BirthDetails } from '../types';
import type { AppPage } from './navigation/navigationTypes';
import { ProductAnalysisService, type ProductAnalysisRunSnapshot } from '../product/analysis';
import { buildDashaTimingViewModel, type DashaTimingViewModel } from '../product/dasha-timing';

export interface AppController {
  navigate: (page: AppPage) => void;
  openBirthForm: () => void;
  closeBirthForm: () => void;
  resetPreset: () => void;
  analyze: (birthDetails: BirthDetails) => Promise<void>;
  selectPeriod: (mahadashaId: string, antardashaId: string) => Promise<void>;
}

export function createAppController(
  setState: Dispatch<SetStateAction<AppState>>,
  service: ProductAnalysisService = new ProductAnalysisService()
): AppController {
  let currentRequestId = 0;
  let currentRunSnapshot: ProductAnalysisRunSnapshot | undefined;

  return {
    navigate: (page: AppPage) => {
      setState((prev) => ({ ...prev, activePage: page }));
    },
    openBirthForm: () => {
      setState((prev) => ({ ...prev, isBirthFormOpen: true }));
    },
    closeBirthForm: () => {
      setState((prev) => ({ ...prev, isBirthFormOpen: false }));
    },
    resetPreset: () => {
      setState((prev) => ({ ...prev, activePage: 'overview' }));
    },
    analyze: async (birthDetails: BirthDetails) => {
      const requestId = ++currentRequestId;
      currentRunSnapshot = undefined;

      setState((prev) => ({
        ...prev,
        productAnalysis: { status: 'LOADING' },
        lifeAnalysisState: { status: 'LOADING' }
      }));

      try {
        const run = await service.analyzeRun(birthDetails);
        const analysis = run.analysis;

        // Stale-result guard: discard late-resolving results for previous requests
        if (requestId !== currentRequestId) {
          return;
        }

        currentRunSnapshot = run.snapshot;
        const { pipelineState, horoscope } = run.snapshot;
        let dashaTimingViewModel: DashaTimingViewModel | undefined;
        const temporalState = pipelineState?.temporalState;
        if (temporalState && horoscope && pipelineState) {
          try {
            dashaTimingViewModel = buildDashaTimingViewModel({
              temporalState,
              horoscope,
              careerTiming: pipelineState.analysis?.careerDetail?.timing,
              wealthTiming: pipelineState.analysis?.wealthDetail?.timing
            });
          } catch {
            dashaTimingViewModel = undefined;
          }
        }

        if (analysis.status === 'ERROR') {
          const errorMsg =
            analysis.warnings.find((w) => w.severity === 'ERROR')?.message ||
            'Analysis calculation failed.';
          setState((prev) => ({
            ...prev,
            productAnalysis: {
              status: 'ERROR',
              analysis,
              error: errorMsg,
              horoscope
            },
            lifeAnalysisState: pipelineState ?? {
              status: 'ERROR',
              errorMessage: errorMsg
            },
            horoscope,
            dashaTimingViewModel
          }));
        } else {
          setState((prev) => ({
            ...prev,
            productAnalysis: {
              status: 'READY',
              analysis,
              horoscope
            },
            lifeAnalysisState: pipelineState ?? {
              status: 'READY'
            },
            horoscope,
            dashaTimingViewModel
          }));
        }
      } catch (error) {
        if (requestId !== currentRequestId) {
          return;
        }

        currentRunSnapshot = undefined;
        const errorMsg = error instanceof Error ? error.message : 'Analysis calculation failed.';
        setState((prev) => ({
          ...prev,
          productAnalysis: {
            status: 'ERROR',
            error: errorMsg
          },
          lifeAnalysisState: {
            status: 'ERROR',
            errorMessage: errorMsg
          }
        }));
      }
    },
    selectPeriod: async (mahadashaId: string, antardashaId: string) => {
      const requestId = ++currentRequestId;
      const snapshot = currentRunSnapshot;

      if (!snapshot) {
        setState((prev) => ({
          ...prev,
          selectionState: {
            status: 'ERROR',
            error: 'No active analysis run. Analyze birth details before selecting a period.'
          }
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        selectionState: { status: 'SUBMITTING' }
      }));

      try {
        // PBA-09: Trigger AI explanation for selected-period analysis
        const analysis = await service.selectPeriodForRun(snapshot, mahadashaId, antardashaId, true);

        // Stale-result guard: discard late-resolving results for previous requests
        if (requestId !== currentRequestId) {
          return;
        }

        setState((prev) => ({
          ...prev,
          productAnalysis: {
            ...prev.productAnalysis,
            analysis,
            horoscope: snapshot.horoscope
          },
          selectionState: { status: 'READY' }
        }));
      } catch (error) {
        if (requestId !== currentRequestId) {
          return;
        }

        const errorMsg = error instanceof Error ? error.message : 'Period selection failed.';
        setState((prev) => ({
          ...prev,
          selectionState: {
            status: 'ERROR',
            error: errorMsg
          }
        }));
      }
    }
  };
}
