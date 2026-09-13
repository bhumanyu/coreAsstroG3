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

  it('4. Rendered sections: renders both Career and Wealth sections simultaneously from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Cross-Domain Evidence Framework
    expect(screen.getByText('Cross-Domain Evidence Framework')).toBeInTheDocument();
    // Evidence deduplication: per-domain evidence groups are removed in favor of cross-domain
    expect(screen.queryByText('Evidentiary Reasoning Groups')).not.toBeInTheDocument();

    // Side-by-side Divisional Confirmation
    expect(screen.getByText('Divisional Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Hora (D2) Divisional Confirmation')).toBeInTheDocument();

    // Side-by-side Transit Timing
    expect(screen.getByText('Transit Timing')).toBeInTheDocument();
    expect(screen.getByText('Career Transit Timing')).toBeInTheDocument();
    expect(screen.getByText('Wealth Transit Timing')).toBeInTheDocument();

    // Single overall AI Explanation at page level
    expect(screen.getAllByText('AI Explanation').length).toBe(1);

    // Career Section
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();

    // Wealth Section
    expect(screen.getByText('Wealth & Asset Accumulation Reasoning')).toBeInTheDocument();

    // Dasha for both domains rendered simultaneously
    const dashaHeadings = screen.getAllByText('Chronological Vimshottari Dasha Activation');
    expect(dashaHeadings.length).toBe(2);

    // Qualifications
    expect(screen.getAllByText('Reasoning Qualifications & Caveats').length).toBe(2);

    // Synthesized Verdicts
    expect(screen.getAllByText('Synthesized Astrological Verdict').length).toBe(2);
  });

  it('5. Domain switching: sets active view focus and scrolls without unmounting either domain', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Initial focus label
    expect(screen.getAllByText('All Domains')[0]).toBeInTheDocument();

    // Both Career and Wealth are in the document initially
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Wealth & Asset Accumulation Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Hora (D2) Divisional Confirmation')).toBeInTheDocument();

    // Click Wealth Reasoning button
    const wealthTab = screen.getByRole('button', { name: /wealth reasoning/i });
    fireEvent.click(wealthTab);

    // Active View / Focus indicator updates
    expect(screen.getAllByText('Wealth Domain')[0]).toBeInTheDocument();

    // Both domains STILL exist in the document (not gated)
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Wealth & Asset Accumulation Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();
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
    expect(screen.getAllByText('AI Explanation').length).toBe(1);
    expect(
      screen.getByText('AI explanation is currently unavailable. The deterministic conclusion remains available above.')
    ).toBeInTheDocument();

    // Deterministic verdict is still rendered above
    expect(screen.getAllByText('Synthesized Astrological Verdict').length).toBe(2);
  });

  it('9. Cross-domain evidence deduplication: displays deduplicated evidence framework count', () => {
    const analysis = createProductAnalysis();
    render(
      <ReasoningPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    const crossDomainHeading = screen.getByText('Cross-Domain Evidence Framework');
    expect(crossDomainHeading).toBeInTheDocument();

    // Deduplicated count badge is present
    expect(screen.getAllByText(/evidence items/i).length).toBeGreaterThanOrEqual(1);
  });

  it('10. Domain independence: preserves independent transits and vargas for Career and Wealth', () => {
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        activation: {
          ...createProductAnalysis().career.activation,
          transit: {
            status: 'AVAILABLE',
            effect: 'TRIGGER',
            statement: 'Career transit trigger: Saturn in 10th'
          }
        }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        activation: {
          ...createProductAnalysis().wealth.activation,
          transit: {
            status: 'AVAILABLE',
            effect: 'MODIFIER',
            statement: 'Wealth transit modifier: Jupiter in 2nd'
          }
        }
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

    // Both unique transit statements render independently
    expect(screen.getAllByText('Career transit trigger: Saturn in 10th').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Wealth transit modifier: Jupiter in 2nd').length).toBeGreaterThanOrEqual(1);

    // D10 and D2 divisional confirmations render independently
    expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Hora (D2) Divisional Confirmation')).toBeInTheDocument();
  });
});
