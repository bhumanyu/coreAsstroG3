import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from './AppState';
import type { BirthDetails } from '../types';
import type { AppPage } from './navigation/navigationTypes';
import { ProductAnalysisService } from '../product/analysis';

export interface AppController {
  navigate: (page: AppPage) => void;
  openBirthForm: () => void;
  closeBirthForm: () => void;
  resetPreset: () => void;
  analyze: (birthDetails: BirthDetails) => Promise<void>;
}

export function createAppController(
  setState: Dispatch<SetStateAction<AppState>>,
  service: ProductAnalysisService = new ProductAnalysisService()
): AppController {
  let currentRequestId = 0;

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

      setState((prev) => ({
        ...prev,
        productAnalysis: { status: 'LOADING' },
        lifeAnalysisState: { status: 'LOADING' }
      }));

      const analysis = await service.analyze(birthDetails);

      // Stale-result guard: discard late-resolving results for previous requests
      if (requestId !== currentRequestId) {
        return;
      }

      const pipelineState = service.lastPipelineState;

      if (analysis.status === 'ERROR') {
        const errorMsg =
          analysis.warnings.find((w) => w.severity === 'ERROR')?.message ||
          'Analysis calculation failed.';
        setState((prev) => ({
          ...prev,
          productAnalysis: {
            status: 'ERROR',
            analysis,
            error: errorMsg
          },
          lifeAnalysisState: pipelineState ?? {
            status: 'ERROR',
            errorMessage: errorMsg
          }
        }));
      } else {
        setState((prev) => ({
          ...prev,
          productAnalysis: {
            status: 'READY',
            analysis
          },
          lifeAnalysisState: pipelineState ?? {
            status: 'READY'
          }
        }));
      }
    }
  };
}

