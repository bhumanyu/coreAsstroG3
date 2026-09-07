import { describe, it, expect, vi } from 'vitest';
import { createAppController } from '../AppController';
import { INITIAL_APP_STATE, INITIAL_PRODUCT_ANALYSIS_STATE, AppState } from '../AppState';
import type { Dispatch, SetStateAction } from 'react';
import type { ProductAnalysis } from '../../product/analysis/productAnalysisTypes';
import type { ProductAnalysisService } from '../../product/analysis';

const mockProductAnalysis: ProductAnalysis = {
  analysisId: 'mock-1',
  asOf: '2026-01-01',
  status: 'READY',
  chart: {
    ascendantSign: 'ARIES',
    ascendantDegree: 10,
    moonSign: 'TAURUS',
    sunSign: 'PISCES',
    moonNakshatra: 'Rohini'
  },
  birth: {
    name: 'Test',
    dateOfBirth: '2000-01-01',
    timeOfBirth: '12:00',
    placeOfBirth: 'New York',
    latitude: 40.7,
    longitude: -74.0,
    timezone: -5
  },
  career: {
    promise: { strength: 'STRONG', confidence: 'HIGH' },
    manifestations: [],
    d10: { relationship: 'CONFIRMS' },
    timing: { dashaPeriods: [] },
    qualifications: [],
    takeaways: [],
    evidence: []
  },
  wealth: {
    overall: { strength: 'STRONG', confidence: 'HIGH' },
    dimensions: {
      accumulation: { status: 'STRONG' },
      gains: { status: 'STRONG' },
      fortune: { status: 'STRONG' },
      speculation: { status: 'MODERATE' }
    },
    d2: { relationship: 'CONFIRMS' },
    speculativeRisk: { score: 0, level: 'LOW' },
    timing: { dashaPeriods: [] },
    qualifications: [],
    evidence: []
  },
  dasha: {
    current: {},
    allPeriods: []
  },
  reasoning: {
    rulesAppliedCount: 10,
    totalEvidenceCount: 5,
    conflictCount: 0,
    integrityStatus: 'VALID',
    provenanceIntegrity: true,
    engineMode: 'DETERMINISTIC_LOCAL'
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
      lifeAnalysisState: { status: 'LOADING' }
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

      let resolveAnalysis: (val: ProductAnalysis) => void = () => {};
      const pendingPromise = new Promise<ProductAnalysis>((resolve) => {
        resolveAnalysis = resolve;
      });

      const mockService = {
        analyze: vi.fn().mockReturnValue(pendingPromise),
        lastPipelineState: { status: 'READY' }
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      const analyzePromise = controller.analyze(INITIAL_APP_STATE.birthDetails);

      // Immediately upon calling analyze, state should transition to LOADING
      expect(currentState.productAnalysis.status).toBe('LOADING');
      expect(currentState.lifeAnalysisState.status).toBe('LOADING');

      // Resolve analysis
      resolveAnalysis(mockProductAnalysis);
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
        analyze: vi.fn().mockResolvedValue(mockProductAnalysis),
        lastPipelineState: { status: 'READY' }
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      await controller.analyze(INITIAL_APP_STATE.birthDetails);

      expect(currentState.productAnalysis.status).toBe('READY');
      expect(currentState.productAnalysis.analysis).toEqual(mockProductAnalysis);
      expect(currentState.lifeAnalysisState.status).toBe('READY');
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
        analyze: vi.fn().mockResolvedValue(mockErrorAnalysis),
        lastPipelineState: { status: 'ERROR', errorMessage: 'Failed to calculate chart coordinates' }
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      await controller.analyze(INITIAL_APP_STATE.birthDetails);

      expect(currentState.productAnalysis.status).toBe('ERROR');
      expect(currentState.productAnalysis.error).toBe('Failed to calculate chart coordinates');
      expect(currentState.lifeAnalysisState.status).toBe('ERROR');
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

      let resolveReq1: (val: ProductAnalysis) => void = () => {};
      let resolveReq2: (val: ProductAnalysis) => void = () => {};

      const p1 = new Promise<ProductAnalysis>((resolve) => {
        resolveReq1 = resolve;
      });
      const p2 = new Promise<ProductAnalysis>((resolve) => {
        resolveReq2 = resolve;
      });

      const analysis1: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-1' };
      const analysis2: ProductAnalysis = { ...mockProductAnalysis, analysisId: 'req-2' };

      const mockService = {
        analyze: vi
          .fn()
          .mockReturnValueOnce(p1)
          .mockReturnValueOnce(p2),
        lastPipelineState: { status: 'READY' }
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);

      // Trigger request 1 then request 2
      const call1 = controller.analyze({ ...INITIAL_APP_STATE.birthDetails, name: 'First' });
      const call2 = controller.analyze({ ...INITIAL_APP_STATE.birthDetails, name: 'Second' });

      // Resolve request 2 first
      resolveReq2(analysis2);
      await call2;

      expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');

      // Now resolve request 1 late - stale result guard should discard it
      resolveReq1(analysis1);
      await call1;

      // State MUST retain analysis from request 2, NOT overwritten by stale request 1
      expect(currentState.productAnalysis.analysis?.analysisId).toBe('req-2');
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

      let resolveAnalysis: (val: ProductAnalysis) => void = () => {};
      const pendingPromise = new Promise<ProductAnalysis>((resolve) => {
        resolveAnalysis = resolve;
      });

      const mockService = {
        analyze: vi.fn().mockReturnValue(pendingPromise),
        lastPipelineState: { status: 'READY' }
      } as unknown as ProductAnalysisService;

      const controller = createAppController(setState, mockService);
      const analyzePromise = controller.analyze(INITIAL_APP_STATE.birthDetails);

      // Must be LOADING between trigger and resolution, not stale IDLE or premature READY
      expect(statesObserved).toContain('LOADING');
      expect(currentState.productAnalysis.status).toBe('LOADING');

      resolveAnalysis(mockProductAnalysis);
      await analyzePromise;

      expect(statesObserved).toEqual(['IDLE', 'LOADING', 'READY']);
      expect(currentState.productAnalysis.status).toBe('READY');
    });
  });
});
