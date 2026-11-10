import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProductAnalysis } from '../product/analysis/productAnalysisTypes';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';
import { createProductAnalysisReportAcceptanceAdapter } from './productAnalysisReportAcceptanceAdapter';
import { ProductAnalysisReportBoundary } from '../components/fullNatalReport/ProductAnalysisReportBoundary';

describe('ProductAnalysisReportAcceptanceAdapter', () => {
  it('renders the real report and preserves canonical Career, Wealth, Dasha and provenance outputs', () => {
    const analysis = createProductAnalysis();
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    expect(expected).toBeDefined();
    render(view);

    const career = screen.getByRole('region', { name: 'Career — C11 conclusion' });
    const wealth = screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' });
    const dasha = screen.getByRole('region', { name: 'Vimshottari Dasha and selected period' });
    const evidence = screen.getByRole('region', { name: 'Evidence, warnings and reproducibility' });

    expect(screen.getByText(expected!.analysisId)).toBeInTheDocument();
    expect(screen.getAllByText(expected!.asOf).length).toBeGreaterThan(0);
    expect(screen.getByText(expected!.engineVersion + ' / ' + expected!.rulesVersion)).toBeInTheDocument();
    expect(career).toHaveTextContent(expected!.career.status);
    expect(career).toHaveTextContent(expected!.career.confidence);
    expect(career).toHaveTextContent(expected!.career.promiseStrength);
    expect(career).toHaveTextContent(expected!.career.professionStatus);
    expect(career).toHaveTextContent(expected!.career.d10Relationship);
    expect(career).toHaveTextContent(expected!.career.conclusion);
    expect(wealth).toHaveTextContent(expected!.wealth.status);
    expect(wealth).toHaveTextContent(expected!.wealth.confidence);
    expect(wealth).toHaveTextContent(expected!.wealth.promise);
    expect(wealth).toHaveTextContent(expected!.wealth.d2Relationship);
    expect(wealth).toHaveTextContent(expected!.wealth.lifecycleStatus);
    for (const dimension of expected!.wealth.dimensions) {
      expect(wealth).toHaveTextContent(dimension.id);
      expect(wealth).toHaveTextContent(dimension.status);
      if (dimension.statement) expect(wealth).toHaveTextContent(dimension.statement);
    }
    expect(dasha).toHaveTextContent(expected!.dasha.status);
    expect(dasha).toHaveTextContent(expected!.dasha.currentPeriodLabel);
    expect(evidence).toHaveTextContent(expected!.aiStatus);
    expect(evidence).toHaveTextContent(expected!.warningsCount.toString());
  });

  it('preserves Career available while Wealth is unavailable', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      status: 'PARTIAL' as const,
      career: { ...base.career, status: 'READY' },
      wealth: { ...base.wealth, overall: { ...base.wealth.overall, status: 'UNAVAILABLE' as const } }
    } as ProductAnalysis;
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    render(view);

    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toHaveTextContent(expected!.career.status);
    expect(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toHaveTextContent('UNAVAILABLE');
  });

  it('preserves Wealth available while Career is unavailable', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      status: 'PARTIAL' as const,
      career: { ...base.career, status: 'UNAVAILABLE' as const },
      wealth: { ...base.wealth, overall: { ...base.wealth.overall, status: 'SUPPORTED' as const } }
    } as ProductAnalysis;
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    render(view);

    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toHaveTextContent('UNAVAILABLE');
    expect(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toHaveTextContent(expected!.wealth.status);
  });

  it('preserves partial domains and unavailable D2 rather than upgrading them', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      status: 'PARTIAL' as const,
      career: { ...base.career, status: 'UNAVAILABLE' as const },
      wealth: {
        ...base.wealth,
        overall: { ...base.wealth.overall, status: 'PARTIAL' as const },
        d2: { relationship: 'UNAVAILABLE' as const, statement: 'D2 remains unavailable pending independent validation.' }
      }
    } as ProductAnalysis;
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    render(view);

    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toHaveTextContent('UNAVAILABLE');
    const wealth = screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' });
    expect(wealth).toHaveTextContent('PARTIAL');
    expect(wealth).toHaveTextContent('UNAVAILABLE');
    expect(wealth).toHaveTextContent('D2 remains unavailable pending independent validation.');
    expect(expected!.wealth.d2Relationship).toBe('UNAVAILABLE');
  });

  it('preserves a valid selected MD–AD status and interval in the real report', () => {
    const base = createProductAnalysis();
    const selectedPeriod = {
      status: 'OK' as const,
      synthesis: {
        synthesisVersion: 'PBA-06-v1',
        period: {
          selectedPeriodId: 'period-acceptance',
          mahadashaId: 'md_jupiter',
          mahadashaPlanet: 'Jupiter',
          antardashaId: 'ad_saturn',
          antardashaPlanet: 'Saturn',
          interval: { start: '2026-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
          analysisAsOf: '2026-01-15T08:30:00.000Z',
          temporalRelation: 'CURRENT'
        },
        natalBaseline: {},
        career: { qualificationBasis: 'UNAVAILABLE', expressions: [], diagnostics: [] },
        wealth: {
          dimensions: {
            ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'PARTIAL', linkedLevels: ['MD'], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], linkageTrace: [], insufficientReason: 'LINKED' },
            GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], linkageTrace: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
            FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], linkageTrace: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
            SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], linkageTrace: [], insufficientReason: 'NO_PROMISE_EVIDENCE' }
          },
          diagnostics: []
        },
        evidence: [],
        missingInputs: [],
        provenance: {
          career: { status: 'MISSING' },
          wealth: { status: 'MISSING' }
        },
        qualificationStatus: 'UNAVAILABLE',
        aiExplanationStatus: 'NOT_REQUESTED'
      }
    }
    const analysis = { ...base, selectedPeriod } as ProductAnalysis;
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    render(view);

    const dasha = screen.getByRole('region', { name: 'Vimshottari Dasha and selected period' });
    expect(dasha).toHaveTextContent('md_jupiter / ad_saturn');
    expect(dasha).toHaveTextContent('2026-01-01T00:00:00Z — 2027-01-01T00:00:00Z');
    expect(dasha).toHaveTextContent('CURRENT');
    expect(expected!.dasha.selectedPeriodStatus).toBe('OK');
  });

  it('keeps deterministic conclusions visible when AI explanation is unavailable', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      ai: { ...base.ai, status: 'UNAVAILABLE' as const }
    } as ProductAnalysis;
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(analysis);
    render(view);

    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Evidence, warnings and reproducibility' })).toHaveTextContent(expected!.aiStatus);
  });

  it('does not reconstruct a report when canonical ProductAnalysis is missing', () => {
    const { view, expected } = createProductAnalysisReportAcceptanceAdapter(undefined);
    expect(expected).toBeUndefined();
    render(view);
    expect(screen.getByText(/no canonical ProductAnalysis snapshot is attached/i)).toBeInTheDocument();
  });
  it('isolates report-render errors and retries the existing snapshot without rerunning analysis', () => {
    let shouldThrow = true;
    const UnstableReport = () => {
      if (shouldThrow) {
        shouldThrow = false;
        throw new Error('renderer failed');
      }
      return <div>Recovered report for the same analysis</div>;
    };
    const analysisRetry = vi.fn();
    render(
      <ProductAnalysisReportBoundary resetKey="analysis-1">
        <UnstableReport />
      </ProductAnalysisReportBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('renderer failed');
    expect(screen.getByRole('alert')).toHaveTextContent('canonical chart analysis has been preserved');
    fireEvent.click(screen.getByRole('button', { name: 'Retry report' }));

    expect(screen.getByText('Recovered report for the same analysis')).toBeInTheDocument();
    expect(analysisRetry).not.toHaveBeenCalled();
  });

  it('clears an earlier report-render error when the canonical analysis identity changes', () => {
    let shouldThrow = true;
    const UnstableReport = () => {
      if (shouldThrow) {
        shouldThrow = false;
        throw new Error('chart A renderer failed');
      }
      return <div>Chart B report</div>;
    };
    const { rerender } = render(
      <ProductAnalysisReportBoundary resetKey="chart-a">
        <UnstableReport />
      </ProductAnalysisReportBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('chart A renderer failed');

    rerender(
      <ProductAnalysisReportBoundary resetKey="chart-b">
        <UnstableReport />
      </ProductAnalysisReportBoundary>
    );
    expect(screen.getByText('Chart B report')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

});
