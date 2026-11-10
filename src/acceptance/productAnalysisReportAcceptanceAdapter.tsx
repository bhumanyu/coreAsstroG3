import React from 'react';
import type { ReactElement } from 'react';
import type { ProductAnalysis } from '../product/analysis/productAnalysisTypes';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import { selectDashaViewModel } from '../product/analysis/dashaViewModel';
import { ProductAnalysisReportView } from '../components/fullNatalReport/ProductAnalysisReportView';
import { ProductAnalysisReportBoundary } from '../components/fullNatalReport/ProductAnalysisReportBoundary';

export interface ProductAnalysisReportAcceptanceProjection {
  readonly analysisId: string;
  readonly asOf: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly career: {
    readonly status: string;
    readonly confidence: string;
    readonly promiseStrength: string;
    readonly professionStatus: string;
    readonly d10Relationship: string;
    readonly conclusion: string;
  };
  readonly wealth: {
    readonly status: string;
    readonly confidence: string;
    readonly promise: string;
    readonly d2Relationship: string;
    readonly lifecycleStatus: string;
    readonly dimensions: readonly { readonly id: string; readonly status: string; readonly statement?: string }[];
  };
  readonly dasha: {
    readonly status: string;
    readonly currentPeriodLabel: string;
    readonly selectedPeriodStatus: string;
  };
  readonly aiStatus: string;
  readonly warningsCount: number;
}

export interface ProductAnalysisReportAcceptanceAdapter {
  readonly view: ReactElement;
  readonly expected?: ProductAnalysisReportAcceptanceProjection;
}

export function createProductAnalysisReportAcceptanceAdapter(
  analysis: ProductAnalysis | undefined
): ProductAnalysisReportAcceptanceAdapter {
  if (!analysis) {
    return {
      view: (
        <ProductAnalysisReportBoundary resetKey="UNAVAILABLE">
          <ProductAnalysisReportView />
        </ProductAnalysisReportBoundary>
      )
    };
  }

  const career = selectCareerViewModel(analysis);
  const wealth = selectWealthViewModel(analysis);
  const dasha = selectDashaViewModel(analysis);

  return {
    view: (
      <ProductAnalysisReportBoundary resetKey={analysis.analysisId}>
        <ProductAnalysisReportView analysis={analysis} status="READY" />
      </ProductAnalysisReportBoundary>
    ),
    expected: {
      analysisId: analysis.analysisId,
      asOf: analysis.asOf,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion,
      career: {
        status: analysis.career.status ?? analysis.status,
        confidence: String(career.conclusion.confidence),
        promiseStrength: String(career.promise.strength),
        professionStatus: String(career.profession.status),
        d10Relationship: String(career.d10.relationship),
        conclusion: career.conclusion.statement ?? career.promise.statement ?? ''
      },
      wealth: {
        status: String(analysis.wealth.overall.status),
        confidence: String(wealth.conclusion.confidence),
        promise: String(analysis.wealth.overall.promise),
        d2Relationship: String(analysis.wealth.d2.relationship),
        lifecycleStatus: String(wealth.lifecycle?.status ?? 'UNAVAILABLE'),
        dimensions: (['accumulation', 'gains', 'fortune', 'speculation'] as const).map(id => ({
          id,
          status: String(analysis.wealth.dimensions[id].status),
          statement: analysis.wealth.dimensions[id].statement
        }))
      },
      dasha: {
        status: String(dasha.status),
        currentPeriodLabel: String(dasha.hero.currentPeriodLabel),
        selectedPeriodStatus: analysis.selectedPeriod?.status ?? 'NOT_SELECTED'
      },
      aiStatus: String(analysis.ai.status),
      warningsCount: analysis.warnings.length
    }
  };
}
