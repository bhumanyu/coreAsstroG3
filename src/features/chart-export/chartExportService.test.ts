import { describe, expect, it, vi } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { downloadChartExport, type ChartExportBrowser } from './chartExportService';

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
