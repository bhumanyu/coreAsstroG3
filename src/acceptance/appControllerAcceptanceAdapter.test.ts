import { describe, expect, it, vi } from 'vitest';
import type { Horoscope } from '../../types';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import type { LifeAnalysisProductState } from '../../product/life-analysis/lifeAnalysisTypes';
import {
  createProductAnalysis,
  type ProductAnalysisRun,
  type ProductAnalysisRunSnapshot,
  type ProductAnalysisService
} from '../../product/analysis';
import type { DashaTimingViewModel } from '../../product/dasha-timing';
import { INITIAL_APP_STATE } from '../../app/AppState';
import { createAppControllerAcceptanceAdapter } from '../appControllerAcceptanceAdapter';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function makeRun(analysisId: string, pipelineState: LifeAnalysisProductState = { status: 'READY' }): ProductAnalysisRun {
  const analysis = createProductAnalysis({ analysisId });
  const snapshot: ProductAnalysisRunSnapshot = {
    birthDetails: INITIAL_APP_STATE.birthDetails,
    context: {
      asOf: analysis.asOf,
      methodology: analysis.methodology,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion
    } as AnalysisContext,
    horoscope: {} as Horoscope,
    pipelineState
  };
  return { analysis, snapshot };
}

describe('AppController production acceptance adapter', () => {
  it('executes the production controller and captures IDLE → LOADING → READY', async () => {
    const run = makeRun('analysis-success');
    const service = { analyzeRun: vi.fn().mockResolvedValue(run) } as unknown as ProductAnalysisService;
    const adapter = createAppControllerAcceptanceAdapter(service);

    await adapter.controller.analyze(INITIAL_APP_STATE.birthDetails);

    expect(adapter.getState().productAnalysis.analysisId).toBe('analysis-success');
    expect(adapter.getTransitions().filter(item => item.operation === 'ANALYSIS').map(item => [item.from, item.to]))
      .toEqual([['IDLE', 'LOADING'], ['LOADING', 'READY']]);
  });

  it('discards an earlier analysis result and stale error after a newer analysis succeeds', async () => {
    const first = deferred<ProductAnalysisRun>();
    const second = deferred<ProductAnalysisRun>();
    const service = {
      analyzeRun: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    } as unknown as ProductAnalysisService;
    const adapter = createAppControllerAcceptanceAdapter(service);

    const firstCall = adapter.controller.analyze({ ...INITIAL_APP_STATE.birthDetails, name: 'Chart A' });
    const secondCall = adapter.controller.analyze({ ...INITIAL_APP_STATE.birthDetails, name: 'Chart B' });
    second.resolve(makeRun('chart-b'));
    await secondCall;
    first.reject(new Error('stale chart A failed'));
    await firstCall;

    expect(adapter.getState().productAnalysis.status).toBe('READY');
    expect(adapter.getState().productAnalysis.analysisId).toBe('chart-b');
    expect(adapter.getState().productAnalysis.error).toBeUndefined();
  });

  it('retries only the failed Dasha projection and preserves canonical analysis', async () => {
    const temporalState = {} as LifeAnalysisProductState['temporalState'];
    const pipelineState = { status: 'READY', temporalState } as LifeAnalysisProductState;
    const run = makeRun('retryable-analysis', pipelineState);
    const projection = {} as DashaTimingViewModel;
    const projectionBuilder = vi.fn()
      .mockImplementationOnce(() => { throw new Error('temporary projection failure'); })
      .mockReturnValueOnce(projection);
    const service = { analyzeRun: vi.fn().mockResolvedValue(run) } as unknown as ProductAnalysisService;
    const adapter = createAppControllerAcceptanceAdapter(service, INITIAL_APP_STATE, projectionBuilder);

    await adapter.controller.analyze(INITIAL_APP_STATE.birthDetails);
    expect(adapter.getState().productAnalysis.status).toBe('READY');
    expect(adapter.getState().dashaTimingProjectionState.status).toBe('ERROR');
    expect(adapter.getState().dashaTimingProjectionError).toBe('temporary projection failure');

    await adapter.controller.retryDashaTiming?.();

    expect(service.analyzeRun).toHaveBeenCalledTimes(1);
    expect(projectionBuilder).toHaveBeenCalledTimes(2);
    expect(adapter.getState().productAnalysis.analysisId).toBe('retryable-analysis');
    expect(adapter.getState().productAnalysis.status).toBe('READY');
    expect(adapter.getState().dashaTimingProjectionState.status).toBe('READY');
    expect(adapter.getState().dashaTimingProjectionError).toBeUndefined();
    expect(adapter.getTransitions().filter(item => item.operation === 'DASHA_PROJECTION').map(item => [item.from, item.to]))
      .toEqual([['IDLE', 'IDLE'], ['IDLE', 'ERROR'], ['ERROR', 'RETRYING'], ['RETRYING', 'READY']]);
  });

  it('keeps the newest MD–AD selection when earlier selection resolves last', async () => {
    const selectionA = deferred<ReturnType<typeof createProductAnalysis>>();
    const selectionB = deferred<ReturnType<typeof createProductAnalysis>>();
    const run = makeRun('period-analysis');
    const service = {
      analyzeRun: vi.fn().mockResolvedValue(run),
      selectPeriodForRun: vi.fn().mockReturnValueOnce(selectionA.promise).mockReturnValueOnce(selectionB.promise)
    } as unknown as ProductAnalysisService;
    const adapter = createAppControllerAcceptanceAdapter(service);
    await adapter.controller.analyze(INITIAL_APP_STATE.birthDetails);

    const callA = adapter.controller.selectPeriod('md_jupiter', 'ad_saturn');
    const callB = adapter.controller.selectPeriod('md_jupiter', 'ad_mercury');
    selectionB.resolve(createProductAnalysis({ analysisId: 'period-analysis' }));
    await callB;
    selectionA.resolve(createProductAnalysis({ analysisId: 'period-analysis' }));
    await callA;

    expect(adapter.getState().selectionState).toMatchObject({
      status: 'READY',
      analysisId: 'period-analysis',
      mahadashaId: 'md_jupiter',
      antardashaId: 'ad_mercury'
    });
  });

  it('invalidates pending period selection when a new chart analysis starts', async () => {
    const pendingSelection = deferred<ReturnType<typeof createProductAnalysis>>();
    const firstRun = makeRun('chart-before');
    const secondRun = makeRun('chart-after');
    const service = {
      analyzeRun: vi.fn().mockResolvedValueOnce(firstRun).mockResolvedValueOnce(secondRun),
      selectPeriodForRun: vi.fn().mockReturnValue(pendingSelection.promise)
    } as unknown as ProductAnalysisService;
    const adapter = createAppControllerAcceptanceAdapter(service);
    await adapter.controller.analyze(INITIAL_APP_STATE.birthDetails);
    const selectionCall = adapter.controller.selectPeriod('md_jupiter', 'ad_saturn');

    await adapter.controller.analyze({ ...INITIAL_APP_STATE.birthDetails, name: 'New chart' });
    pendingSelection.resolve(createProductAnalysis({ analysisId: 'chart-before' }));
    await selectionCall;

    expect(adapter.getState().productAnalysis.analysisId).toBe('chart-after');
    expect(adapter.getState().selectionState.status).toBe('IDLE');
  });
});
