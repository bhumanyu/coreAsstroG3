import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WealthPage } from '../WealthPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('WealthPage (P-UI-05)', () => {
  it('1. Loading state: renders WealthLoadingState when status is LOADING', () => {
    render(
      <WealthPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Wealth & Financial Assets')).toBeInTheDocument();
  });

  it('2. Idle state with no analysis: renders WealthLoadingState', () => {
    render(
      <WealthPage
        productAnalysisState={{
          status: 'IDLE'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Wealth & Financial Assets')).toBeInTheDocument();
  });

  it('3. Unavailable state: renders WealthUnavailableState when analysis is absent', () => {
    render(
      <WealthPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Wealth Analysis Unavailable')).toBeInTheDocument();
  });

  it('4. Error state: renders WealthErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <WealthPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Financial calculation engine failed'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Wealth Analysis Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Financial calculation engine failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('5. Rendered sections: renders all sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <WealthPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Hero
    expect(screen.getByText('Wealth & Financial Prosperity')).toBeInTheDocument();
    expect(screen.getAllByText('Capricorn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Leo')).toBeInTheDocument();

    // Natal Wealth Foundation & Overall Status
    expect(screen.getByText('Natal Wealth Foundation & Overall Status')).toBeInTheDocument();
    expect(screen.getByText('Stable Accumulation')).toBeInTheDocument();
    expect(
      screen.getByText('Solid 2nd house foundation supporting liquid wealth.')
    ).toBeInTheDocument();

    // Core Financial Dimensions (4 houses)
    expect(screen.getByText('Core Financial Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Accumulation')).toBeInTheDocument();
    expect(screen.getByText('2nd House (Liquid Capital & Assets)')).toBeInTheDocument();
    expect(screen.getByText('Gains & Inflow')).toBeInTheDocument();
    expect(screen.getByText('11th House (Income & Profit Streams)')).toBeInTheDocument();
    expect(screen.getByText('Fortune & Luck')).toBeInTheDocument();
    expect(screen.getByText('9th House (Lakshmi Sthana & Prosperity)')).toBeInTheDocument();
    expect(screen.getByText('Speculation & Venture')).toBeInTheDocument();
    expect(screen.getByText('5th House (Risk Capital & Investments)')).toBeInTheDocument();

    // Hora (D2) Divisional Alignment
    expect(screen.getByText('Hora (D2) Divisional Alignment')).toBeInTheDocument();
    expect(screen.getByText('Confirms')).toBeInTheDocument();
    expect(
      screen.getByText('Hora D2 confirms liquid capital accumulation.')
    ).toBeInTheDocument();

    // Wealth Timing & Vimshottari Dasha Hierarchy
    expect(
      screen.getByText('Wealth Timing & Vimshottari Dasha Hierarchy')
    ).toBeInTheDocument();

    // Planetary Transits (Gochara)
    expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
    expect(screen.getByText('No Material Trigger')).toBeInTheDocument();
    expect(screen.getByText('Transits neutral for wealth.')).toBeInTheDocument();

    // Speculative Risk Profile (visually separated)
    expect(
      screen.getByText('Speculative Risk & Market Exposure Profile')
    ).toBeInTheDocument();
    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
    expect(
      screen.getByText('Disciplined investments recommended.')
    ).toBeInTheDocument();

    // Qualifications & Modifiers
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('EXPENDITURE_PRESSURE')).toBeInTheDocument();

    // Evidential Reasoning Provenance
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
    expect(screen.getByText('2nd Lord Exalted')).toBeInTheDocument();

    // Integrated Conclusion
    expect(screen.getByText('Integrated Wealth Synthesis')).toBeInTheDocument();
    expect(screen.getByText('Favorable Wealth Outlook')).toBeInTheDocument();
  });

  it('6. Navigation to reasoning: invokes onNavigate with "reasoning" from evidence and conclusion buttons', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(
      <WealthPage
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

    const traceBtn = screen.getByRole('button', { name: /trace full evidential reasoning/i });
    fireEvent.click(traceBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');
  });
});
