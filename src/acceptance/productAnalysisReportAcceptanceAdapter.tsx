import React from 'react';
import { render, screen, within, type RenderResult } from '@testing-library/react';
import type { ProductAnalysis } from '../product/analysis/productAnalysisTypes';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import { selectDashaViewModel } from '../product/analysis/dashaViewModel';
import { ProductAnalysisReportView } from '../components/fullNatalReport/ProductAnalysisReportView';
import { ProductAnalysisReportBoundary } from '../components/fullNatalReport/ProductAnalysisReportBoundary';

export interface CanonicalReportAcceptanceProjection {
  readonly analysisId: string;
  readonly analysisStatus: string;
  readonly careerStatus: string;
  readonly careerConfidence: string;
  readonly careerStatement?: string;
  readonly wealthStatus: string;
  readonly wealthConfidence: string;
  readonly wealthStatement?: string;
  readonly dashaStatus: string;
  readonly selectedPeriodStatus: string;
  readonly careerEvidenceIds: readonly string[];
  readonly wealthEvidenceIds: readonly string[];
  readonly aiStatus: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
}

export function projectCanonicalReportAcceptance(analysis: ProductAnalysis): CanonicalReportAcceptanceProjection {
  const career = selectCareerViewModel(analysis);
  const wealth = selectWealthViewModel(analysis);
  const dasha = selectDashaViewModel(analysis);
  return {
    analysisId: analysis.analysisId,
    analysisStatus: analysis.status,
    careerStatus: analysis.career.status ?? analysis.status,
    careerConfidence: String(career.conclusion.confidence),
    careerStatement: career.conclusion.statement ?? career.promise.statement,
    wealthStatus: analysis.wealth.overall.status,
    wealthConfidence: String(wealth.conclusion.confidence),
    wealthStatement: wealth.conclusion.statement ?? wealth.overall.statement,
    dashaStatus: String(dasha.status),
    selectedPeriodStatus: analysis.selectedPeriod?.status ?? 'NOT_SELECTED',
    careerEvidenceIds: analysis.career.evidence.map(item => item.id),
    wealthEvidenceIds: analysis.wealth.evidence.map(item => item.id),
    aiStatus: analysis.ai.status,
    engineVersion: analysis.engineVersion,
    rulesVersion: analysis.rulesVersion
  };
}

export interface ProductAnalysisReportAcceptanceRender extends RenderResult {
  readRenderedSections(): {
    readonly career: string;
    readonly wealth: string;
    readonly dasha: string;
    readonly provenance: string;
  };
}

export function renderProductAnalysisReportAcceptance(
  analysis: ProductAnalysis,
  options: { readonly onRetryAnalysis?: () => void } = {}
): ProductAnalysisReportAcceptanceRender {
  const rendered = render(
    <ProductAnalysisReportBoundary resetKey={analysis.analysisId}>
      <ProductAnalysisReportView analysis={analysis} status="READY" onRetry={options.onRetryAnalysis} />
    </ProductAnalysisReportBoundary>
  );
  return Object.assign(rendered, {
    readRenderedSections: () => ({
      career: within(screen.getByRole('region', { name: 'Career — C11 conclusion' })).container.textContent ?? '',
      wealth: within(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).container.textContent ?? '',
      dasha: within(screen.getByRole('region', { name: 'Vimshottari Dasha and selected period' })).container.textContent ?? '',
      provenance: within(screen.getByRole('region', { name: 'Evidence, warnings and reproducibility' })).container.textContent ?? ''
    })
  });
}
