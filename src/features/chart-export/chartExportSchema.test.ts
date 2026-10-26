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
});
