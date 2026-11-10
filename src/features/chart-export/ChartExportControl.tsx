import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { BirthDetails } from '../../types';
import type { ProductAnalysis, ProductSelectedPeriodResult } from '../../product/analysis/productAnalysisTypes';
import {
  downloadChartExport,
  parseChartExport,
  type ChartExportBrowser
} from './chartExportService';

export interface ChartExportControlProps {
  readonly analysis?: ProductAnalysis;
  readonly selectedPeriod?: ProductSelectedPeriodResult;
  readonly browser?: ChartExportBrowser;
  readonly onLoadBirthDetails: (birthDetails: BirthDetails) => void;
}

export const ChartExportControl: React.FC<ChartExportControlProps> = ({
  analysis,
  selectedPeriod,
  browser,
  onLoadBirthDetails
}) => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<{ readonly birthDetails: BirthDetails; readonly schemaVersion: 1 | 2 }>();

  const handleExport = () => {
    if (!analysis) {
      setError('Run a chart analysis before exporting its report.');
      setMessage('');
      return;
    }
    const result = downloadChartExport(
      { analysis, selectedPeriod },
      new Date(),
      browser
    );
    if (result.ok) {
      setError('');
      setMessage('Validated chart JSON download initiated.');
    } else {
      setMessage('');
      setError(`Chart export failed: ${result.error}`);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = parseChartExport(await file.text());
      if (!result.ok) {
        setPendingImport(undefined);
        setMessage('');
        setError(result.error === 'UNSUPPORTED_VERSION'
          ? 'This chart export was created by an unsupported schema version.'
          : result.error === 'INVALID_JSON'
            ? 'The selected file is not valid JSON.'
            : 'The selected file is not a valid CoreAstroG3 chart export.');
      } else {
        setError('');
        setMessage('');
        setPendingImport({ birthDetails: result.birthDetails, schemaVersion: result.schemaVersion });
      }
    } catch {
      setPendingImport(undefined);
      setMessage('');
      setError('The selected chart export could not be read.');
    } finally {
      input.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onLoadBirthDetails(pendingImport.birthDetails);
    setPendingImport(undefined);
    setError('');
    setMessage('Birth inputs loaded. The chart and all deterministic conclusions will be recalculated; imported conclusions are not reused.');
  };

  return (
    <section aria-label="Chart JSON import and export" className="mb-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Button type="button" variant="outline" onClick={handleExport} disabled={!analysis}>Export chart and report JSON</Button>
          {!analysis && <p className="text-xs text-slate-500">Export becomes available after a canonical analysis is ready.</p>}
        </div>
        <label className="flex flex-col gap-1 text-xs text-slate-300">
          Import chart JSON
          <input
            aria-label="Import chart JSON"
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="max-w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}

      {pendingImport && (
        <div role="dialog" aria-modal="true" aria-labelledby="chart-import-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <header className="space-y-1">
              <h2 id="chart-import-title" className="text-lg font-semibold text-slate-100">Review imported chart inputs</h2>
              <p className="text-xs text-slate-400">Validated schema V{pendingImport.schemaVersion}. Only original birth inputs will be restored.</p>
            </header>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-400">Birth date/time (stored instant)</dt><dd className="mt-1 break-all text-slate-100">{pendingImport.birthDetails.dateTimeStr}</dd></div>
              <div><dt className="text-xs text-slate-400">IANA timezone</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.timeZone}</dd></div>
              <div><dt className="text-xs text-slate-400">Latitude</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.latitude}</dd></div>
              <div><dt className="text-xs text-slate-400">Longitude</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.longitude}</dd></div>
              <div><dt className="text-xs text-slate-400">Ayanamsa</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.ayanamsa}</dd></div>
            </dl>
            <p className="text-xs text-amber-200">On load, imported conclusions are not reused. The exported interpretation, confidence, selected-period synthesis and timing outputs are not imported. Loading these inputs starts a new chart calculation using the current engine and rules.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingImport(undefined)}>Cancel</Button>
              <Button type="button" onClick={handleConfirmImport}>Load imported chart</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
