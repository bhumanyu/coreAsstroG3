import { describe, expect, it, vi } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { downloadChartExport, parseChartExport, type ChartExportBrowser } from './chartExportService';
import { buildChartExport } from './chartExportMapper';

describe('chart export download service', () => {
  it('validates and initiates the offline download before deferred URL revocation', () => {
    const createObjectURL = vi.fn(() => 'blob:chart-json');
    const revokeObjectURL = vi.fn();
    const scheduled: Array<() => void> = [];
    const anchor = { href: '', download: '', click: vi.fn() };
    const browser: ChartExportBrowser = {
      createObjectURL,
      revokeObjectURL,
      defer: vi.fn((callback) => { scheduled.push(callback); }),
      createAnchor: () => anchor
    };
    const result = downloadChartExport(
      { analysis: createProductAnalysis() },
      '2026-10-26T00:00:00Z',
      browser
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.json).schemaVersion).toBe(1);
      expect(result.filename).toContain('pa_test_123');
    }
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(browser.defer).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    scheduled[0]();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:chart-json');
  });

  it('round-trips only validated birth inputs from a canonical chart export', () => {
    const analysis = createProductAnalysis();
    const exported = buildChartExport({ analysis }, '2026-10-26T00:00:00Z');
    const parsed = parseChartExport(JSON.stringify(exported));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.birthDetails).toEqual({
      dateTimeStr: exported.birth.dateTime,
      timeZone: exported.birth.timezone,
      latitude: exported.birth.latitude,
      longitude: exported.birth.longitude,
      ayanamsa: exported.birth.ayanamsa
    });
    expect('selectedPeriod' in parsed.birthDetails).toBe(false);
  });

  it('rejects malformed JSON, invalid shapes and unsupported schema versions', () => {
    expect(parseChartExport('{broken')).toEqual({ ok: false, error: 'INVALID_JSON' });
    expect(parseChartExport(JSON.stringify({ schemaVersion: 99 }))).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(parseChartExport(JSON.stringify({ schemaVersion: 1, birth: {} }))).toEqual({ ok: false, error: 'INVALID_SHAPE' });
  });

  it('surfaces initiation failures and still schedules URL revocation', () => {
    const revokeObjectURL = vi.fn();
    const scheduled: Array<() => void> = [];
    const browser: ChartExportBrowser = {
      createObjectURL: () => 'blob:failure',
      revokeObjectURL,
      defer: (callback) => { scheduled.push(callback); },
      createAnchor: () => { throw new Error('download unavailable'); }
    };
    expect(downloadChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00Z', browser))
      .toEqual({ ok: false, error: 'download unavailable' });
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(1);
    scheduled[0]();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:failure');
  });
});
