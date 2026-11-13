import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { OverviewPage } from '../OverviewPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('OverviewPage (P-UI-03)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders loading state when status is LOADING', () => {
    render(<OverviewPage status="LOADING" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Synthesizing Life Overview')).toBeInTheDocument();
  });

  it('renders empty state when no analysis is provided in IDLE state', () => {
    const onRetry = vi.fn();
    render(<OverviewPage status="IDLE" onRetry={onRetry} />);

    expect(screen.getByText('Chart Overview Unavailable')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /recalculate analysis/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders error state when status is ERROR', () => {
    const onRetry = vi.fn();
    render(
      <OverviewPage
        status="ERROR"
        errorMessage="Custom calculation failure"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Custom calculation failure')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /recalculate analysis/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Career and Wealth domain summaries, chart indicators, and overall assessment', () => {
    const analysis = createProductAnalysis();
    render(<OverviewPage analysis={analysis} status="READY" />);

    // Header & Chart Metadata
    expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    expect(screen.getAllByText('Capricorn').length).toBe(2);
    expect(screen.getByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Magha')).toBeInTheDocument();

    // Overall Assessment Card
    expect(screen.getByText('Overall Synthesis & Assessment')).toBeInTheDocument();
    expect(screen.getByText('Complete Assessment')).toBeInTheDocument();

    // Career Domain
    expect(screen.getByText('Career & Professional Life')).toBeInTheDocument();
    expect(
      screen.getByText('Supportive outlook. Strong foundation with supportive indications. Supportive. Currently active. High confidence.')
    ).toBeInTheDocument();

    // Wealth Domain
    expect(screen.getByText('Wealth & Financial Assets')).toBeInTheDocument();
    expect(
      screen.getByText('Strong indications. Strong foundation. Supportive. Supportive. High confidence.')
    ).toBeInTheDocument();

    // Key Findings & Qualifications
    expect(screen.getByText('Key Cross-Domain Findings')).toBeInTheDocument();
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('COMBUSTION')).toBeInTheDocument();

    // Evidence index badge uses totalEvidenceCount (2 career + 1 wealth = 3 evidence items indexed)
    expect(screen.getByText('3 evidence items indexed')).toBeInTheDocument();
  });

  it('invokes onNavigate callback when clicking domain action links', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(<OverviewPage analysis={analysis} status="READY" onNavigate={onNavigate} />);

    // Click Explore Career Details
    const careerBtn = screen.getByRole('button', { name: /explore career details/i });
    fireEvent.click(careerBtn);
    expect(onNavigate).toHaveBeenCalledWith('career');

    // Click Explore Wealth Details
    const wealthBtn = screen.getByRole('button', { name: /explore wealth details/i });
    fireEvent.click(wealthBtn);
    expect(onNavigate).toHaveBeenCalledWith('wealth');

    // Click Explore Reasoning Graph
    const reasoningBtn = screen.getByRole('button', { name: /explore reasoning graph/i });
    fireEvent.click(reasoningBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');
  });
});
