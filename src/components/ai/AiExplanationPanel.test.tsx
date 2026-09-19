import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiExplanationPanel } from './AiExplanationPanel';
import * as aiModule from '../../ai';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet, type BirthDetails, type Horoscope } from '../../types';
import type { AiExplanationViewModel, AiExplanationErrorViewModel } from '../../ai';
import type { DomainInterpretation } from '../../domain/interpretation';
import { createDomainInterpretation } from '../../domain/interpretation';
import { createNatalPromise } from '../../domain/interpretation/NatalPromise';
import type { LifeAnalysis } from '../../domain/synthesis';
import { buildLifeAnalysis } from '../../domain/synthesis';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import { resolveDashaInterpretationForAsOf } from '../../engine/dashaInterpretation/resolveDashaForAsOf';
import * as careerModule from '../../domain/career/CareerDomainInterpreterV2';
import * as wealthModule from '../../domain/wealth/WealthDomainInterpreterV2';
import * as temporalModule from '../../core/analysis/resolveAnalysisTemporalState';
import * as synthesisModule from '../../domain/synthesis';

vi.mock('../../ai', async () => {
  const actual = await vi.importActual<typeof import('../../ai')>('../../ai');
  return {
    ...actual,
    runAiExplanation: vi.fn()
  };
});

