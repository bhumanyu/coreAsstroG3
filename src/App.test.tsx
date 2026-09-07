import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import * as lifeAnalysisProductService from './product/life-analysis/lifeAnalysisProductService';
import { STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH } from './integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from './domain/synthesis';
import { buildLifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisMapper';
import type { LifeAnalysisProductState, LifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisTypes';

vi.mock('./product/life-analysis/lifeAnalysisProductService', () => ({
  runLifeAnalysisProduct: vi.fn()
}));

describe('App - Life Analysis UI Integration & Navigation', () => {
  const sampleSynthesis = buildLifeAnalysis([STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]);
  const sampleViewModel: LifeAnalysisViewModel = buildLifeAnalysisViewModel(
    sampleSynthesis,
    STAGE1_GOLDEN_CAREER,
    STAGE1_GOLDEN_WEALTH,
    []
  );

  const readyProductState: LifeAnalysisProductState = {
    status: 'READY',
    analysis: sampleViewModel,
    aiExplanation: {
      kind: 'SUCCESS',
      requestId: 'test-req-app-1',
      task: 'LIFE_ANALYSIS_EXPLANATION',
      status: 'SUCCESS',
      conclusion: 'Unified life domain synthesis complete and strong.',
      supportingEvidence: [],
      challengingEvidence: [],
      unresolvedQuestions: [],
      warnings: [],
      triggeredRuleIds: [],
      providerId: 'local-vedic-rules',
      providerName: 'Local Vedic Rules Provider',
      providerKind: 'LOCAL_RULES',
      routingMode: 'LOCAL_ONLY',
      fallbackUsed: false,
      selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
      generatedAt: '2026-01-01T00:00:00.000Z'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValue(readyProductState);
  });

  it('1. Default landing: renders on Overview tab and displays Unified Life Domain Analysis heading', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });
  });

  it('2. Navigation tabs: Overview and Detailed Analysis buttons exist, while standalone AI Explanation button is NOT present', async () => {
    render(<App />);

    // Product navigation tab buttons
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Career' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wealth' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dasha & Timing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Why This Result?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detailed Analysis' })).toBeInTheDocument();

    // Standalone AI Explanation button should NOT be present
    expect(screen.queryByRole('button', { name: 'AI Explanation' })).not.toBeInTheDocument();
  });

  it('3. Invocations: runLifeAnalysisProduct is called on mount with includeAiExplanation: true', async () => {
    render(<App />);

    await waitFor(() => {
      expect(lifeAnalysisProductService.runLifeAnalysisProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          includeAiExplanation: true,
          horoscope: expect.any(Object)
        })
      );
    });
  });

  it('4. Chart change: changing birth details recalculates and invokes runLifeAnalysisProduct with new horoscope', async () => {
    render(<App />);

    await waitFor(() => {
      expect(lifeAnalysisProductService.runLifeAnalysisProduct).toHaveBeenCalledTimes(1);
    });

    // Open birth form modal
    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    // Select New Delhi preset
    const delhiPresetBtn = screen.getByText('New Delhi Birth Chart');
    fireEvent.click(delhiPresetBtn);

    // Submit chart
    const calcBtn = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      const calls = vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].horoscope).not.toEqual(calls[1][0].horoscope);
      expect(calls[0][0].horoscope.birthDetails.latitude).not.toEqual(calls[1][0].horoscope.birthDetails.latitude);
    });
  });

  it('5. Stale-result protection: ignores result A when result B was triggered before A resolves', async () => {
    let resolveFirstRequest!: (value: LifeAnalysisProductState) => void;
    const firstPromise = new Promise<LifeAnalysisProductState>((resolve) => {
      resolveFirstRequest = resolve;
    });

    const secondViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      overall: {
        ...sampleViewModel.overall,
        statement: 'Statement from Chart B - Fresh Result'
      }
    };
    const secondProductState: LifeAnalysisProductState = {
      status: 'READY',
      analysis: secondViewModel
    };

    // First call hangs
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockReturnValueOnce(firstPromise);
    // Second call resolves immediately
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValueOnce(secondProductState);

    render(<App />);

    // Trigger second chart request via modal
    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    const j2000PresetBtn = screen.getByText('J2000 Astronomical Epoch');
    fireEvent.click(j2000PresetBtn);

    const calcBtn = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(calcBtn);

    // Wait for Chart B's result to appear
    await waitFor(() => {
      expect(screen.getByText('Statement from Chart B - Fresh Result')).toBeInTheDocument();
    });

    // Now resolve first request with stale data
    const staleViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      overall: {
        ...sampleViewModel.overall,
        statement: 'Stale Statement from Chart A - Should Be Discarded'
      }
    };
    resolveFirstRequest({
      status: 'READY',
      analysis: staleViewModel
    });

    // Wait a tick and verify stale text did NOT overwrite Chart B
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Stale Statement from Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText('Statement from Chart B - Fresh Result')).toBeInTheDocument();
  });

  it('6. Retry handler: retrying from an ERROR state re-invokes runLifeAnalysisProduct', async () => {
    const errorState: LifeAnalysisProductState = {
      status: 'ERROR',
      errorMessage: 'Calculation engine temporarily failed'
    };

    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValueOnce(errorState);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Life Analysis Computation Error')).toBeInTheDocument();
      expect(screen.getByText('Calculation engine temporarily failed')).toBeInTheDocument();
    });

    // Setup success for retry
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValueOnce(readyProductState);

    const retryBtn = screen.getByRole('button', { name: /retry analysis/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(lifeAnalysisProductService.runLifeAnalysisProduct).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });
  });

  it('7. Stale retry protection: late-resolving retry on Chart A does not overwrite newer Chart B', async () => {
    const errorState: LifeAnalysisProductState = {
      status: 'ERROR',
      errorMessage: 'First attempt error'
    };

    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValueOnce(errorState);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Life Analysis Computation Error')).toBeInTheDocument();
    });

    let resolveRetryPromise!: (value: LifeAnalysisProductState) => void;
    const retryPromise = new Promise<LifeAnalysisProductState>((resolve) => {
      resolveRetryPromise = resolve;
    });

    // When retry button clicked, hang the retry request
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockReturnValueOnce(retryPromise);

    const retryBtn = screen.getByRole('button', { name: /retry analysis/i });
    fireEvent.click(retryBtn);

    // While retry is pending, user changes chart to Chart B
    const chartBViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      overall: {
        ...sampleViewModel.overall,
        statement: 'Statement from Chart B - Fresh Selection'
      }
    };
    vi.mocked(lifeAnalysisProductService.runLifeAnalysisProduct).mockResolvedValueOnce({
      status: 'READY',
      analysis: chartBViewModel
    });

    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    const j2000PresetBtn = screen.getByText('J2000 Astronomical Epoch');
    fireEvent.click(j2000PresetBtn);

    const calcBtn = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(calcBtn);

    // Chart B resolves and renders
    await waitFor(() => {
      expect(screen.getByText('Statement from Chart B - Fresh Selection')).toBeInTheDocument();
    });

    // Now late retry on Chart A resolves
    const staleRetryViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      overall: {
        ...sampleViewModel.overall,
        statement: 'Late Retry Result Chart A - Should Be Discarded'
      }
    };
    resolveRetryPromise({
      status: 'READY',
      analysis: staleRetryViewModel
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Late Retry Result Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText('Statement from Chart B - Fresh Selection')).toBeInTheDocument();
  });

  it('8. Tab routing: navigating to Product and Research pages renders cleanly', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });

    // Click Career tab
    const careerTab = screen.getByRole('button', { name: 'Career' });
    fireEvent.click(careerTab);
    expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();

    // Click Wealth tab
    const wealthTab = screen.getByRole('button', { name: 'Wealth' });
    fireEvent.click(wealthTab);
    expect(screen.getByText('Wealth & Financial Prosperity')).toBeInTheDocument();

    // Click Why This Result? tab
    const reasoningTab = screen.getByRole('button', { name: 'Why This Result?' });
    fireEvent.click(reasoningTab);
    expect(screen.getByText('Astrological Reasoning & Evidence Trace')).toBeInTheDocument();

    // Click Dasha & Timing tab
    const dashaTab = screen.getByRole('button', { name: 'Dasha & Timing' });
    fireEvent.click(dashaTab);
    expect(screen.getByText(/Vimshottari Dasha/i)).toBeInTheDocument();

    // Click Detailed Analysis tab
    const detailedAnalysisTab = screen.getByRole('button', { name: 'Detailed Analysis' });
    fireEvent.click(detailedAnalysisTab);

    // Verify FullNatalReportView content renders
    expect(screen.getByText('Methodology & Engine Scope')).toBeInTheDocument();

    // In Detailed Analysis, the Research Tools panel is present
    expect(screen.getByText('Research & Classical Inspection Tools')).toBeInTheDocument();

    // Click Horoscope & Charts research tool from the panel
    const horoscopeBtn = screen.getByRole('button', { name: 'Horoscope & Charts' });
    fireEvent.click(horoscopeBtn);
    expect(screen.getByText('Rasi Birth Chart (D1)')).toBeInTheDocument();

    // Click Planets & Dignity research tool from the panel
    const planetsBtn = screen.getByRole('button', { name: 'Planets & Dignity' });
    fireEvent.click(planetsBtn);
    expect(screen.getByText('Planetary Facts & Dignity Analysis')).toBeInTheDocument();

    // Click Transit Analysis research tool from the panel
    const transitBtn = screen.getByRole('button', { name: 'Transit Analysis' });
    fireEvent.click(transitBtn);
    expect(screen.getByText('Vedic Planetary Gochara (Transit Analysis)')).toBeInTheDocument();

    // Click Divisional Vargas research tool from the panel
    const divisionalBtn = screen.getByRole('button', { name: 'Divisional Vargas' });
    fireEvent.click(divisionalBtn);
    expect(screen.getByText('Divisional Vargas Inspection (D1, D3, D9, D10)')).toBeInTheDocument();
  });
});
