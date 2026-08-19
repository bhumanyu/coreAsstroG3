import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiExplanationPanel } from './AiExplanationPanel';
import * as aiModule from '../../ai';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import type { BirthDetails, Horoscope } from '../../types';
import type { AiExplanationViewModel, AiExplanationErrorViewModel } from '../../ai';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state with task options and generate button', () => {
    render(
      <AiExplanationPanel
        horoscope={horoscope}
        birthDetails={birthDetails}
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
        birthDetails={birthDetails}
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
        birthDetails={birthDetails}
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
        birthDetails={birthDetails}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    expect(screen.getByText(/generating explanation…/i)).toBeInTheDocument();
    expect(generateBtn).toBeDisabled();

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
        birthDetails={birthDetails}
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
        birthDetails={birthDetails}
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

  it('resets result when birth details (chartKey) change', async () => {
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
        horoscope={horoscope}
        birthDetails={birthDetails}
      />
    );

    const generateBtn = screen.getByRole('button', {
      name: /generate explanation/i
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Chart A explanation')).toBeInTheDocument();
    });

    const newBirthDetails: BirthDetails = {
      ...birthDetails,
      dateTimeStr: '2020-05-15T12:00:00Z'
    };
    const newHoroscope = calculateHoroscope(newBirthDetails);

    rerender(
      <AiExplanationPanel
        horoscope={newHoroscope}
        birthDetails={newBirthDetails}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Chart A explanation')).not.toBeInTheDocument();
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
        horoscope={horoscope}
        birthDetails={birthDetails}
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

    // User switches to Chart B before Request A resolves
    const chartBDetails: BirthDetails = {
      ...birthDetails,
      dateTimeStr: '2021-08-20T10:30:00Z'
    };
    const chartBHoroscope = calculateHoroscope(chartBDetails);

    rerender(
      <AiExplanationPanel
        horoscope={chartBHoroscope}
        birthDetails={chartBDetails}
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
});
