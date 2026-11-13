import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { CareerPage } from '../CareerPage';
import { OverviewPage } from '../OverviewPage';
import { ReasoningPage } from '../ReasoningPage';
import { WealthPage } from '../WealthPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

const baseAnalysis = createProductAnalysis();
const assessmentAnalysis = createProductAnalysis({
  career: {
    ...baseAnalysis.career,
    synthesis: {
      ...baseAnalysis.career.synthesis,
      finalStatus: 'MIXED',
      finalDirection: 'MIXED',
      natalDirection: 'MIXED',
      natalStrength: 'STRONG',
      dashaDirection: 'NEUTRAL',
      timingStatus: 'NOT_ACTIVE',
      confidence: 'MEDIUM'
    }
  },
  wealth: {
    ...baseAnalysis.wealth,
    synthesis: {
      ...baseAnalysis.wealth.synthesis,
      overallStatus: 'MIXED',
      promiseStatus: 'MIXED',
      dashaDirection: 'NEUTRAL',
      timingStatus: 'NEUTRAL',
      confidence: 'MEDIUM'
    }
  }
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('user-facing assessment localization at page boundaries', () => {
  it('updates Overview assessment copy while retaining canonical values and evidence prose', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<OverviewPage analysis={assessmentAnalysis} status="READY" />);

    expect(screen.getAllByText('Strong foundation with mixed indications').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No clear activation identified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getAllByText('मजबूत आधार के साथ मिश्रित संकेत').length).toBeGreaterThan(0);
      expect(screen.getAllByText('कोई स्पष्ट सक्रियता नहीं मिली').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Strong foundation with mixed indications')).not.toBeInTheDocument();
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);
    expect(assessmentAnalysis.career.synthesis?.natalDirection).toBe('MIXED');
  });

  it('updates Career conclusion copy while leaving the domain statement unchanged', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getByText(/Strong foundation with mixed indications/)).toBeInTheDocument();
    expect(screen.getByText('High vocational promise across 10th lord and Lagna.')).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getByText(/मजबूत आधार के साथ मिश्रित संकेत/)).toBeInTheDocument();
    });
    expect(screen.getByText('High vocational promise across 10th lord and Lagna.')).toBeInTheDocument();
    expect(assessmentAnalysis.career.synthesis?.natalDirection).toBe('MIXED');
  });

  it('updates Wealth conclusion copy while leaving evidence prose unchanged', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getByText(/Mixed outlook/)).toBeInTheDocument();
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getByText(/मिश्रित संकेत\. मिश्रित आधार/)).toBeInTheDocument();
    });
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);
    expect(assessmentAnalysis.wealth.synthesis?.promiseStatus).toBe('MIXED');
  });

  it('localizes reasoning conclusions without translating domain-generated prose', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<ReasoningPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getAllByText(/Strong foundation with mixed indications/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jupiter in Cancer in 7th house').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getAllByText(/मजबूत आधार के साथ मिश्रित संकेत/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Jupiter in Cancer in 7th house').length).toBeGreaterThan(0);
  });

  it('localizes the safe not-assessed fallback', async () => {
    const analysisWithoutSynthesis = createProductAnalysis({
      career: { ...baseAnalysis.career, synthesis: undefined },
      wealth: { ...baseAnalysis.wealth, synthesis: undefined }
    });
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    const { rerender } = render(<OverviewPage analysis={analysisWithoutSynthesis} status="READY" />);

    expect(screen.getAllByText('Not assessed').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    rerender(<OverviewPage analysis={analysisWithoutSynthesis} status="READY" />);

    await waitFor(() => {
      expect(screen.getAllByText('आकलन नहीं किया गया').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument();
  });
});
