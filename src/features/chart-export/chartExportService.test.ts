import { describe, expect, it, vi } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { downloadChartExport, type ChartExportBrowser } from './chartExportService';

describe('chart export download service', () => {
  it('validates, serializes, downloads offline, and revokes the blob URL', () => {
    const createObjectURL = vi.fn(() => 'blob:chart-json');
    const revokeObjectURL = vi.fn();
    const anchor = { href: '', download: '', click: vi.fn() };
    const browser: ChartExportBrowser = {
      createObjectURL,
      revokeObjectURL,
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
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:chart-json');
  });

  it('surfaces failures and still revokes created object URLs', () => {
    const revokeObjectURL = vi.fn();
    const browser: ChartExportBrowser = {
      createObjectURL: () => 'blob:failure',
      revokeObjectURL,
      createAnchor: () => { throw new Error('download unavailable'); }
    };
    expect(downloadChartExport({ analysis: createProductAnalysis() }, '2026-10-26T00:00:00Z', browser))
      .toEqual({ ok: false, error: 'download unavailable' });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:failure');
  });
});
