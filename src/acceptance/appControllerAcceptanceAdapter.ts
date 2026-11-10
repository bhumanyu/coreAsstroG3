import type { Dispatch, SetStateAction } from 'react';
import type { ProductAnalysisService, DashaTimingViewModel } from '../product/analysis';
import { createAppController, type AppController, type DashaTimingProjectionBuilder } from '../app/AppController';
import { INITIAL_APP_STATE, type AppState } from '../app/AppState';
import {
  assertAppControllerState,
  assertAppControllerTransition,
  type AppControllerTransition
} from '../app/AppControllerStateContract';

export interface AppControllerAcceptanceAdapter {
  readonly controller: AppController;
  getState(): AppState;
  getTransitions(): readonly AppControllerTransition[];
}

export function createAppControllerAcceptanceAdapter(
  service: ProductAnalysisService,
  initialState: AppState = INITIAL_APP_STATE,
  projectionBuilder?: DashaTimingProjectionBuilder
): AppControllerAcceptanceAdapter {
  let state = initialState;
  const transitions: AppControllerTransition[] = [];

  const setState: Dispatch<SetStateAction<AppState>> = update => {
    const previous = state;
    const next = typeof update === 'function' ? (update as (value: AppState) => AppState)(previous) : update;

    if (previous.productAnalysis.status !== next.productAnalysis.status) {
      assertAppControllerTransition('ANALYSIS', previous.productAnalysis.status, next.productAnalysis.status);
      transitions.push(Object.freeze({
        operation: 'ANALYSIS',
        from: previous.productAnalysis.status,
        to: next.productAnalysis.status,
        requestId: next.productAnalysis.requestId,
        analysisId: next.productAnalysis.analysisId
      }));
    }

    if (previous.selectionState.status !== next.selectionState.status
      || previous.selectionState.requestId !== next.selectionState.requestId) {
      assertAppControllerTransition('PERIOD_SELECTION', previous.selectionState.status, next.selectionState.status);
      transitions.push(Object.freeze({
        operation: 'PERIOD_SELECTION',
        from: previous.selectionState.status,
        to: next.selectionState.status,
        requestId: next.selectionState.requestId,
        analysisId: next.selectionState.analysisId,
        mahadashaId: next.selectionState.mahadashaId,
        antardashaId: next.selectionState.antardashaId
      }));
    }

    if (previous.dashaTimingProjectionState.status !== next.dashaTimingProjectionState.status
      || previous.dashaTimingProjectionState.requestId !== next.dashaTimingProjectionState.requestId) {
      assertAppControllerTransition(
        'DASHA_PROJECTION',
        previous.dashaTimingProjectionState.status,
        next.dashaTimingProjectionState.status
      );
      transitions.push(Object.freeze({
        operation: 'DASHA_PROJECTION',
        from: previous.dashaTimingProjectionState.status,
        to: next.dashaTimingProjectionState.status,
        requestId: next.dashaTimingProjectionState.requestId,
        analysisId: next.dashaTimingProjectionState.analysisId
      }));
    }

    assertAppControllerState(next);
    state = next;
  };

  const controller = projectionBuilder
    ? createAppController(setState, service, projectionBuilder)
    : createAppController(setState, service);

  return {
    controller,
    getState: () => state,
    getTransitions: () => Object.freeze([...transitions])
  };
}
