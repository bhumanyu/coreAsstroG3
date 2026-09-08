import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashaPage } from '../DashaPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('DashaPage (P-UI-07)', () => {
  it('1. Loading state: renders DashaLoadingState when status is LOADING', () => {
    render(
      <DashaPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Planetary Timing & Dasha Periods')).toBeInTheDocument();
  });

  it('2. Unavailable state: renders DashaUnavailableState when analysis is absent', () => {
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Dasha & Timing Analysis Unavailable')).toBeInTheDocument();
  });

  it('3. Error state: renders DashaErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Dasha computation failed'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Dasha & Timing Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Dasha computation failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Rendered sections: renders all major sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Hero
    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();

    // Major headings asserted in spec §24 & prompt requirements:
    expect(screen.getByText('Current Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Career Activation')).toBeInTheDocument();
    expect(screen.getByText('Wealth Activation')).toBeInTheDocument();
    expect(screen.getByText('Transit Timing')).toBeInTheDocument();

    // Additional expected sections
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();

    // Assert period contents
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
  });

  it('5. Navigation handling: triggers onNavigate with reasoning when explore reasoning is clicked', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onNavigate={onNavigate}
      />
    );

    const exploreBtn = screen.getByRole('button', { name: /explore reasoning graph/i });
    fireEvent.click(exploreBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');
  });
});
