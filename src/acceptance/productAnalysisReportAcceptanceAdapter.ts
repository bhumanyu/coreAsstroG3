import React, { type ReactElement } from 'react';
import type { ProductAnalysis } from '../product/analysis/productAnalysisTypes';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import { selectDashaViewModel } from '../product/analysis/dashaViewModel';
import { ProductAnalysisReportView } from '../components/fullNatalReport/ProductAnalysisReportView';

export interface ProductAnalysisReportExpectedProjection {
  readonly analysisId: string;
  readonly analysisStatus: string;
  readonly asOf: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly career: {
    readonly status: string;
    readonly confidence: string;
    readonly promiseStrength: string;
    readonly conclusion: string;
    readonly professionStatus: string;
    readonly d10Relationship: string;
    readonly evidenceIds: readonly string[];
  };
  readonly wealth: {
    readonly status: string;
    readonly confidence: string;
    readonly promise: string;
    readonly d2Relationship: string;
    readonly lifecycleStatus: string;
    readonly dimensions: readonly { readonly id: string; readonly status: string; readonly statement?: string }[];
    readonly evidenceIds: readonly string[];
  };
  readonly dasha: {
    readonly status: string;
    readonly currentPeriodLabel: string;
    readonly selectedPeriodStatus: string;
  };
  readonly warningsCount: number;
  readonly aiStatus: string;
}

export interface ProductAnalysisReportAcceptanceResult {
  readonly view: ReactElement;
  readonly expected?: ProductAnalysisReportExpectedProjection;
}

/**
 * Acceptance adapter for the real production report component.
 * The adapter reads the canonical ProductAnalysis and renders the actual view;
 * it does not calculate astrology or reconstruct domain conclusions.
 */
export function createProductAnalysisReportAcceptanceAdapter(
  analysis?: ProductAnalysis
): ProductAnalysisReportAcceptanceResult {
  if (!analysis) {
    return { view: React.createElement(ProductAnalysisReportView, { status: 'READY' }) };
  }

  const career = selectCareerViewModel(analysis);
  const wealth = selectWealthViewModel(analysis);
  const dasha = selectDashaViewModel(analysis);

  return {
    view: React.createElement(ProductAnalysisReportView, { analysis, status: 'READY' }),
    expected: {
      analysisId: analysis.analysisId,
      analysisStatus: analysis.status,
      asOf: analysis.asOf,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion,
      career: {
        status: analysis.career.status ?? analysis.status,
        confidence: career.conclusion.confidence,
        promiseStrength: career.promise.strength,
        conclusion: career.conclusion.statement ?? career.promise.statement ?? 'Not available',
        professionStatus: career.profession.status,
        d10Relationship: career.d10.relationship,
        evidenceIds: career.evidence.map(item => item.id)
      },
      wealth: {
        status: analysis.wealth.overall.status,
        confidence: wealth.conclusion.confidence,
        promise: analysis.wealth.overall.promise,
        d2Relationship: analysis.wealth.d2.relationship,
        lifecycleStatus: wealth.lifecycle?.status ?? 'UNAVAILABLE',
        dimensions: (['accumulation', 'gains', 'fortune', 'speculation'] as const).map(id => ({
          id,
          status: analysis.wealth.dimensions[id].status,
          statement: analysis.wealth.dimensions[id].statement
        })),
        evidenceIds: wealth.evidence.map(item => item.id)
      },
      dasha: {
        status: dasha.status,
        currentPeriodLabel: dasha.hero.currentPeriodLabel,
        selectedPeriodStatus: analysis.selectedPeriod?.status ?? 'NOT_SELECTED'
      },
      warningsCount: analysis.warnings.length,
      aiStatus: analysis.ai.status
    }
  };
}
