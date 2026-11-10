import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

    // Astrological Wealth Indicators (4 houses)
    expect(screen.getByText('Astrological Wealth Indicators')).toBeInTheDocument();
    expect(screen.getByText(
      'Chart-derived indications only; not verified income, savings, assets, or investment facts.'
    )).toBeInTheDocument();
    expect(screen.getAllByText('Accumulation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2nd House (Astrological accumulation indication)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gains & Inflow').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('11th House (Astrological gains indication)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fortune & Luck').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('9th House (Lakshmi Sthana & Prosperity)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Speculation & Venture').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('5th House (Astrological speculation indication)').length).toBeGreaterThanOrEqual(1);

    // Hora (D2) Divisional Alignment
    expect(screen.getByText('Hora (D2) Divisional Alignment')).toBeInTheDocument();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.')
    ).toBeInTheDocument();

    // Wealth Timing & Vimshottari Dasha Hierarchy
    expect(
      screen.getByText('Wealth Timing & Vimshottari Dasha Hierarchy')
    ).toBeInTheDocument();

    // Planetary Transits (Gochara)
    expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
    expect(screen.getByText('No Material Trigger')).toBeInTheDocument();
    expect(screen.getByText('Transits neutral for wealth.')).toBeInTheDocument();

    // C03 separates chart-derived propensity from exposure, trading history, and suitability.
    expect(screen.getByText('Astrological Speculative Propensity')).toBeInTheDocument();
    expect(screen.getByText('Moderate indication')).toBeInTheDocument();
    expect(screen.getByText(/not a measure of actual trading exposure/)).toBeInTheDocument();
    expect(screen.getByText(/Actual exposure:/)).toBeInTheDocument();
    expect(screen.getByText(/Trading history:/)).toBeInTheDocument();
    expect(screen.getByText(/Suitability:/)).toBeInTheDocument();
    expect(screen.queryByText(/investments recommended/i)).not.toBeInTheDocument();

    // Qualifications & Modifiers
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('EXPENDITURE_PRESSURE')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Manage user-reported financial facts' })).toBeInTheDocument();
    expect(screen.getByText(/These records are separate from astrological indications and CW-05/)).toBeInTheDocument();

    // Evidential Reasoning Provenance
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
    expect(screen.getAllByText('2nd Lord Exalted')).toHaveLength(2);

    // D03 evidence diagnostics: preserve D2 unavailable state and distinguish confidence from promise
    expect(screen.getByRole('heading', { name: 'Evidence, confidence & limitations' })).toBeInTheDocument();
    expect(screen.getByText('D2 wealth confirmation')).toBeInTheDocument();
    const evidencePanel = screen.getByRole('region', { name: /Evidence, confidence & limitations/i });
    expect(within(evidencePanel).getByText('Unavailable')).toBeInTheDocument();

    // Integrated Conclusion
    expect(screen.getByText('Integrated Wealth Synthesis')).toBeInTheDocument();
    expect(screen.getByText('Favorable Wealth Outlook')).toBeInTheDocument();
  });

  it('D06: renders the C04 lifecycle rule gate as BLOCKED', () => {
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }} />);
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(screen.getByText('Lifecycle event rules are not release-approved')).toBeInTheDocument();
    expect(screen.getByText(/No lifecycle event category is currently release-enabled/)).toBeInTheDocument();
    expect(screen.getByText(/C04 lifecycle candidate generation is blocked/)).toBeInTheDocument();
  });

  it('D06: renders the ten-step Wealth journey with real anchors and separate financial facts', () => {
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }} />);
    const journey = screen.getByRole('navigation', { name: 'Guided wealth journey' });
    expect(within(journey).getAllByRole('link')).toHaveLength(10);
    expect(within(journey).getByRole('link', { name: /Accumulation/ })).toHaveAttribute('href', '#wealth-accumulation');
    expect(within(journey).getByRole('link', { name: /Financial facts/ })).toHaveAttribute('href', '#wealth-financial-facts');
    expect(within(journey).getByRole('link', { name: /D2 qualification/ })).toHaveTextContent('Unavailable');
    expect(screen.getByRole('region', { name: 'Accumulation detail' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Gains & Inflow detail' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Fortune & Luck detail' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Speculation and limitations' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'D2 status and qualification' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Wealth evidence and provenance' })).toBeInTheDocument();
    expect(screen.getByText('No validated financial facts supplied')).toBeInTheDocument();
    expect(screen.getByText(/does not collect new financial information/)).toBeInTheDocument();
  });

  it('D06: keeps the four canonical Wealth dimensions separate and visible', () => {
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }} />);
    const dimensions = screen.getByRole('region', { name: 'Astrological wealth dimensions' });
    expect(within(dimensions).getByText('Accumulation')).toBeInTheDocument();
    expect(within(dimensions).getByText('Gains & Inflow')).toBeInTheDocument();
    expect(within(dimensions).getByText('Fortune & Luck')).toBeInTheDocument();
    expect(within(dimensions).getByText('Speculation & Venture')).toBeInTheDocument();
  });

  it('D06: renders the canonical D2 unavailable status and its release explanation', () => {
    const base = createProductAnalysis();
    expect(base.wealth.d2.relationship).toBe('UNAVAILABLE');
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: base }} />);
    const d2 = screen.getByRole('region', { name: 'D2 status and qualification' });
    expect(within(d2).getByText('Unavailable')).toBeInTheDocument();
    expect(within(d2).getByText(/D2 calculation and interpretation have not passed independent validation/)).toBeInTheDocument();
  });

  it('D06: displays only validated user-reported financial facts with C01 provenance', () => {
    const base = createProductAnalysis();
    const financialData = {
      schemaVersion: 'C01-v1' as const,
      status: 'AVAILABLE' as const,
      data: [
        {
          id: 'income-report-d06',
          concept: 'INCOME' as const,
          availability: 'AVAILABLE' as const,
          sourceClassification: 'USER_REPORTED_FINANCIAL_FACT' as const,
          value: 125000,
          currency: 'INR',
          period: 'MONTHLY' as const,
          userReportedProvenance: {
            reportedBy: 'USER' as const,
            reportId: 'report-income-d06',
            reportedAt: '2026-11-06T10:00:00+05:30'
          }
        },
        ...(base.wealth.financialData?.data.filter(datum => datum.concept !== 'INCOME') ?? [])
      ]
    };
    const analysis = { ...base, wealth: { ...base.wealth, financialData } };
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis }} />);
    expect(screen.getByText('Financial facts attached to this analysis (C01)')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('125000 INR')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Source and provenance'));
    expect(screen.getByText(/report-income-d06/)).toBeInTheDocument();
    expect(screen.getByText(/Reported by user/)).toBeInTheDocument();
  });

  it('D06: keeps risk qualitative and speculation explicitly non-advisory', () => {
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }} />);
    expect(screen.getByText(/Astrological indication only. It is not a measure of actual trading exposure/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Risk and confidence are separate' })).toBeInTheDocument();
    expect(screen.getByText(/No risk score, capacity, suitability, expected return, or financial recommendation is calculated/)).toBeInTheDocument();
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
