import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiExplanationPage } from './AiExplanationPage';
import { AiExplanationPanel, type AiExplanationPanelProps } from '../components/ai/AiExplanationPanel';
import type { AppState } from '../app/AppState';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import { calculateHoroscope } from '../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import type { BirthDetails, Horoscope } from '../types';
import type { DomainInterpretation } from '../domain/interpretation';
import { createDomainInterpretation } from '../domain/interpretation';
import { createNatalPromise } from '../domain/interpretation/NatalPromise';
import type { LifeAnalysis } from '../domain/synthesis';
import { buildLifeAnalysis } from '../domain/synthesis';
import type { AnalysisTemporalState } from '../core/analysis/AnalysisTemporalState';
import { createAnalysisContext } from '../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../core/analysis/resolveAnalysisTemporalState';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';

vi.mock('../components/ai/AiExplanationPanel', () => ({
  AiExplanationPanel: vi.fn((_props: AiExplanationPanelProps) => (
    <div data-testid="mock-ai-explanation-panel">Mock AiExplanationPanel</div>
  ))
}));

describe('AiExplanationPage Integration', () => {
  const birthDetails: BirthDetails = CANONICAL_BIRTH_DETAILS;
  const horoscope: Horoscope = calculateHoroscope(birthDetails);

  const mockCareer: DomainInterpretation = createDomainInterpretation({
    domain: 'CAREER',
    natalPromise: createNatalPromise({
      domain: 'CAREER',
      strength: 'STRONG',
      statement: 'Career natal promise'
    }),
    asOf: birthDetails.dateTimeStr,
    generatedAt: '2026-01-01T00:00:00.000Z'
  });

  const mockWealth: DomainInterpretation = createDomainInterpretation({
    domain: 'WEALTH',
    natalPromise: createNatalPromise({
      domain: 'WEALTH',
      strength: 'STRONG',
      statement: 'Wealth natal promise'
    }),
    asOf: birthDetails.dateTimeStr,
    generatedAt: '2026-01-01T00:00:00.000Z'
  });

  const mockLifeAnalysis: LifeAnalysis = buildLifeAnalysis([mockCareer, mockWealth]);

  const mockContext = createAnalysisContext({ asOf: birthDetails.dateTimeStr });
  const mockTemporalState: AnalysisTemporalState = resolveAnalysisTemporalState(
    horoscope,
    mockContext
  );

  const productAnalysis = createProductAnalysis({
    analysisId: 'canonical-analysis-id-001'
  });

  const validLifeAnalysisState: LifeAnalysisProductState = {
    status: 'READY',
    career: mockCareer,
    wealth: mockWealth,
    lifeAnalysis: mockLifeAnalysis,
    temporalState: mockTemporalState
  };

  const createValidAppState = (): AppState => ({
    activePage: 'ai',
    birthDetails,
    isBirthFormOpen: false,
    productAnalysis: {
      status: 'READY',
      analysis: productAnalysis,
      horoscope
    },
    lifeAnalysisState: validLifeAnalysisState,
    horoscope
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AiExplanationPanel and passes canonical execution artifacts with exact object identity (toBe)', () => {
    const appState = createValidAppState();

    render(
      <AiExplanationPage
        state={appState}
        horoscope={horoscope}
        lifeAnalysisState={validLifeAnalysisState}
      />
    );

    expect(screen.getByTestId('mock-ai-explanation-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-explanation-unavailable')).not.toBeInTheDocument();

    expect(AiExplanationPanel).toHaveBeenCalledTimes(1);
    const panelProps = vi.mocked(AiExplanationPanel).mock.calls[0][0];

    // Assert exact object identity (toBe, not toEqual) for all canonical artifacts
    expect(panelProps.horoscope).toBe(horoscope);
    expect(panelProps.career).toBe(validLifeAnalysisState.career);
    expect(panelProps.wealth).toBe(validLifeAnalysisState.wealth);
    expect(panelProps.lifeAnalysis).toBe(validLifeAnalysisState.lifeAnalysis);
    expect(panelProps.temporalState).toBe(validLifeAnalysisState.temporalState);
    expect(panelProps.analysisId).toBe(appState.productAnalysis.analysis?.analysisId);
  });

  it('renders AiExplanationPanel from state.lifeAnalysisState when prop is omitted', () => {
    const appState = createValidAppState();

    render(
      <AiExplanationPage
        state={appState}
        horoscope={horoscope}
      />
    );

    expect(screen.getByTestId('mock-ai-explanation-panel')).toBeInTheDocument();
    const panelProps = vi.mocked(AiExplanationPanel).mock.calls[0][0];

    expect(panelProps.horoscope).toBe(horoscope);
    expect(panelProps.career).toBe(appState.lifeAnalysisState.career);
    expect(panelProps.wealth).toBe(appState.lifeAnalysisState.wealth);
    expect(panelProps.lifeAnalysis).toBe(appState.lifeAnalysisState.lifeAnalysis);
    expect(panelProps.temporalState).toBe(appState.lifeAnalysisState.temporalState);
    expect(panelProps.analysisId).toBe(appState.productAnalysis.analysis?.analysisId);
  });

  describe('unavailable branch', () => {
    it('renders unavailable block when effectiveState.status is ERROR and fires onRetry', () => {
      const onRetry = vi.fn();
      const errorLifeAnalysisState: LifeAnalysisProductState = {
        ...validLifeAnalysisState,
        status: 'ERROR',
        errorMessage: 'Pipeline computation failed'
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: errorLifeAnalysisState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={errorLifeAnalysisState}
          onRetry={onRetry}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
      expect(screen.getByText('AI Explanation Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText('Canonical analysis artifacts are not yet ready or failed to compute.')
      ).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry analysis/i });
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders unavailable block without retry button when onRetry is not provided', () => {
      const errorLifeAnalysisState: LifeAnalysisProductState = {
        ...validLifeAnalysisState,
        status: 'ERROR'
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: errorLifeAnalysisState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={errorLifeAnalysisState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry analysis/i })).not.toBeInTheDocument();
    });

    it('renders unavailable block when horoscope is missing', () => {
      const appState = createValidAppState();

      render(
        <AiExplanationPage
          state={appState}
          horoscope={undefined}
          lifeAnalysisState={validLifeAnalysisState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
    });

    it('renders unavailable block when career is missing', () => {
      const incompleteState: LifeAnalysisProductState = {
        status: 'READY',
        career: undefined,
        wealth: mockWealth,
        lifeAnalysis: mockLifeAnalysis,
        temporalState: mockTemporalState
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: incompleteState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={incompleteState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
    });

    it('renders unavailable block when wealth is missing', () => {
      const incompleteState: LifeAnalysisProductState = {
        status: 'READY',
        career: mockCareer,
        wealth: undefined,
        lifeAnalysis: mockLifeAnalysis,
        temporalState: mockTemporalState
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: incompleteState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={incompleteState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
    });

    it('renders unavailable block when lifeAnalysis is missing', () => {
      const incompleteState: LifeAnalysisProductState = {
        status: 'READY',
        career: mockCareer,
        wealth: mockWealth,
        lifeAnalysis: undefined,
        temporalState: mockTemporalState
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: incompleteState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={incompleteState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
    });

    it('renders unavailable block when temporalState is missing', () => {
      const incompleteState: LifeAnalysisProductState = {
        status: 'READY',
        career: mockCareer,
        wealth: mockWealth,
        lifeAnalysis: mockLifeAnalysis,
        temporalState: undefined
      };
      const appState: AppState = {
        ...createValidAppState(),
        lifeAnalysisState: incompleteState
      };

      render(
        <AiExplanationPage
          state={appState}
          horoscope={horoscope}
          lifeAnalysisState={incompleteState}
        />
      );

      expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-ai-explanation-panel')).not.toBeInTheDocument();
    });
  });
});
