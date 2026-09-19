import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from './AppState';
import type { BirthDetails } from '../types';
import type { AppPage } from './navigation/navigationTypes';
import { ProductAnalysisService } from '../product/analysis';
import { calculateHoroscope } from '../engine/astroEngine';
import { buildDashaTimingViewModel, type DashaTimingViewModel } from '../product/dasha-timing';
import { createAnalysisContext } from '../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../core/analysis/resolveAnalysisTemporalState';
import { mapMethodology } from '../product/analysis/productAnalysisMapper';

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
      const horoscope = service.lastHoroscope ?? calculateHoroscope(birthDetails);
      let dashaTimingViewModel: DashaTimingViewModel | undefined;
      if (horoscope) {
        const context = createAnalysisContext({
          asOf: analysis.asOf,
          methodology: mapMethodology(birthDetails),
          engineVersion: analysis.engineVersion,
          rulesVersion: analysis.rulesVersion
        });
        const temporalState = resolveAnalysisTemporalState(horoscope, context);
        dashaTimingViewModel = buildDashaTimingViewModel({
          temporalState,
          horoscope,
          careerTiming: pipelineState?.analysis?.careerDetail?.timing,
          wealthTiming: pipelineState?.analysis?.wealthDetail?.timing
        });
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
    }
  };
}

