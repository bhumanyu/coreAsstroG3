import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import type { ProductSelectedPeriodResult } from '../../product/analysis/productAnalysisTypes';
import { buildChartExport, buildExportedChartFacts, buildExportedInterpretation } from './chartExportMapper';

const period: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
  status: 'OK',
  synthesis: {
    synthesisVersion: 'PBA-06-v1',
    period: {
      selectedPeriodId: 'md_jupiter:ad_saturn',
      mahadashaId: 'md_jupiter',
      mahadashaPlanet: 'Jupiter',
      antardashaId: 'ad_saturn',
      antardashaPlanet: 'Saturn',
      interval: { start: '2026-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
      analysisAsOf: '2026-01-15T08:30:00.000Z',
      temporalRelation: 'CURRENT'
    },
    natalBaseline: {},
    career: { qualificationBasis: 'CANONICAL_STATUS', expressions: [], diagnostics: [] },
    wealth: {
      dimensions: {
        ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' }
      },
      diagnostics: []
    },
    evidence: [],
    missingInputs: [],
    provenance: {
      career: { status: 'PRESENT' },
      wealth: { status: 'PRESENT' }
    },
    qualificationStatus: 'CANONICAL',
    aiExplanationStatus: 'NOT_REQUESTED'
  }
};

describe('chart export projection', () => {
  it('uses the passed aggregate provenance and selected period IDs exactly', () => {
    const analysis = createProductAnalysis({
      engineVersion: 'REAL_ENGINE_7',
      rulesVersion: 'REAL_RULES_5',
      selectedPeriod: period
    });
    const output = buildChartExport({ analysis, selectedPeriod: period }, '2026-10-26T00:00:00Z');
    expect(output.provenance).toMatchObject({
      analysisId: analysis.analysisId,
      asOf: analysis.asOf,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion
    });
    expect(output.selectedPeriod).toMatchObject({
      status: 'AVAILABLE',
      value: { mahadashaId: 'md_jupiter', antardashaId: 'ad_saturn', analysisAsOf: analysis.asOf }
    });
  });

  it('projects birth inputs without names or place and preserves missing result states', () => {
    const baseAnalysis = createProductAnalysis({ status: 'PARTIAL' });
    const analysis = { ...baseAnalysis, chart: { isAvailable: true, ascendantSign: 'Capricorn' } };
    const exported = buildChartExport({ analysis }, '2026-10-26T00:00:00Z');
    expect(exported.birth).toEqual({
      dateTime: analysis.birth.dateTime,
      timezone: analysis.birth.timezone,
      latitude: analysis.birth.latitude,
      longitude: analysis.birth.longitude,
      ayanamsa: analysis.birth.ayanamsa
    });
    expect(JSON.stringify(exported)).not.toContain('Test Chart');
    expect(JSON.stringify(exported)).not.toContain('New Delhi');
    expect(exported.chartFacts.status).toBe('PARTIAL');
    expect(exported.selectedPeriod.status).toBe('UNAVAILABLE');
    expect(buildExportedChartFacts(createProductAnalysis({ chart: { isAvailable: false } })).status).toBe('UNAVAILABLE');
    expect(buildExportedInterpretation(createProductAnalysis({ status: 'ERROR' }))).toMatchObject({ status: 'UNAVAILABLE' });
  });

  it('refuses a selected period whose asOf does not belong to the supplied analysis', () => {
    const otherPeriod: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
      ...period,
      synthesis: {
        ...period.synthesis,
        period: { ...period.synthesis.period, analysisAsOf: '2025-01-01T00:00:00Z' }
      }
    };
    expect(() => buildChartExport({ analysis: createProductAnalysis(), selectedPeriod: otherPeriod }, '2026-10-26T00:00:00Z'))
      .toThrow(/does not match/);
  });
});
