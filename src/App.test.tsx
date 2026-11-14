import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { App } from './App';
import { ProductAnalysisService, mapProductAnalysis, mapMethodology } from './product/analysis';
import { createAnalysisContext } from './core/analysis/analysisContextFactory';
import type { ProductAnalysis } from './product/analysis/productAnalysisTypes';
import type { ProductAnalysisRun } from './product/analysis/productAnalysisService';
import { STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH } from './integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from './domain/synthesis';
import { buildLifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisMapper';
import type { LifeAnalysisProductState, LifeAnalysisViewModel } from './product/life-analysis/lifeAnalysisTypes';
import { calculateHoroscope } from './engine/astroEngine';
import { DEFAULT_BIRTH_DETAILS } from './app/AppState';
import type { BirthDetails } from './types';

const fillBirthForm = (fields: {
  name?: string;
  placeOfBirth?: string;
  dateTime?: string;
  timeZone?: string;
  latitude?: string;
  longitude?: string;
  ayanamsa?: string;
}) => {
  if (fields.name !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('e.g. CoreAstro Test Vector 1'), { target: { value: fields.name } });
  }
  if (fields.placeOfBirth !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('e.g. Ujjain, Muzaffarpur, London...'), { target: { value: fields.placeOfBirth } });
  }
  if (fields.dateTime !== undefined) {
    fireEvent.change(screen.getByLabelText('Birth date and time'), { target: { value: fields.dateTime } });
  }
  if (fields.timeZone !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('Enter IANA timezone, e.g. Asia/Kolkata'), { target: { value: fields.timeZone } });
  }
  if (fields.latitude !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('e.g. 23.1793'), { target: { value: fields.latitude } });
  }
  if (fields.longitude !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('e.g. 75.7849'), { target: { value: fields.longitude } });
  }
  if (fields.ayanamsa !== undefined) {
    const select = screen.getByRole('dialog').querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: fields.ayanamsa } });
  }
};

function navigateToDesktopPage(group: string, page: string): void {
  const navigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
  fireEvent.click(within(navigation).getByRole('button', { name: group }));
  // Multi-page groups (Chart, Insights) open a controlled menu whose items
  // expose role="menuitem"; single-page groups (Home, Report) navigate
  // directly on the group click, so no item click is needed.
  const item = within(navigation).queryByRole('menuitem', { name: page });
  if (item) {
    fireEvent.click(item);
  }
}

