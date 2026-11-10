import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';
import { INITIAL_APP_STATE } from './AppState';
import { assertAppControllerState, assertAppControllerTransition } from './AppControllerStateContract';

describe('AppControllerStateContract', () => {
  it('accepts only documented analysis transitions', () => {
    expect(() => assertAppControllerTransition('ANALYSIS', 'IDLE', 'LOADING')).not.toThrow();
    expect(() => assertAppControllerTransition('ANALYSIS', 'LOADING', 'READY')).not.toThrow();
    expect(() => assertAppControllerTransition('ANALYSIS', 'LOADING', 'IDLE')).toThrow(/Invalid ANALYSIS transition/);
  });

  it('rejects READY analysis without a matching canonical identity', () => {
    expect(() => assertAppControllerState({
      ...INITIAL_APP_STATE,
      productAnalysis: { status: 'READY' }
    })).toThrow(/matching canonical analysis identity/);
  });

  it('rejects a selected MD–AD result associated with an earlier chart', () => {
    const active = createProductAnalysis({ analysisId: 'active-chart' });
    expect(() => assertAppControllerState({
      ...INITIAL_APP_STATE,
      productAnalysis: { status: 'READY', analysis: active, analysisId: 'active-chart', sourceAnalysisId: 'active-chart', requestId: 2 },
      selectionState: {
        status: 'READY',
        requestId: 8,
        analysisId: 'old-chart',
        mahadashaId: 'md_jupiter',
        antardashaId: 'ad_saturn'
      }
    })).toThrow(/must belong to the active canonical analysis/);
  });

  it('rejects READY period selection without both period IDs and its request identity', () => {
    const active = createProductAnalysis({ analysisId: 'active-chart' });
    expect(() => assertAppControllerState({
      ...INITIAL_APP_STATE,
      productAnalysis: { status: 'READY', analysis: active, analysisId: 'active-chart', sourceAnalysisId: 'active-chart', requestId: 2 },
      selectionState: { status: 'READY', analysisId: 'active-chart', mahadashaId: 'md_jupiter' }
    })).toThrow(/MD–AD identities/);
  });
});
