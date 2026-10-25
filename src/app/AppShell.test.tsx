import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { AppShellContent } from './AppShell';
import { createAppController, type AppController } from './AppController';
import { INITIAL_APP_STATE, type AppState } from './AppState';
import { ProductAnalysisService, type ProductAnalysisRun } from '../product/analysis';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';

vi.mock('../components/Header', () => ({ Header: () => null }));
vi.mock('./AppFooter', () => ({ AppFooter: () => null }));
vi.mock('./ProductPageRouter', () => ({
  ProductPageRouter: ({ state, onRetry }: { state: AppState; onRetry: () => void }) => (
    <div>
      <div data-testid="analysis-status">{state.productAnalysis.status}</div>
      {state.productAnalysis.status === 'ERROR' && (
        <div role="alert">{state.productAnalysis.error}</div>
      )}
      {state.productAnalysis.status === 'LOADING' && <div role="status">Loading analysis</div>}
      <button type="button" onClick={onRetry}>Retry analysis</button>
    </div>
  )
}));

function createController(analyze: AppController['analyze']): AppController {
  return {
    analyze,
    navigate: vi.fn(),
    openBirthForm: vi.fn(),
    closeBirthForm: vi.fn(),
    resetPreset: vi.fn(),
    selectPeriod: vi.fn().mockResolvedValue(undefined)
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const successAnalysis = createProductAnalysis({ analysisId: 'retry-success' });
const successRun: ProductAnalysisRun = {
  analysis: successAnalysis,
  snapshot: {
    birthDetails: {
      ...INITIAL_APP_STATE.birthDetails,
      name: 'Retry Test'
    },
    context: {
      asOf: successAnalysis.asOf,
      methodology: successAnalysis.methodology,
      engineVersion: successAnalysis.engineVersion,
      rulesVersion: successAnalysis.rulesVersion
    }
  }
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShellContent analysis safety wrapper', () => {
  it('handles an unexpected initial rejection without an unhandled rejection or duplicate error', async () => {
    const controller = createController(vi.fn().mockRejectedValue(new Error('unexpected failure')));
    const controllerFactory = () => controller;
    render(<AppShellContent controllerFactory={controllerFactory} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected failure');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByTestId('analysis-status')).toHaveTextContent('ERROR');
  });

  it('keeps retry failures in loading until success, then shows READY', async () => {
    let completeRetry: (() => void) | undefined;
    let setStateRef: Dispatch<SetStateAction<AppState>> | undefined;
    const analyze = vi.fn<AppController['analyze']>()
      .mockRejectedValueOnce(new Error('initial failure'))
      .mockImplementationOnce(() => {
        setStateRef?.((previous) => ({
          ...previous,
          productAnalysis: { status: 'LOADING' },
          lifeAnalysisState: { status: 'LOADING' }
        }));
        return new Promise<void>((resolve) => {
          completeRetry = () => {
            setStateRef?.((previous) => ({
              ...previous,
              productAnalysis: { status: 'READY' },
              lifeAnalysisState: { status: 'LOADING' }
            }));
            resolve();
          };
        });
      });
    const controller = createController(analyze);
    const controllerFactory = (setState: Dispatch<SetStateAction<AppState>>) => {
      setStateRef = setState;
      return controller;
    };

    render(<AppShellContent controllerFactory={controllerFactory} />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Retry analysis' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Loading analysis');

    await act(async () => {
      completeRetry?.();
    });
    await waitFor(() => expect(screen.getByTestId('analysis-status')).toHaveTextContent('READY'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('recovers from ERROR to READY through the real AppController on retry', async () => {
    const service = new ProductAnalysisService();
    const retryRun = deferred<ProductAnalysisRun>();
    const analyzeRun = vi.spyOn(service, 'analyzeRun')
      .mockRejectedValueOnce(new Error('initial analysis failure'))
      .mockReturnValueOnce(retryRun.promise);
    const controllerFactory = (setState: Dispatch<SetStateAction<AppState>>) =>
      createAppController(setState, service);

    render(<AppShellContent controllerFactory={controllerFactory} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('initial analysis failure');
    expect(screen.getByTestId('analysis-status')).toHaveTextContent('ERROR');

    fireEvent.click(screen.getByRole('button', { name: 'Retry analysis' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading analysis');
    expect(analyzeRun).toHaveBeenCalledTimes(2);

    await act(async () => {
      retryRun.resolve(successRun);
      await retryRun.promise;
    });

    await waitFor(() => expect(screen.getByTestId('analysis-status')).toHaveTextContent('READY'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not add a second error notification for a controller-handled failure', async () => {
    let setStateRef: Dispatch<SetStateAction<AppState>> | undefined;
    const analyze = vi.fn<AppController['analyze']>().mockImplementation(async () => {
      setStateRef?.((previous) => ({
        ...previous,
        productAnalysis: { status: 'ERROR', error: 'handled failure' },
        lifeAnalysisState: { status: 'ERROR', errorMessage: 'handled failure' }
      }));
    });
    const controller = createController(analyze);
    const controllerFactory = (setState: Dispatch<SetStateAction<AppState>>) => {
      setStateRef = setState;
      return controller;
    };

    render(<AppShellContent controllerFactory={controllerFactory} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('handled failure');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