function enterBirthDetails(details: BirthDetails = DEFAULT_BIRTH_DETAILS): void {
  fireEvent.click(screen.getAllByRole('button', { name: 'Enter Birth Details' })[0]);
  fillBirthForm({
    name: details.name,
    placeOfBirth: details.placeOfBirth,
    dateTime: details.dateTimeStr.slice(0, 16),
    timeZone: details.timeZone,
    latitude: String(details.latitude),
    longitude: String(details.longitude),
    ayanamsa: details.ayanamsa
  });
  fireEvent.click(screen.getByRole('button', { name: /calculate chart/i }));
}

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

  const defaultHoroscope = calculateHoroscope(DEFAULT_BIRTH_DETAILS);
  const sampleContext = createAnalysisContext({
    asOf: '2026-01-01T00:00:00.000Z',
    methodology: mapMethodology(DEFAULT_BIRTH_DETAILS)
  });
  const readyProductAnalysis: ProductAnalysis = mapProductAnalysis({
    birthDetails: DEFAULT_BIRTH_DETAILS,
    horoscope: defaultHoroscope,
    lifeAnalysisViewModel: sampleViewModel,
    aiExplanation: readyProductState.aiExplanation,
    context: sampleContext
  });

  const makeProductRun = (
    analysis: ProductAnalysis,
    pipelineState: LifeAnalysisProductState | undefined,
    birthDetails = DEFAULT_BIRTH_DETAILS,
    horoscope = defaultHoroscope
  ): ProductAnalysisRun => Object.freeze({
    analysis,
    snapshot: Object.freeze({
      birthDetails,
      context: sampleContext,
      horoscope,
      ...(pipelineState ? { pipelineState } : {})
    })
  });

  let mockLastPipelineState: LifeAnalysisProductState | undefined;
  let mockAnalyze: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLastPipelineState = readyProductState;
    mockAnalyze = vi.spyOn(ProductAnalysisService.prototype, 'analyzeRun')
      .mockImplementation(async (birthDetails: BirthDetails) =>
        makeProductRun(readyProductAnalysis, mockLastPipelineState, birthDetails)
      );
  });

  it('1. Default landing: renders the state-driven home dashboard without a default chart', async () => {
    render(<App />);

    expect(screen.getByText('Enter your birth details to calculate your horoscope')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Enter Birth Details' })).toHaveLength(2);
    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Festivals & Holidays' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explore Your Chart' })).toBeInTheDocument();
  });

  it('2. Grouped navigation reaches Overview and Detailed Analysis without a standalone AI button', async () => {
    render(<App />);
    enterBirthDetails();
    await waitFor(() => expect(mockAnalyze).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Daily Snapshot' })).toBeInTheDocument();
    });

    navigateToDesktopPage('Insights', 'Overview');
    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });
    navigateToDesktopPage('Report', 'Detailed Analysis');
    expect(await screen.findByText('Methodology & Engine Scope')).toBeInTheDocument();

    // Standalone AI Explanation button should NOT be present
    expect(screen.queryByRole('button', { name: 'AI Explanation' })).not.toBeInTheDocument();
  });

  it('3. Invocations: ProductAnalysisService.analyzeRun is called after birth details are saved', async () => {
    render(<App />);
    expect(mockAnalyze).not.toHaveBeenCalled();
    enterBirthDetails();

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          dateTimeStr: expect.any(String)
        })
      );
    });
  });

  it('4. Chart change: changing birth details recalculates and invokes ProductAnalysisService.analyzeRun with new birth details', async () => {
    render(<App />);
    enterBirthDetails();

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
    });

    // Open birth form modal
    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    // Fill in the New Delhi birth details previously provided by the preset
    fillBirthForm({
      name: 'Sample New Delhi',
      placeOfBirth: 'New Delhi, India',
      dateTime: '1995-10-24T12:00',
      timeZone: 'Asia/Kolkata',
      latitude: '28.6139',
      longitude: '77.2090',
      ayanamsa: 'LAHIRI'
    });

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
    let resolveFirstRequest!: (value: ProductAnalysisRun) => void;
    const firstPromise = new Promise<ProductAnalysisRun>((resolve) => {
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
          finalStatus: 'CHALLENGED',
          finalDirection: 'CHALLENGE'
        }
      }
    };

    // First call hangs
    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) => {
      const res = await firstPromise;
      return makeProductRun(res.analysis, mockLastPipelineState, birthDetails);
    });
    // Second call resolves immediately
    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) =>
      makeProductRun(secondProductAnalysis, secondProductState, birthDetails)
    );

    render(<App />);
    enterBirthDetails();
    await waitFor(() => expect(mockAnalyze).toHaveBeenCalledTimes(1));
    navigateToDesktopPage('Insights', 'Overview');

    // Trigger second chart request via modal
    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    // Fill in the J2000 birth details previously provided by the preset
    fillBirthForm({
      name: 'J2000 Epoch',
      placeOfBirth: 'Greenwich, London, UK',
      dateTime: '2000-01-01T12:00',
      timeZone: 'UTC',
      latitude: '51.4769',
      longitude: '0.0005',
      ayanamsa: 'LAHIRI'
    });

    const calcBtn = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(calcBtn);

    // Wait for Chart B's result to appear
    await waitFor(() => {
      expect(screen.getByText(/Challenging career outlook/)).toBeInTheDocument();
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
    resolveFirstRequest(makeProductRun({
      ...readyProductAnalysis,
      analysisId: 'chart-a-stale'
    }, mockLastPipelineState));

    // Wait a tick and verify stale text did NOT overwrite Chart B
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Stale Statement from Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText(/Challenging career outlook/)).toBeInTheDocument();
  });

  it('6. Retry handler: retrying from an ERROR state re-invokes ProductAnalysisService.analyzeRun', async () => {
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

    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) => {
      const pipelineState: LifeAnalysisProductState = {
        status: 'ERROR',
        errorMessage: 'Calculation engine temporarily failed'
      };
      return makeProductRun(errorAnalysis, pipelineState, birthDetails);
    });

    render(<App />);
    enterBirthDetails();
    navigateToDesktopPage('Insights', 'Overview');

    await waitFor(() => {
      expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
      expect(screen.getByText('Calculation engine temporarily failed')).toBeInTheDocument();
    });

    // Setup success for retry
    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) =>
      makeProductRun(readyProductAnalysis, readyProductState, birthDetails)
    );

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

    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) => {
      const pipelineState: LifeAnalysisProductState = {
        status: 'ERROR',
        errorMessage: 'First attempt error'
      };
      return makeProductRun(errorAnalysis, pipelineState, birthDetails);
    });

    render(<App />);
    enterBirthDetails();
    navigateToDesktopPage('Insights', 'Overview');

    await waitFor(() => {
      expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
    });

    let resolveRetryPromise!: (value: ProductAnalysisRun) => void;
    const retryPromise = new Promise<ProductAnalysisRun>((resolve) => {
      resolveRetryPromise = resolve;
    });

    // When retry button clicked, hang the retry request
    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) => {
      const res = await retryPromise;
      return makeProductRun(res.analysis, mockLastPipelineState, birthDetails);
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
          finalStatus: 'CHALLENGED',
          finalDirection: 'CHALLENGE'
        }
      }
    };

    mockAnalyze.mockImplementationOnce(async (birthDetails: BirthDetails) => {
      const pipelineState: LifeAnalysisProductState = {
        status: 'READY',
        analysis: chartBViewModel
      };
      return makeProductRun(chartBProductAnalysis, pipelineState, birthDetails);
    });

    const editBtn = screen.getByTitle('Edit Birth Details & Ayanamsa');
    fireEvent.click(editBtn);

    // Fill in the J2000 birth details previously provided by the preset
    fillBirthForm({
      name: 'J2000 Epoch',
      placeOfBirth: 'Greenwich, London, UK',
      dateTime: '2000-01-01T12:00',
      timeZone: 'UTC',
      latitude: '51.4769',
      longitude: '0.0005',
      ayanamsa: 'LAHIRI'
    });

    const calcBtn = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(calcBtn);

    // Chart B resolves and renders
    await waitFor(() => {
      expect(screen.getByText(/Challenging career outlook/)).toBeInTheDocument();
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
    resolveRetryPromise(makeProductRun({
      ...readyProductAnalysis,
      analysisId: 'chart-a-stale-retry'
    }, mockLastPipelineState));

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Late Retry Result Chart A - Should Be Discarded')).not.toBeInTheDocument();
    expect(screen.getByText(/Challenging career outlook/)).toBeInTheDocument();
  });

  it('8. Tab routing: navigating to Product and Research pages renders cleanly and consumes aggregate', async () => {
    render(<App />);
    enterBirthDetails();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Daily Snapshot' })).toBeInTheDocument();
    });

    navigateToDesktopPage('Insights', 'Overview');
    await waitFor(() => {
      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    });

    // Navigate through grouped product views and assert each page consumes the aggregate.
    navigateToDesktopPage('Insights', 'Career');
    expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();

    navigateToDesktopPage('Insights', 'Wealth');
    expect(screen.getByText('Wealth & Financial Prosperity')).toBeInTheDocument();

    navigateToDesktopPage('Insights', 'Why This Result?');
    expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
    expect(screen.getAllByText('Deterministic Evidence Framework').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Total Evidence Items').length).toBeGreaterThanOrEqual(1);

    navigateToDesktopPage('Insights', 'Dasha & Timing');
    expect(screen.getByText(/Vimshottari Dasha/i)).toBeInTheDocument();

    navigateToDesktopPage('Report', 'Detailed Analysis');

    // Verify FullNatalReportView content renders
    expect(screen.getByText('Methodology & Engine Scope')).toBeInTheDocument();

    // In Detailed Analysis, the Research Tools panel is present
    expect(screen.getByText('Research & Developer Tools')).toBeInTheDocument();

    // Click Horoscope & Charts research tool from the panel
    const horoscopeButtons = screen.getAllByRole('button', { name: 'Horoscope & Charts' });
    fireEvent.click(horoscopeButtons[horoscopeButtons.length - 1]);
    expect(screen.getByText('Rasi Birth Chart (D1)')).toBeInTheDocument();

    // Click Planets & Dignity research tool from the panel
    const planetsButtons = screen.getAllByRole('button', { name: 'Planets & Dignity' });
    fireEvent.click(planetsButtons[planetsButtons.length - 1]);
    expect(screen.getByText('Planetary Facts & Dignity Analysis')).toBeInTheDocument();

    // Click Transit Analysis research tool from the panel
    const transitButtons = screen.getAllByRole('button', { name: 'Transit Analysis' });
    fireEvent.click(transitButtons[transitButtons.length - 1]);
    expect(await screen.findByText('Vedic Planetary Gochara (Transit Analysis)')).toBeInTheDocument();

    // Click Divisional Vargas research tool from the panel
    const divisionalButtons = screen.getAllByRole('button', { name: 'Divisional Vargas' });
    fireEvent.click(divisionalButtons[divisionalButtons.length - 1]);
    expect(await screen.findByText('Divisional Vargas Inspection (D1, D3, D9, D10)', {}, { timeout: 30000 })).toBeInTheDocument();
  });
});
