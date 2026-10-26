import { buildChartExport, type ChartExportSelection } from './chartExportMapper';
import { validateChartExport, type ChartExportV1 } from './chartExportSchema';

export type ChartExportDownloadResult =
  | { readonly ok: true; readonly filename: string; readonly json: string }
  | { readonly ok: false; readonly error: string };

export interface ChartExportBrowser {
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
  readonly defer: (callback: () => void) => void;
  readonly createAnchor: () => {
    href: string;
    download: string;
    click: () => void;
  };
}

function defaultBrowser(): ChartExportBrowser {
  return {
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    defer: (callback) => { globalThis.setTimeout(callback, 0); },
    createAnchor: () => document.createElement('a')
  };
}

function sanitizeFilename(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return safe || 'chart-export';
}

export function serializeChartExport(exportValue: ChartExportV1): string {
  const validation = validateChartExport(exportValue);
  if (!validation.ok) throw new Error(`Chart export validation failed: ${validation.error}`);
  return JSON.stringify(validation.value, null, 2);
}

export function downloadChartExport(
  selection: ChartExportSelection,
  exportedAt: string | Date = new Date(),
  browser: ChartExportBrowser = defaultBrowser()
): ChartExportDownloadResult {
  let objectUrl: string | undefined;
  let successfulExport: { readonly filename: string; readonly json: string } | undefined;
  let failure: string | undefined;
  try {
    const chartExport = buildChartExport(selection, exportedAt);
    const validation = validateChartExport(chartExport);
    if (!validation.ok) return { ok: false, error: `Export validation failed: ${validation.error}` };
    const json = JSON.stringify(validation.value, null, 2);
    const filename = `${sanitizeFilename(chartExport.provenance.analysisId)}-chart-export.json`;
    objectUrl = browser.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = browser.createAnchor();
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    successfulExport = { filename, json };
  } catch (error) {
    failure = error instanceof Error ? error.message : 'The chart export could not be created or downloaded.';
  }
  if (objectUrl) {
    const cleanupUrl = objectUrl;
    try {
      browser.defer(() => browser.revokeObjectURL(cleanupUrl));
    } catch (error) {
      try {
        globalThis.setTimeout(() => browser.revokeObjectURL(cleanupUrl), 0);
      } catch (fallbackError) {
        const cleanupError = fallbackError instanceof Error
          ? fallbackError.message
          : error instanceof Error ? error.message : 'Temporary export cleanup could not be scheduled.';
        failure = failure ? `${failure} Cleanup also failed: ${cleanupError}` : cleanupError;
      }
    }
  }
  if (failure) return { ok: false, error: failure };
  if (!successfulExport) return { ok: false, error: 'The chart export did not complete.' };
  return { ok: true, ...successfulExport };
}
