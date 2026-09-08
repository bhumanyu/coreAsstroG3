import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { ProductAnalysisService, mapProductAnalysis } from './product/analysis';
import type { ProductAnalysis } from './product/analysis/productAnalysisTypes';
import { STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH } from './integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from './domain/synthesis';
import { buildLifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisMapper';
import type { LifeAnalysisProductState, LifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisTypes';
import { calculateHoroscope } from './engine/astroEngine';
import { PRESET_PROFILES } from './components/BirthFormModal';

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

  const defaultHoroscope = calculateHoroscope(PRESET_PROFILES[0].details);
  const readyProductAnalysis: ProductAnalysis = mapProductAnalysis({
    birthDetails: PRESET_PROFILES[0].details,
    horoscope: defaultHoroscope,
    lifeAnalysisViewModel: sampleViewModel,
    aiExplanation: readyProductState.aiExplanation
  });

  let mockLastPipelineState: LifeAnalysisProductState | undefined;
  let mockAnalyze: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLastPipelineState = readyProductState;
    mockAnalyze = vi.spyOn(ProductAnalysisService.prototype, 'analyze').mockImplementation(async function (this: any) {
      this._lastPipelineState = mockLastPipelineState;
      this._lastHoroscope = defaultHoroscope;
      return readyProductAnalysis;
    });
  });

  it('1. Default landing: renders on Overview tab and displays Unified Life Domain Analysis heading', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });
  });

  it('2. Navigation tabs: Overview and Detailed Analysis buttons exist, while standalone AI Explanation button is NOT present', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });

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

  it('3. Invocations: ProductAnalysisService.analyze is called on mount with birth details', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          dateTimeStr: expect.any(String)
        })
      );
    });
  });

  it('4. Chart change: changing birth details recalculates and invokes ProductAnalysisService.analyze with new birth details', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
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
      const calls = mockAnalyze.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0]).not.toEqual(calls[1][0]);
      expect(calls[1][0].latitude).toBe(28.6139);
    });
  });

  it('5. Stale-result protection: ignores result A when result B was triggered before A resolves', async () => {
    let resolveFirstRequest!: (value: ProductAnalysis) => void;
    const firstPromise = new Promise<ProductAnalysis>((resolve) => {
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
    const secondProductAnalysis: ProductAnalysis = {
      ...readyProductAnalysis,
      analysisId: 'chart-b-analysis',
      career: {
        ...readyProductAnalysis.career,
        synthesis: {
          ...readyProductAnalysis.career.synthesis,
          statement: 'Statement from Chart B - Fresh Result'
        }
      }
    };

    // First call hangs
    mockAnalyze.mockImplementationOnce(async function (this: any) {
      const res = await firstPromise;
      this._lastPipelineState = mockLastPipelineState;
      return res;
    });
    // Second call resolves immediately
    mockAnalyze.mockImplementationOnce(async function (this: any) {
      this._lastPipelineState = secondProductState;
      return secondProductAnalysis;
    });

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
    mockLastPipelineState = {
      status: 'READY',
      analysis: staleViewModel
    };
    resolveFirstRequest({
      ...readyProductAnalysis,
      analysisId: 'chart-a-stale'
    });

    // Wait a tick and verify stale text did NOT overwrite Chart B
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Stale Statement from Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText('Statement from Chart B - Fresh Result')).toBeInTheDocument();
  });

  it('6. Retry handler: retrying from an ERROR state re-invokes ProductAnalysisService.analyze', async () => {
    const errorAnalysis: ProductAnalysis = {
      ...readyProductAnalysis,
      status: 'ERROR',
      warnings: [
        {
          domain: 'ALL',
          code: 'ERR_1',
          severity: 'ERROR',
          message: 'Calculation engine temporarily failed'
        }
      ]
    };

    mockAnalyze.mockImplementationOnce(async function (this: any) {
      this._lastPipelineState = {
        status: 'ERROR',
        errorMessage: 'Calculation engine temporarily failed'
      };
      return errorAnalysis;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
      expect(screen.getByText('Calculation engine temporarily failed')).toBeInTheDocument();
    });

    // Setup success for retry
    mockAnalyze.mockImplementationOnce(async function (this: any) {
      this._lastPipelineState = readyProductState;
      return readyProductAnalysis;
    });

    const retryBtn = screen.getByRole('button', { name: /recalculate analysis|retry analysis/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });
  });

  it('7. Stale retry protection: late-resolving retry on Chart A does not overwrite newer Chart B', async () => {
    const errorAnalysis: ProductAnalysis = {
      ...readyProductAnalysis,
      status: 'ERROR',
      warnings: [
        {
          domain: 'ALL',
          code: 'ERR_1',
          severity: 'ERROR',
          message: 'First attempt error'
        }
      ]
    };

    mockAnalyze.mockImplementationOnce(async function (this: any) {
      this._lastPipelineState = {
        status: 'ERROR',
        errorMessage: 'First attempt error'
      };
      return errorAnalysis;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
    });

    let resolveRetryPromise!: (value: ProductAnalysis) => void;
    const retryPromise = new Promise<ProductAnalysis>((resolve) => {
      resolveRetryPromise = resolve;
    });

    // When retry button clicked, hang the retry request
    mockAnalyze.mockImplementationOnce(async function (this: any) {
      const res = await retryPromise;
      this._lastPipelineState = mockLastPipelineState;
      return res;
    });

    const retryBtn = screen.getByRole('button', { name: /recalculate analysis|retry analysis/i });
    fireEvent.click(retryBtn);

    // While retry is pending, user changes chart to Chart B
    const chartBViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      overall: {
        ...sampleViewModel.overall,
        statement: 'Statement from Chart B - Fresh Selection'
      }
    };
    const chartBProductAnalysis: ProductAnalysis = {
      ...readyProductAnalysis,
      analysisId: 'chart-b-analysis-2',
      career: {
        ...readyProductAnalysis.career,
        synthesis: {
          ...readyProductAnalysis.career.synthesis,
          statement: 'Statement from Chart B - Fresh Selection'
        }
      }
    };

    mockAnalyze.mockImplementationOnce(async function (this: any) {
      this._lastPipelineState = {
        status: 'READY',
        analysis: chartBViewModel
      };
      return chartBProductAnalysis;
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
    mockLastPipelineState = {
      status: 'READY',
      analysis: {
        ...sampleViewModel,
        overall: {
          ...sampleViewModel.overall,
          statement: 'Late Retry Result Chart A - Should Be Discarded'
        }
      }
    };
    resolveRetryPromise({
      ...readyProductAnalysis,
      analysisId: 'chart-a-stale-retry'
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Late Retry Result Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText('Statement from Chart B - Fresh Selection')).toBeInTheDocument();
  });

  it('8. Tab routing: navigating to Product and Research pages renders cleanly and consumes aggregate', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });

    // Click Career tab - asserts career page renders from aggregate
    const careerTab = screen.getByRole('button', { name: 'Career' });
    fireEvent.click(careerTab);
    expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();

    // Click Wealth tab - asserts wealth page renders from aggregate
    const wealthTab = screen.getByRole('button', { name: 'Wealth' });
    fireEvent.click(wealthTab);
    expect(screen.getByText('Wealth & Financial Prosperity')).toBeInTheDocument();

    // Click Why This Result? tab - asserts reasoning page renders from aggregate
    const reasoningTab = screen.getByRole('button', { name: 'Why This Result?' });
    fireEvent.click(reasoningTab);
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Deterministic Evidence Framework')).toBeInTheDocument();
    expect(screen.getByText('Total Evidence Items')).toBeInTheDocument();

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
