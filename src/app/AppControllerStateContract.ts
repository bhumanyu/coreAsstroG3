import type { AppState, DashaTimingProjectionStatus, ProductAnalysisState, SelectionState } from './AppState';

export type AppControllerOperation = 'ANALYSIS' | 'PERIOD_SELECTION' | 'DASHA_PROJECTION';
export type AppControllerStatus = ProductAnalysisState['status'] | SelectionState['status'] | DashaTimingProjectionStatus;

const TRANSITIONS: Readonly<Record<AppControllerOperation, Readonly<Record<string, readonly string[]>>>> = {
  ANALYSIS: {
    IDLE: ['LOADING'],
    LOADING: ['READY', 'ERROR', 'LOADING'],
    READY: ['LOADING'],
    ERROR: ['LOADING']
  },
  PERIOD_SELECTION: {
    IDLE: ['SUBMITTING', 'ERROR'],
    SUBMITTING: ['SUBMITTING', 'READY', 'ERROR', 'IDLE'],
    READY: ['SUBMITTING', 'IDLE'],
    ERROR: ['SUBMITTING', 'IDLE']
  },
  DASHA_PROJECTION: {
    IDLE: ['READY', 'ERROR', 'IDLE'],
    READY: ['IDLE', 'RETRYING'],
    ERROR: ['IDLE', 'RETRYING'],
    RETRYING: ['READY', 'ERROR', 'IDLE']
  }
};

export interface AppControllerTransition {
  readonly operation: AppControllerOperation;
  readonly from: AppControllerStatus;
  readonly to: AppControllerStatus;
  readonly requestId?: number;
  readonly analysisId?: string;
  readonly mahadashaId?: string;
  readonly antardashaId?: string;
}

export function assertAppControllerTransition(
  operation: AppControllerOperation,
  from: AppControllerStatus,
  to: AppControllerStatus
): void {
  if (!TRANSITIONS[operation][from]?.includes(to)) {
    throw new Error(`Invalid ${operation} transition: ${from} -> ${to}`);
  }
}

export function assertAppControllerState(state: AppState): void {
  const analysis = state.productAnalysis;
  if (analysis.status === 'READY') {
    if (!analysis.analysis || !analysis.analysisId || !analysis.sourceAnalysisId || analysis.analysis.analysisId !== analysis.analysisId) {
      throw new Error('READY analysis state must contain its matching canonical analysis identity.');
    }
  }
  if (analysis.status === 'ERROR' && !analysis.error) {
    throw new Error('ERROR analysis state must contain an operation error.');
  }

  const selection = state.selectionState;
  if (selection.status === 'SUBMITTING' || selection.status === 'READY') {
    if (!selection.analysisId || !selection.mahadashaId || !selection.antardashaId || selection.requestId === undefined) {
      throw new Error(`${selection.status} period selection must contain request, analysis and MD–AD identities.`);
    }
    if (analysis.status !== 'READY' || analysis.sourceAnalysisId !== selection.analysisId) {
      throw new Error('Period selection must belong to the active canonical analysis.');
    }
  }
  if (selection.status === 'ERROR' && !selection.error) {
    throw new Error('ERROR period selection state must contain an operation error.');
  }

  const projection = state.dashaTimingProjectionState;
  if (projection.status !== 'IDLE') {
    if (!projection.analysisId || analysis.status !== 'READY' || analysis.sourceAnalysisId !== projection.analysisId) {
      throw new Error('Dasha timing projection state must belong to the active canonical analysis.');
    }
  }
  if (projection.status === 'READY' && !state.dashaTimingViewModel) {
    throw new Error('READY Dasha timing projection state must contain its view model.');
  }
  if (projection.status === 'ERROR' && !projection.error) {
    throw new Error('ERROR Dasha timing projection state must contain an operation error.');
  }
}

export function getAllowedAppControllerTransitions(
  operation: AppControllerOperation
): Readonly<Record<string, readonly string[]>> {
  return TRANSITIONS[operation];
}
