import { describe, it, expect, vi } from 'vitest';
import { createAppController } from '../AppController';
import { INITIAL_APP_STATE, INITIAL_PRODUCT_ANALYSIS_STATE, AppState } from '../AppState';
import type { Dispatch, SetStateAction } from 'react';
import type { ProductAnalysis } from '../../product/analysis/productAnalysisTypes';
import type {
  ProductAnalysisRun,
  ProductAnalysisRunSnapshot,
  ProductAnalysisService
} from '../../product/analysis';
import type { Horoscope } from '../../types';
import type { LifeAnalysisProductState } from '../../product/life-analysis/lifeAnalysisTypes';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';

const mockProductAnalysis: ProductAnalysis = {
  analysisId: 'mock-1',
  asOf: '2026-01-01',
  engineVersion: 'ASTRO_CORE_V1',
  rulesVersion: 'PARASHARA_CLASSICAL_RULES_V2',
  status: 'READY',
  chart: {
    ascendantSign: 'ARIES',
    ascendantDegree: 10,
    moonSign: 'TAURUS',
    sunSign: 'PISCES',
    moonNakshatra: 'Rohini'
  },
  methodology: {
    zodiacSystem: 'SIDEREAL',
    houseSystem: 'WHOLE_SIGN',
    ayanamsa: 'Lahiri',
    calculationEngine: 'ASTRO_CORE_V1',
    rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
    vargaRules: 'PARASHARA_D10_D2',
    dashaSystem: 'VIMSHOTTARI'
  },
  birth: {
    name: 'Test',
    placeOfBirth: 'New York',
    dateTime: '2000-01-01T12:00:00Z',
    latitude: 40.7,
    longitude: -74.0,
    timezone: '-5',
    ayanamsa: 'Lahiri'
  },
  career: {
    promise: { strength: 'STRONG', confidence: 'HIGH' },
    d10: { relationship: 'CONFIRMS' },
    activation: {
      dasha: { status: 'AVAILABLE', periods: [] },
      transit: { status: 'AVAILABLE', effect: 'NEUTRAL' }
    },
    qualifications: [],
    evidence: []
  },
  wealth: {
    overall: { status: 'SUPPORTED', promise: 'STRONG', confidence: 'HIGH' },
    dimensions: {
      accumulation: { status: 'STRONG' },
      gains: { status: 'STRONG' },
      fortune: { status: 'STRONG' },
      speculation: { status: 'MODERATE' }
    },
    d2: { relationship: 'CONFIRMS' },
    activation: {
      dasha: { status: 'AVAILABLE', periods: [] },
      transit: { status: 'AVAILABLE', effect: 'NEUTRAL' }
    },
    speculativeRisk: { level: 'LOW' },
    qualifications: [],
    evidence: []
  },
  dasha: {
    current: {}
  },
  reasoning: {
    nodes: [],
    primaryConclusions: []
  },
  ai: {
    status: 'UNAVAILABLE'
  },
  warnings: []
};

const mockErrorAnalysis: ProductAnalysis = {
  ...mockProductAnalysis,
  status: 'ERROR',
  warnings: [
    {
      domain: 'ALL',
      code: 'ERR_1',
      severity: 'ERROR',
      message: 'Failed to calculate chart coordinates'
    }
  ]
};

const mockHoroscope = { birthDetails: INITIAL_APP_STATE.birthDetails } as Horoscope;
const mockPipelineState: LifeAnalysisProductState = { status: 'READY' };

function makeRun(
  analysis: ProductAnalysis = mockProductAnalysis,
  birthDetails = INITIAL_APP_STATE.birthDetails,
  horoscope: Horoscope = mockHoroscope,
  pipelineState: LifeAnalysisProductState = mockPipelineState
): ProductAnalysisRun {
  const context: AnalysisContext = {
    asOf: analysis.asOf,
    methodology: analysis.methodology,
    engineVersion: analysis.engineVersion,
    rulesVersion: analysis.rulesVersion
  };
  const snapshot: ProductAnalysisRunSnapshot = Object.freeze({
    birthDetails,
    context,
    horoscope,
    pipelineState
  });
  return Object.freeze({ analysis, snapshot });
}

