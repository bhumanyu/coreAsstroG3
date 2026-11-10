import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProductAnalysisReportBoundary } from './ProductAnalysisReportBoundary';

describe('ProductAnalysisReportBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retries report rendering without invoking chart analysis retry', () => {
    let shouldThrow = true;
    const Report = () => {
      if (shouldThrow) throw new Error('temporary renderer failure');
      return <p>Canonical report recovered</p>;
    };
    const onRetryAnalysis = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <>
        <p>Canonical analysis remains available</p>
        <ProductAnalysisReportBoundary resetKey="analysis-a">
          <Report />
        </ProductAnalysisReportBoundary>
      </>
    );

    expect(screen.getByText('Canonical analysis remains available')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('temporary renderer failure');
    expect(screen.getByRole('alert')).toHaveTextContent('Retrying the report does not rerun astrology calculations');

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry report' }));

    expect(screen.getByText('Canonical report recovered')).toBeInTheDocument();
    expect(onRetryAnalysis).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('clears an earlier report error synchronously when the canonical analysis identity changes', () => {
    let shouldThrow = true;
    const Report = () => {
      if (shouldThrow) throw new Error('old chart renderer failure');
      return <p>New chart report</p>;
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = render(
      <ProductAnalysisReportBoundary resetKey="analysis-old">
        <Report />
      </ProductAnalysisReportBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('old chart renderer failure');

    shouldThrow = false;
    rerender(
      <ProductAnalysisReportBoundary resetKey="analysis-new">
        <Report />
      </ProductAnalysisReportBoundary>
    );

    expect(screen.getByText('New chart report')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
