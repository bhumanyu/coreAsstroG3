import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { DashaPage } from './DashaPage';
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

    const button = screen.getByRole('button', { name: 'Retry Dasha timing' });
    fireEvent.click(button);
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
});
