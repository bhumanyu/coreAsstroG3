import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CareerPage } from '../CareerPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('CareerPage (P-UI-04)', () => {
  it('1. Loading state: renders CareerLoadingState when status is LOADING', () => {
    render(
      <CareerPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Vocational Trajectory')).toBeInTheDocument();
  });

  it('2. Unavailable state: renders CareerUnavailableState when analysis is absent', () => {
    render(
      <CareerPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Career Analysis Unavailable')).toBeInTheDocument();
  });

  it('3. Error state: renders CareerErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <CareerPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Calculation engine failed'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Career Analysis Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Calculation engine failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Rendered sections: renders all sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <CareerPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Hero
    expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();
    expect(screen.getAllByText('Capricorn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Leo')).toBeInTheDocument();

    // Natal Promise
    expect(screen.getByText('Natal Vocational Promise')).toBeInTheDocument();
    expect(screen.getByText('Executive Trajectory')).toBeInTheDocument();
    expect(
      screen.getByText('High vocational promise across 10th lord and Lagna.')
    ).toBeInTheDocument();

    // Expression & Style
    expect(screen.getByText('Vocational Expression & Working Style')).toBeInTheDocument();
    expect(screen.getByText('Strategic Leadership')).toBeInTheDocument();

    // D10 Varga Alignment
    expect(screen.getByText('Dasamsa (D10) Divisional Alignment')).toBeInTheDocument();
    expect(screen.getByText('Confirms')).toBeInTheDocument();

    // Timing & Dasha Hierarchy: individual planet names and role labels
    expect(screen.getByText('Career Timing & Vimshottari Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getAllByText('Primary Driver').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Refinement')).toBeInTheDocument();

    // Transits
    expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();

    // Qualifications
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('COMBUSTION')).toBeInTheDocument();

    // Evidence
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();

    // Integrated Conclusion
    expect(screen.getByText('Integrated Vocational Synthesis')).toBeInTheDocument();
  });

  it('5. Navigation to reasoning: invokes onNavigate with reasoning', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(
      <CareerPage
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
