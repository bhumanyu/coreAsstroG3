import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DashaPage, getDashaSelectionContextIdentity } from './DashaPage';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';

describe('DashaPage projection diagnostics', () => {
  it('shows a user-visible warning when the optional timing projection fails', () => {
    render(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }}
        dashaTimingProjectionError="Dasha projection failed"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Dasha timing detail could not be prepared');
    expect(screen.getByRole('alert')).toHaveTextContent('Dasha projection failed');
    expect(screen.getByRole('alert')).toHaveTextContent('canonical chart analysis remains available');
  });

  it('offers projection-only retry and disables it while retrying', () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const analysis = createProductAnalysis();
    const { rerender } = render(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis }}
        dashaTimingProjectionError="temporary failure"
        dashaTimingProjectionState={{ status: 'ERROR', analysisId: analysis.analysisId, error: 'temporary failure' }}
        onRetryDashaTiming={retry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry Dasha timing' }));
    expect(retry).toHaveBeenCalledOnce();

    rerender(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis }}
        dashaTimingProjectionError="temporary failure"
        dashaTimingProjectionState={{ status: 'RETRYING', analysisId: analysis.analysisId }}
        onRetryDashaTiming={retry}
      />
    );
    expect(screen.getByRole('button', { name: 'Retrying Dasha timing…' })).toBeDisabled();
  });
});


describe('Dasha selected-period analysis identity', () => {
  it('uses the stable source chart identity when selected-period output has a distinct ProductAnalysis ID', () => {
    const selectedPeriodAnalysis = createProductAnalysis({ analysisId: 'selected-period-projection-id' });
    expect(getDashaSelectionContextIdentity({
      status: 'READY',
      analysis: selectedPeriodAnalysis,
      analysisId: 'selected-period-projection-id',
      sourceAnalysisId: 'base-chart-run-id'
    }, selectedPeriodAnalysis)).toBe('base-chart-run-id');
  });

  it('falls back to the current canonical analysis identity when no source identity is attached', () => {
    const analysis = createProductAnalysis({ analysisId: 'base-chart-run-id' });
    expect(getDashaSelectionContextIdentity({ status: 'READY', analysis }, analysis)).toBe('base-chart-run-id');
  });
});