describe('AppController', () => {
  it('updates activePage via functional updater when navigate is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.navigate('career');

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.activePage).toBe('career');
    expect(currentState.birthDetails).toEqual(INITIAL_APP_STATE.birthDetails);
    expect(currentState.isBirthFormOpen).toBe(false);
  });

  it('updates isBirthFormOpen to true when openBirthForm is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE, isBirthFormOpen: false };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.openBirthForm();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.isBirthFormOpen).toBe(true);
  });

  it('updates isBirthFormOpen to false when closeBirthForm is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE, isBirthFormOpen: true };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.closeBirthForm();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.isBirthFormOpen).toBe(false);
  });

  it('navigates to overview when resetPreset is called', () => {
    let currentState: AppState = {
      ...INITIAL_APP_STATE,
      activePage: 'wealth'
    };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.resetPreset();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.activePage).toBe('overview');
  });

  it('uses functional update pattern preserving other state properties', () => {
    const setState = vi.fn();
    const controller = createAppController(setState);

    controller.navigate('detailed');
    expect(setState).toHaveBeenCalledWith(expect.any(Function));

    const updater = setState.mock.calls[0][0] as (prev: AppState) => AppState;
    const previousState: AppState = {
      activePage: 'overview',
      birthDetails: INITIAL_APP_STATE.birthDetails,
      isBirthFormOpen: true,
      productAnalysis: INITIAL_PRODUCT_ANALYSIS_STATE,
      lifeAnalysisState: { status: 'LOADING' },
      selectionState: { status: 'IDLE' }
    };

    const nextState = updater(previousState);
    expect(nextState.activePage).toBe('detailed');
    expect(nextState.birthDetails).toBe(previousState.birthDetails);
    expect(nextState.isBirthFormOpen).toBe(true);
    expect(nextState.productAnalysis).toBe(previousState.productAnalysis);
    expect(nextState.lifeAnalysisState).toBe(previousState.lifeAnalysisState);
  });

  describe('analyze', () => {
    it('sets productAnalysis and lifeAnalysisState to LOADING immediately upon invocation', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );

      let resolveAnalysis: (val: ProductAnalysisRun) => void = () => { };
      const pendingPromise = new Promise<ProductAnalysisRun>((resolve) => {
        resolveAnalysis = resolve;
      });

      const mockService = {
        analyzeRun: vi.fn().mockReturnValue(pendingPromise)
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      const analyzePromise = controller.analyze(INITIAL_APP_STATE.birthDetails);

      // Immediately upon calling analyze, state should transition to LOADING
      expect(currentState.productAnalysis.status).toBe('LOADING');
      expect(currentState.lifeAnalysisState.status).toBe('LOADING');

      // Resolve analysis
      resolveAnalysis(makeRun());
      await analyzePromise;

      expect(currentState.productAnalysis.status).toBe('READY');
    });

    it('updates productAnalysis to READY with analysis aggregate on success', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );

      const mockService = {
        analyzeRun: vi.fn().mockResolvedValue(makeRun())
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      await controller.analyze(INITIAL_APP_STATE.birthDetails);

      expect(currentState.productAnalysis.status).toBe('READY');
      expect(currentState.productAnalysis.analysis).toEqual(mockProductAnalysis);
      expect(currentState.lifeAnalysisState.status).toBe('READY');
    });

    it('keeps a successful analysis when the optional Dasha view-model builder fails', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );
      const temporalState = Object.defineProperty({}, 'asOf', {
        get: () => {
          throw new Error('Dasha projection failed');
        }
      });
      const pipelineState = {
        status: 'READY',
        temporalState
      } as unknown as LifeAnalysisProductState;
      const mockService = {
        analyzeRun: vi.fn().mockResolvedValue(makeRun(
          mockProductAnalysis,
          INITIAL_APP_STATE.birthDetails,
          mockHoroscope,
          pipelineState
        ))
      } as unknown as ProductAnalysisService;
      const controller = createAppController(setState, mockService);

      await controller.analyze(INITIAL_APP_STATE.birthDetails);

      expect(currentState.productAnalysis.status).toBe('READY');
      expect(currentState.productAnalysis.analysis).toBe(mockProductAnalysis);
      expect(currentState.productAnalysis.analysis?.career).toEqual(mockProductAnalysis.career);
      expect(currentState.productAnalysis.analysis?.wealth).toEqual(mockProductAnalysis.wealth);
      expect(currentState.dashaTimingViewModel).toBeUndefined();
    });

    it('updates productAnalysis to ERROR on failure with error message extracted from warnings', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );

      const mockService = {
        analyzeRun: vi.fn().mockResolvedValue(makeRun(
          mockErrorAnalysis,
          INITIAL_APP_STATE.birthDetails,
          mockHoroscope,
          { status: 'ERROR', errorMessage: 'Failed to calculate chart coordinates' }
        ))
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      await controller.analyze(INITIAL_APP_STATE.birthDetails);

      expect(currentState.productAnalysis.status).toBe('ERROR');
      expect(currentState.productAnalysis.error).toBe('Failed to calculate chart coordinates');
      expect(currentState.lifeAnalysisState.status).toBe('ERROR');
    });

    it('converts analyzeRun rejection to an error state and clears the active run', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );
      const mockService = {
        analyzeRun: vi.fn().mockRejectedValue(new Error('setup failed')),
        selectPeriodForRun: vi.fn()
      } as unknown as ProductAnalysisService;
      const controller = createAppController(setState, mockService);

      await expect(controller.analyze(INITIAL_APP_STATE.birthDetails)).resolves.toBeUndefined();

      expect(currentState.productAnalysis.status).toBe('ERROR');
      expect(currentState.productAnalysis.error).toBe('setup failed');
      expect(currentState.lifeAnalysisState).toEqual({
        status: 'ERROR',
        errorMessage: 'setup failed'
      });
      expect(currentState.productAnalysis.status).not.toBe('LOADING');

      await controller.selectPeriod('md_jupiter', 'ad_saturn');
      expect(currentState.selectionState).toEqual({
        status: 'ERROR',
        error: 'No active analysis run. Analyze birth details before selecting a period.'
      });
      expect(mockService.selectPeriodForRun).not.toHaveBeenCalled();
    });

    it('uses a fallback message when analysis rejects with a non-Error value', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );
      const mockService = {
        analyzeRun: vi.fn().mockRejectedValue('unexpected failure')
      } as unknown as ProductAnalysisService;
      const controller = createAppController(setState, mockService);

      await expect(controller.analyze(INITIAL_APP_STATE.birthDetails)).resolves.toBeUndefined();

      expect(currentState.productAnalysis.status).toBe('ERROR');
      expect(currentState.productAnalysis.error).toBe('Analysis calculation failed.');
      expect(currentState.lifeAnalysisState).toEqual({
        status: 'ERROR',
        errorMessage: 'Analysis calculation failed.'
      });
    });

    it('discards results from stale earlier requests when a newer analyze call has been made', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );

      let resolveReq1: (val: ProductAnalysisRun) => void = () => { };
      let resolveReq2: (val: ProductAnalysisRun) => void = () => { };

      const p1 = new Promise<ProductAnalysisRun>((resolve) => {
        resolveReq1 = resolve;
      });
      const p2 = new Promise<ProductAnalysisRun>((resolve) => {
        resolveReq2 = resolve;
      });

      const analysis1: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-1' };
      const analysis2: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-2' };
      const birth1 = { ...INITIAL_APP_STATE.birthDetails, name: 'First' };
      const birth2 = { ...INITIAL_APP_STATE.birthDetails, name: 'Second' };
      const horoscope1 = { birthDetails: birth1 } as Horoscope;
      const horoscope2 = { birthDetails: birth2 } as Horoscope;
      const pipeline1: LifeAnalysisProductState = { status: 'ERROR', errorMessage: 'stale run' };
      const pipeline2: LifeAnalysisProductState = { status: 'READY' };

      const mockService = {
        analyzeRun: vi
          .fn()
          .mockReturnValueOnce(p1)
          .mockReturnValueOnce(p2)
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);

      // Trigger request 1 then request 2
      const call1 = controller.analyze(birth1);
      const call2 = controller.analyze(birth2);

      // Resolve request 2 first
      resolveReq2(makeRun(analysis2, birth2, horoscope2, pipeline2));
      await call2;

      expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');
      expect(currentState.horoscope).toBe(horoscope2);
      expect(currentState.lifeAnalysisState).toBe(pipeline2);

      // Now resolve request 1 late - stale result guard should discard it
      resolveReq1(makeRun(analysis1, birth1, horoscope1, pipeline1));
      await call1;

      // State MUST retain analysis from request 2, NOT overwritten by stale request 1
      expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');
      expect(currentState.horoscope).toBe(horoscope2);
      expect(currentState.lifeAnalysisState).toBe(pipeline2);
    });

    it('discards a stale analyze rejection after a newer run succeeds', async () => {
      let currentState: AppState = { ...INITIAL_APP_STATE };
      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
        }
      );
      let rejectReq1: (reason: Error) => void = () => { };
      let resolveReq2: (run: ProductAnalysisRun) => void = () => { };
      const p1 = new Promise<ProductAnalysisRun>((_resolve, reject) => {
        rejectReq1 = reject;
      });
      const p2 = new Promise<ProductAnalysisRun>((resolve) => {
        resolveReq2 = resolve;
      });
      const birthA = { ...INITIAL_APP_STATE.birthDetails, name: 'Stale Chart' };
      const birthB = { ...INITIAL_APP_STATE.birthDetails, name: 'Current Chart' };
      const analysisB: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'current-run' };
      const horoscopeB = { birthDetails: birthB } as Horoscope;
      const pipelineB: LifeAnalysisProductState = { status: 'READY' };
      const mockService = {
        analyzeRun: vi.fn().mockReturnValueOnce(p1).mockReturnValueOnce(p2)
      } as unknown as ProductAnalysisService;
      const controller = createAppController(setState, mockService);

      const staleCall = controller.analyze(birthA);
      const currentCall = controller.analyze(birthB);
      resolveReq2(makeRun(analysisB, birthB, horoscopeB, pipelineB));
      await currentCall;

      rejectReq1(new Error('stale setup failure'));
      await staleCall;

      expect(currentState.productAnalysis.status).toBe('READY');
      expect(currentState.productAnalysis.analysis?.analysisId).toBe('current-run');
      expect(currentState.horoscope).toBe(horoscopeB);
      expect(currentState.lifeAnalysisState).toBe(pipelineB);
    });

    it('guarantees IDLE to LOADING transition before resolving to READY', async () => {
      // Start in strict IDLE state
      let currentState: AppState = {
        ...INITIAL_APP_STATE,
        productAnalysis: { status: 'IDLE' }
      };

      const statesObserved: string[] = [currentState.productAnalysis.status];

      const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
        (update: SetStateAction<AppState>) => {
          currentState =
            typeof update === 'function'
              ? (update as (prev: AppState) => AppState)(currentState)
              : update;
          statesObserved.push(currentState.productAnalysis.status);
        }
      );

      let resolveAnalysis: (val: ProductAnalysisRun) => void = () => { };
      const pendingPromise = new Promise<ProductAnalysisRun>((resolve) => {
        resolveAnalysis = resolve;
      });

      const mockService = {
        analyzeRun: vi.fn().mockReturnValue(pendingPromise)
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      const analyzePromise = controller.analyze(INITIAL_APP_STATE.birthDetails);

      // Must be LOADING between trigger and resolution, not stale IDLE or premature READY
      expect(statesObserved).toContain('LOADING');
      expect(currentState.productAnalysis.status).toBe('LOADING');

      resolveAnalysis(makeRun());
      await analyzePromise;

      expect(statesObserved).toEqual(['IDLE', 'LOADING', 'READY']);
      expect(currentState.productAnalysis.status).toBe('READY');
    });

    describe('selectPeriod', () => {
      it('reports a missing active analysis run before selecting a period', async () => {
        let currentState: AppState = { ...INITIAL_APP_STATE };
        const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
          (update: SetStateAction<AppState>) => {
            currentState =
              typeof update === 'function'
                ? (update as (prev: AppState) => AppState)(currentState)
                : update;
          }
        );
        const mockService = {
          selectPeriodForRun: vi.fn()
        } as unknown as ProductAnalysisService;
        const controller = createAppController(setState, mockService);

        await controller.selectPeriod('md_jupiter', 'ad_saturn');

        expect(currentState.selectionState).toEqual({
          status: 'ERROR',
          error: 'No active analysis run. Analyze birth details before selecting a period.'
        });
        expect(mockService.selectPeriodForRun).not.toHaveBeenCalled();
      });

      it('race condition: newer request wins when responses arrive out of order', async () => {
        let currentState: AppState = { ...INITIAL_APP_STATE };
        const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
          (update: SetStateAction<AppState>) => {
            currentState =
              typeof update === 'function'
                ? (update as (prev: AppState) => AppState)(currentState)
                : update;
          }
        );

        let resolveReq1: (val: ProductAnalysis) => void = () => { };
        let resolveReq2: (val: ProductAnalysis) => void = () => { };

        const p1 = new Promise<ProductAnalysis>((resolve) => {
          resolveReq1 = resolve;
        });
        const p2 = new Promise<ProductAnalysis>((resolve) => {
          resolveReq2 = resolve;
        });

        const analysis1: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-1' };
        const analysis2: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-2' };

        const mockService = {
          analyzeRun: vi.fn().mockResolvedValue(makeRun()),
          selectPeriodForRun: vi
            .fn()
            .mockReturnValueOnce(p1)
            .mockReturnValueOnce(p2)
        } as unknown as ProductAnalysisService;

        const controller = createAppController(setState, mockService);
        await controller.analyze(INITIAL_APP_STATE.birthDetails);

        // Start request A (Jupiter–Saturn) pending
        const call1 = controller.selectPeriod('md_jupiter', 'ad_saturn');

        // Start request B (Mars–Venus)
        const call2 = controller.selectPeriod('md_mars', 'ad_venus');

        // Resolve request B first (newer request)
        resolveReq2(analysis2);
        await call2;

        // State should reflect request B and be READY
        expect(currentState.selectionState.status).toBe('READY');
        expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');

        // Now resolve request A late - stale result guard should discard it
        resolveReq1(analysis1);
        await call1;

        // State MUST retain analysis from request B, NOT overwritten by stale request A
        expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');
        expect(currentState.selectionState.status).toBe('READY');
      });

      it('race condition: same MD/AD IDs, newer response wins', async () => {
        let currentState: AppState = { ...INITIAL_APP_STATE };
        const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
          (update: SetStateAction<AppState>) => {
            currentState =
              typeof update === 'function'
                ? (update as (prev: AppState) => AppState)(currentState)
                : update;
          }
        );

        let resolveReq1: (val: ProductAnalysis) => void = () => { };
        let resolveReq2: (val: ProductAnalysis) => void = () => { };

        const p1 = new Promise<ProductAnalysis>((resolve) => {
          resolveReq1 = resolve;
        });
        const p2 = new Promise<ProductAnalysis>((resolve) => {
          resolveReq2 = resolve;
        });

        const analysis1: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-1' };
        const analysis2: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-2' };

        const mockService = {
          analyzeRun: vi.fn().mockResolvedValue(makeRun()),
          selectPeriodForRun: vi
            .fn()
            .mockReturnValueOnce(p1)
            .mockReturnValueOnce(p2)
        } as unknown as ProductAnalysisService;

        const controller = createAppController(setState, mockService);
        await controller.analyze(INITIAL_APP_STATE.birthDetails);

        // Start two requests with the SAME MD/AD IDs
        const call1 = controller.selectPeriod('md_jupiter', 'ad_saturn');
        const call2 = controller.selectPeriod('md_jupiter', 'ad_saturn');

        // Resolve request 2 first (newer)
        resolveReq2(analysis2);
        await call2;

        expect(currentState.selectionState.status).toBe('READY');
        expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');

        // Resolve request 1 late - should be discarded
        resolveReq1(analysis1);
        await call1;

        // State MUST retain analysis from request 2
        expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');
        expect(currentState.selectionState.status).toBe('READY');
      });
    });
  });
});
