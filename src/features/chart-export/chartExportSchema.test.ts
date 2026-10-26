import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { buildChartExport } from './chartExportMapper';
import { validateChartExport } from './chartExportSchema';

describe('ChartExportV1 runtime schema', () => {
  it('validates a formatted JSON round trip', () => {
    const exported = buildChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00.000Z');
    const parsed: unknown = JSON.parse(JSON.stringify(exported, null, 2));
    expect(validateChartExport(parsed)).toEqual({ ok: true, value: exported });
  });

  it('preserves PARTIAL and UNAVAILABLE instead of turning missing results into conclusions', () => {
    const analysis = createProductAnalysis({
      status: 'PARTIAL',
      chart: { isAvailable: false },
      career: { ...createProductAnalysis().career, status: 'UNAVAILABLE' },
      wealth: { ...createProductAnalysis().wealth, overall: { ...createProductAnalysis().wealth.overall, status: 'UNAVAILABLE' } }
    });
    const output = buildChartExport({ analysis }, new Date('2026-10-26T00:00:00Z'));
    expect(output.chartFacts.status).toBe('UNAVAILABLE');
    expect(output.interpretation.status).toBe('PARTIAL');
    if (output.interpretation.status === 'PARTIAL') {
      expect(output.interpretation.value.career.status).toBe('UNAVAILABLE');
      expect(output.interpretation.value.wealth.status).toBe('UNAVAILABLE');
    }
  });

  it('rejects version mismatch and unexpected fields rather than accepting hidden state', () => {
    const output = buildChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00Z');
    expect(validateChartExport({ ...output, schemaVersion: 2 })).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(validateChartExport({ ...output, privateData: 'must not pass' })).toEqual({ ok: false, error: 'INVALID_SHAPE' });
  });

  it('rejects malformed ExportedValue states', () => {
    const output = buildChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00Z');
    expect(validateChartExport({ ...output, chartFacts: { status: 'UNAVAILABLE' } })).toEqual({
      ok: false, error: 'INVALID_SHAPE'
    });
  });

  it('rejects hidden fields inside the deterministic selected-period projection', () => {
    const output = buildChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00Z');
    const withSelected = buildChartExport({
      analysis: createProductAnalysis(),
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          period: {
            selectedPeriodId: 'period-1',
            mahadashaId: 'md-1',
            mahadashaPlanet: 'Jupiter',
            antardashaId: 'ad-1',
            antardashaPlanet: 'Saturn',
            interval: { start: '2026-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
            analysisAsOf: '2026-01-15T08:30:00.000Z',
            temporalRelation: 'CURRENT'
          },
          natalBaseline: {},
          career: { qualificationBasis: 'UNAVAILABLE', expressions: [], diagnostics: [] },
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
            career: { status: 'MISSING' },
            wealth: { status: 'MISSING' }
          },
          qualificationStatus: 'UNAVAILABLE',
          aiExplanationStatus: 'NOT_REQUESTED'
        }
      }
    }, '2026-10-26T00:00:00Z');
    expect(output.selectedPeriod.status).toBe('UNAVAILABLE');
    expect(withSelected.selectedPeriod.status).toBe('AVAILABLE');
    if (withSelected.selectedPeriod.status !== 'AVAILABLE') return;
    const body = withSelected.selectedPeriod.value;
    const hidden = {
      ...withSelected,
      selectedPeriod: {
        ...withSelected.selectedPeriod,
        value: {
          ...body,
          deterministicSynthesis: {
            ...body.deterministicSynthesis,
            career: { ...body.deterministicSynthesis.career, aiExplanation: 'hidden' }
          }
        }
      }
    };
    expect(validateChartExport(hidden)).toEqual({ ok: false, error: 'INVALID_SHAPE' });
  });
});
