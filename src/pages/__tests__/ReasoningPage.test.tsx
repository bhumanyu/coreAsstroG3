import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReasoningPage } from '../ReasoningPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('ReasoningPage (P-UI-06)', () => {
  it('1. Loading state: renders ReasoningLoadingState when status is LOADING', () => {
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Compiling Astrological Reasoning Graph')).toBeInTheDocument();
  });

  it('2. Unavailable state: renders ReasoningUnavailableState when analysis is absent', () => {
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Astrological Reasoning Unavailable')).toBeInTheDocument();
  });

  it('3. Error state: renders ReasoningErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Reasoning computation engine failure'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Reasoning Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Reasoning computation engine failure')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Rendered sections: renders all sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Hero
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getAllByText('High Confidence').length).toBeGreaterThanOrEqual(1);

    // Chain
    expect(screen.getByText('Deterministic Evidence Framework')).toBeInTheDocument();

    // Evidence Groups
    expect(screen.getByText('Evidentiary Reasoning Groups')).toBeInTheDocument();

    // Varga
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();

    // Dasha
    expect(screen.getByText('Chronological Vimshottari Dasha Activation')).toBeInTheDocument();

    // Transit
    expect(screen.getByText('Gochara (Transit) Triggers')).toBeInTheDocument();

    // Qualifications
    expect(screen.getByText('Reasoning Qualifications & Caveats')).toBeInTheDocument();

    // Conclusion
    expect(screen.getByText('Synthesized Astrological Verdict')).toBeInTheDocument();
  });

  it('5. Domain switching: switches between Career and Wealth reasoning domains', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Initially in Career Reasoning
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();

    // Click Wealth Reasoning tab
    const wealthTab = screen.getByRole('button', { name: /wealth reasoning/i });
    fireEvent.click(wealthTab);

    // Now in Wealth Reasoning
    expect(screen.getByText('Wealth & Asset Accumulation Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Hora (D2) Divisional Confirmation')).toBeInTheDocument();
  });

  it('6. Unified Overall Conclusion: displays both Career and Wealth side by side regardless of domain (§26, §50)', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    expect(screen.getByText('Overall Conclusion')).toBeInTheDocument();
    expect(screen.getByText('Career Domain')).toBeInTheDocument();
    expect(screen.getByText('Wealth Domain')).toBeInTheDocument();
  });

  it('7. Wire navigation: renders related view links and calls onNavigate without recalculating (§34, §35)', () => {
    const analysis = createProductAnalysis();
    const onNavigate = vi.fn();

    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onNavigate={onNavigate}
      />
    );

    const careerLink = screen.getByRole('button', { name: /view detailed career analysis/i });
    const dashaLink = screen.getByRole('button', { name: /view dasha & timing/i });
    const detailedLink = screen.getByRole('button', { name: /view detailed analysis/i });

    fireEvent.click(careerLink);
    expect(onNavigate).toHaveBeenCalledWith('career');

    fireEvent.click(dashaLink);
    expect(onNavigate).toHaveBeenCalledWith('dasha');

    fireEvent.click(detailedLink);
    expect(onNavigate).toHaveBeenCalledWith('detailed');
  });

  it('8. AI fallback: renders AI section fallback without dropping deterministic verdict when AI is unavailable (§28, §29, §46)', () => {
    const analysis = createProductAnalysis({
      ai: {
        status: 'UNAVAILABLE',
        conclusion: undefined,
        explanation: undefined
      }
    });

    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // AI Section shows fallback
    expect(screen.getByText('AI Explanation')).toBeInTheDocument();
    expect(
      screen.getByText('AI explanation is currently unavailable. The deterministic conclusion remains available above.')
    ).toBeInTheDocument();

    // Deterministic verdict is still rendered above
    expect(screen.getByText('Synthesized Astrological Verdict')).toBeInTheDocument();
  });
});