describe('AiExplanationPanel', () => {
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

  const chartBDetails: BirthDetails = {
    ...birthDetails,
    dateTimeStr: '2021-08-20T10:30:00Z'
  };
  const chartBHoroscope: Horoscope = calculateHoroscope(chartBDetails);
  const chartBContext = createAnalysisContext({ asOf: chartBDetails.dateTimeStr });
  const chartBTemporalState: AnalysisTemporalState = resolveAnalysisTemporalState(
    chartBHoroscope,
    chartBContext
  );
  const chartBCareer: DomainInterpretation = createDomainInterpretation({
    domain: 'CAREER',
    natalPromise: createNatalPromise({
      domain: 'CAREER',
      strength: 'STRONG',
      statement: 'Chart B Career'
    }),
    asOf: chartBDetails.dateTimeStr,
    generatedAt: '2026-01-01T00:00:00.000Z'
  });
  const chartBWealth: DomainInterpretation = createDomainInterpretation({
    domain: 'WEALTH',
    natalPromise: createNatalPromise({
      domain: 'WEALTH',
      strength: 'STRONG',
      statement: 'Chart B Wealth'
    }),
    asOf: chartBDetails.dateTimeStr,
    generatedAt: '2026-01-01T00:00:00.000Z'
  });
  const chartBLifeAnalysis: LifeAnalysis = buildLifeAnalysis([chartBCareer, chartBWealth]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state with task options and generate button', () => {
    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    expect(screen.getByText('AI Explanation')).toBeInTheDocument();
    expect(screen.getByText('Chart Synthesis')).toBeInTheDocument();
    expect(screen.getByText('Career')).toBeInTheDocument();
    expect(screen.getByText('Wealth')).toBeInTheDocument();
    expect(screen.getByText('Current Dasha')).toBeInTheDocument();
    expect(screen.getByText('Life Themes')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate explanation/i })
    ).toBeInTheDocument();
  });

  it('allows task selection', () => {
    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const careerBtn = screen.getByText('Career').closest('button');
    expect(careerBtn).toBeInTheDocument();
    if (careerBtn) {
      fireEvent.click(careerBtn);
      expect(careerBtn.className).toContain('border-indigo-500');
    }
  });

  it('generates and renders successful explanation', async () => {
    const mockViewModel: AiExplanationViewModel = {
      kind: 'SUCCESS',
      requestId: 'test-req-123',
      task: 'CAREER_ANALYSIS',
      status: 'SUCCESS',
      conclusion: 'Career is strongly supported by 10th house configuration.',
      supportingEvidence: [],
      challengingEvidence: [],
      unresolvedQuestions: [],
      warnings: [],
      triggeredRuleIds: ['RULE-001'],
      providerId: 'local-vedic-rules',
      providerName: 'Local Vedic Rules Provider',
      providerKind: 'LOCAL_RULES',
      routingMode: 'LOCAL_ONLY',
      fallbackUsed: false,
      selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
      generatedAt: '2026-01-01T00:00:00.000Z'
    };

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce(mockViewModel);

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Career is strongly supported by 10th house configuration.'
        )
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Provider: Local Vedic Rules Provider/)).toBeInTheDocument();
    expect(screen.getByText(/Mode: LOCAL_ONLY/)).toBeInTheDocument();
  });

  it('handles loading state during explanation generation', async () => {
    let resolvePromise: (value: AiExplanationViewModel) => void;
    const pendingPromise = new Promise<AiExplanationViewModel>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(aiModule.runAiExplanation).mockReturnValueOnce(pendingPromise);

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    expect(screen.getByText(/generating explanation…/i)).toBeInTheDocument();
    expect(generateBtn).toBeDisabled();

    // Verify task option buttons are also disabled while request is in-flight
    const careerBtn = screen.getByText('Career').closest('button');
    expect(careerBtn).toBeDisabled();

    resolvePromise!({
      kind: 'SUCCESS',
      requestId: 'req-1',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Complete chart synthesis done.',
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
    });

    await waitFor(() => {
      expect(
        screen.getByText('Complete chart synthesis done.')
      ).toBeInTheDocument();
    });
  });

  it('renders error state when explanation fails', async () => {
    const mockError: AiExplanationErrorViewModel = {
      kind: 'ERROR',
      requestId: 'req-err-1',
      task: 'CAREER_ANALYSIS',
      status: 'ERROR',
      message: 'Rule engine context was corrupted.',
      warnings: []
    };

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce(mockError);

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText('AI explanation unavailable')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Rule engine context was corrupted.')
      ).toBeInTheDocument();
    });
  });

  it('renders supporting and challenging evidence', async () => {
    const mockViewModel: AiExplanationViewModel = {
      kind: 'SUCCESS',
      requestId: 'test-req-evidence',
      task: 'CAREER_ANALYSIS',
      status: 'SUCCESS',
      conclusion: 'Balanced career analysis.',
      supportingEvidence: [
        {
          evidence: {
            id: 'E-CAREER-001',
            dimension: 'NATAL_STRUCTURE',
            source: 'PLANET',
            statement: 'Saturn placed favorably in 10th house.',
            strength: 'STRONG',
            effect: 'SUPPORT',
            priority: 'PRIMARY'
          },
          role: 'SUPPORTING'
        }
      ],
      challengingEvidence: [
        {
          evidence: {
            id: 'E-CAREER-002',
            dimension: 'MODIFIER',
            source: 'HOUSE',
            statement: 'Rahu aspect introduces sudden career shifts.',
            strength: 'MODERATE',
            effect: 'CHALLENGE'
          },
          role: 'CHALLENGING'
        }
      ],
      unresolvedQuestions: ['Is D10 transit timing confirmed?'],
      warnings: ['Combust Mercury may alter timing accuracy.'],
      triggeredRuleIds: ['RULE-001', 'RULE-002'],
      providerId: 'local-vedic-rules',
      providerName: 'Local Vedic Rules Provider',
      providerKind: 'LOCAL_RULES',
      routingMode: 'LOCAL_ONLY',
      fallbackUsed: false,
      selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
      generatedAt: '2026-01-01T00:00:00.000Z'
    };

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce(mockViewModel);

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
      expect(screen.getByText('E-CAREER-001')).toBeInTheDocument();
      expect(
        screen.getByText('Saturn placed favorably in 10th house.')
      ).toBeInTheDocument();

      expect(screen.getByText('Challenging Evidence')).toBeInTheDocument();
      expect(screen.getByText('E-CAREER-002')).toBeInTheDocument();
      expect(
        screen.getByText('Rahu aspect introduces sudden career shifts.')
      ).toBeInTheDocument();

      expect(screen.getByText('Unresolved Questions')).toBeInTheDocument();
      expect(
        screen.getByText('Is D10 transit timing confirmed?')
      ).toBeInTheDocument();

      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(
        screen.getByText('Combust Mercury may alter timing accuracy.')
      ).toBeInTheDocument();
    });
  });

  it('resets result when canonical analysis changes', async () => {
    const mockViewModel: AiExplanationViewModel = {
      kind: 'SUCCESS',
      requestId: 'test-req-reset',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Chart A explanation',
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
    };

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce(mockViewModel);

    const { rerender } = render(
      <AiExplanationPanel
        analysisId="analysis-chart-a"
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Chart A explanation')).toBeInTheDocument();
    });

    rerender(
      <AiExplanationPanel
        analysisId="analysis-chart-b"
        horoscope={chartBHoroscope}
        career={chartBCareer}
        wealth={chartBWealth}
        lifeAnalysis={chartBLifeAnalysis}
        temporalState={chartBTemporalState}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Chart A explanation')).not.toBeInTheDocument();
    });
  });

  it('resets result when latitude/longitude location coordinates change', async () => {
    const mockViewModel: AiExplanationViewModel = {
      kind: 'SUCCESS',
      requestId: 'test-req-loc-reset',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Bangalore explanation',
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
    };

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce(mockViewModel);

    const { rerender } = render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Bangalore explanation')).toBeInTheDocument();
    });

    // Change location coordinates (e.g. Bangalore -> Delhi)
    const newLocationDetails: BirthDetails = {
      ...birthDetails,
      latitude: 28.6139,
      longitude: 77.209
    };
    const newLocationHoroscope = calculateHoroscope(newLocationDetails);
    const newLocationContext = createAnalysisContext({ asOf: newLocationDetails.dateTimeStr });
    const newLocationTemporalState: AnalysisTemporalState = resolveAnalysisTemporalState(
      newLocationHoroscope,
      newLocationContext
    );
    const newLocationCareer: DomainInterpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({
        domain: 'CAREER',
        strength: 'STRONG',
        statement: 'Delhi Career'
      }),
      asOf: newLocationDetails.dateTimeStr,
      generatedAt: '2026-01-01T00:00:00.000Z'
    });
    const newLocationWealth: DomainInterpretation = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({
        domain: 'WEALTH',
        strength: 'STRONG',
        statement: 'Delhi Wealth'
      }),
      asOf: newLocationDetails.dateTimeStr,
      generatedAt: '2026-01-01T00:00:00.000Z'
    });
    const newLocationLifeAnalysis: LifeAnalysis = buildLifeAnalysis([
      newLocationCareer,
      newLocationWealth
    ]);

    rerender(
      <AiExplanationPanel
        horoscope={newLocationHoroscope}
        career={newLocationCareer}
        wealth={newLocationWealth}
        lifeAnalysis={newLocationLifeAnalysis}
        temporalState={newLocationTemporalState}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Bangalore explanation')).not.toBeInTheDocument();
    });
  });

  it('prevents stale in-flight async results from overwriting a newly selected chart', async () => {
    let resolveFirstRequest!: (value: AiExplanationViewModel) => void;
    const firstRequestPromise = new Promise<AiExplanationViewModel>((resolve) => {
      resolveFirstRequest = resolve;
    });

    vi.mocked(aiModule.runAiExplanation).mockImplementationOnce(
      () => firstRequestPromise
    );

    const { rerender } = render(
      <AiExplanationPanel
        analysisId="analysis-chart-a"
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    // Request is in-flight (loading state active)
    expect(
      screen.getByRole('button', { name: /generating explanation/i })
    ).toBeInTheDocument();

    // User switches to Chart B before Request A resolves, passing full Chart B artifact set
    rerender(
      <AiExplanationPanel
        analysisId="analysis-chart-b"
        horoscope={chartBHoroscope}
        career={chartBCareer}
        wealth={chartBWealth}
        lifeAnalysis={chartBLifeAnalysis}
        temporalState={chartBTemporalState}
      />
    );

    // Loading should be cleared and button back to Generate Explanation
    expect(
      screen.queryByRole('button', { name: /generating explanation/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate explanation/i })
    ).toBeInTheDocument();

    // Now first request finishes
    resolveFirstRequest({
      kind: 'SUCCESS',
      requestId: 'stale-req-chart-a',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Stale Chart A explanation that should be ignored',
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
    });

    // Wait a tick and verify Chart A's stale result did NOT get rendered onto Chart B
    await new Promise((r) => setTimeout(r, 50));
    expect(
      screen.queryByText('Stale Chart A explanation that should be ignored')
    ).not.toBeInTheDocument();
  });

  it('invalidates in-flight request when canonical analysis (analysisId) changes with the same horoscope and asOf', async () => {
    let resolveFirstRequest!: (value: AiExplanationViewModel) => void;
    const firstRequestPromise = new Promise<AiExplanationViewModel>((resolve) => {
      resolveFirstRequest = resolve;
    });

    vi.mocked(aiModule.runAiExplanation).mockImplementationOnce(
      () => firstRequestPromise
    );

    const { rerender } = render(
      <AiExplanationPanel
        analysisId="canonical-analysis-v1"
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    expect(
      screen.getByRole('button', { name: /generating explanation/i })
    ).toBeInTheDocument();

    // Canonical analysis identity changes, even with identical horoscope and asOf
    rerender(
      <AiExplanationPanel
        analysisId="canonical-analysis-v2"
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    expect(
      screen.queryByRole('button', { name: /generating explanation/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate explanation/i })
    ).toBeInTheDocument();

    resolveFirstRequest({
      kind: 'SUCCESS',
      requestId: 'stale-req-analysis-v1',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Stale canonical analysis v1 conclusion',
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
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(
      screen.queryByText('Stale canonical analysis v1 conclusion')
    ).not.toBeInTheDocument();
  });

  it('regression: does not recompute deterministic pipeline (no resolveAnalysisTemporalState, interpretCareerV2, interpretWealthV2, buildLifeAnalysis calls)', async () => {
    const temporalSpy = vi.spyOn(temporalModule, 'resolveAnalysisTemporalState');
    const careerSpy = vi.spyOn(careerModule, 'interpretCareerV2');
    const wealthSpy = vi.spyOn(wealthModule, 'interpretWealthV2');
    const synthesisSpy = vi.spyOn(synthesisModule, 'buildLifeAnalysis');

    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce({
      kind: 'SUCCESS',
      requestId: 'test-no-recompute',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'No recompute explanation',
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
    });

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(aiModule.runAiExplanation).toHaveBeenCalledTimes(1);
    });

    expect(temporalSpy).not.toHaveBeenCalled();
    expect(careerSpy).not.toHaveBeenCalled();
    expect(wealthSpy).not.toHaveBeenCalled();
    expect(synthesisSpy).not.toHaveBeenCalled();
  });

  it('regression: preserves object identity when passing canonical artifacts to runAiExplanation', async () => {
    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce({
      kind: 'SUCCESS',
      requestId: 'test-identity',
      task: 'CHART_SYNTHESIS',
      status: 'SUCCESS',
      conclusion: 'Identity preserved',
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
    });

    render(
      <AiExplanationPanel
        horoscope={horoscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={mockTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(aiModule.runAiExplanation).toHaveBeenCalledTimes(1);
    });

    const callArgs = vi.mocked(aiModule.runAiExplanation).mock.calls[0][0];
    expect(callArgs.temporalState).toBe(mockTemporalState);
    expect(callArgs.domainInterpretations[0]).toBe(mockCareer);
    expect(callArgs.domainInterpretations[1]).toBe(mockWealth);
    expect(callArgs.lifeAnalysis).toBe(mockLifeAnalysis);
  });

  it('regression: stale-dasha uses passed canonical temporalState dasha rather than falling back to stale horoscope dasha', async () => {
    vi.mocked(aiModule.runAiExplanation).mockResolvedValueOnce({
      kind: 'SUCCESS',
      requestId: 'test-stale-dasha',
      task: 'DASHA_ANALYSIS',
      status: 'SUCCESS',
      conclusion: 'Jupiter Dasha explanation',
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
    });

    // Horoscope with dasha computed for a distinct date (2000-01-01)
    const testHoroscope: Horoscope = {
      ...horoscope,
      dashaInterpretation: resolveDashaInterpretationForAsOf(horoscope, new Date('2000-01-01T00:00:00Z'))
    };

    // Canonical temporalState computed for current asOf (2026-01-01)
    const testTemporalState: AnalysisTemporalState = resolveAnalysisTemporalState(
      horoscope,
      createAnalysisContext({ asOf: '2026-01-01T00:00:00Z' })
    );

    render(
      <AiExplanationPanel
        horoscope={testHoroscope}
        career={mockCareer}
        wealth={mockWealth}
        lifeAnalysis={mockLifeAnalysis}
        temporalState={testTemporalState}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(aiModule.runAiExplanation).toHaveBeenCalledTimes(1);
    });

    const callArgs = vi.mocked(aiModule.runAiExplanation).mock.calls[0][0];
    expect(callArgs.temporalState.dashaInterpretation).toBe(testTemporalState.dashaInterpretation);
    expect(callArgs.temporalState.dashaInterpretation).not.toBe(testHoroscope.dashaInterpretation);
  });
});
