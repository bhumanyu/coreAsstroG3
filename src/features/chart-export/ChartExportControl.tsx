import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { BirthDetails } from '../../types';
import type { ProductAnalysis, ProductSelectedPeriodResult } from '../../product/analysis/productAnalysisTypes';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('chartExport');
  const { t: tCommon } = useTranslation('common');
  const [error, setError] = useState<{ key: string; values?: Record<string, string | number> } | null>(null);
  const [message, setMessage] = useState<{ key: string; values?: Record<string, string | number> } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ readonly birthDetails: BirthDetails; readonly schemaVersion: 1 | 2 }>();

  const handleExport = () => {
    if (!analysis) {
      setError({ key: 'exportPrerequisite' });
      setMessage(null);
      return;
    }
    const result = downloadChartExport(
      { analysis, selectedPeriod },
      new Date(),
      browser
    );
    if (result.ok) {
      setError(null);
      setMessage({ key: 'exportStarted' });
    } else {
      setMessage(null);
      setError({ key: 'exportFailed', values: { message: result.error } });
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
        setMessage(null);
        setError({
          key: result.error === 'UNSUPPORTED_VERSION' ? 'unsupportedVersion'
            : result.error === 'INVALID_JSON' ? 'invalidJson' : 'invalidFile'
        });
      } else {
        setError(null);
        setMessage(null);
        setPendingImport({ birthDetails: result.birthDetails, schemaVersion: result.schemaVersion });
      }
    } catch {
      setPendingImport(undefined);
      setMessage(null);
      setError({ key: 'readFailed' });
    } finally {
      input.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onLoadBirthDetails(pendingImport.birthDetails);
    setPendingImport(undefined);
    setError(null);
    setMessage({ key: 'birthInputsLoaded' });
  };

  return (
    <section aria-label={t('section')} className="mb-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Button type="button" variant="outline" onClick={handleExport} disabled={!analysis}>{t('exportButton')}</Button>
          {!analysis && <p className="text-xs text-slate-500">{t('exportUnavailable')}</p>}
        </div>
        <label className="flex flex-col gap-1 text-xs text-slate-300">
          {t('importButton')}
          <input
            aria-label={t('importButton')}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="max-w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{t(error.key, error.values)}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{t(message.key, message.values)}</p>}

      {pendingImport && (
        <div role="dialog" aria-modal="true" aria-labelledby="chart-import-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <header className="space-y-1">
              <h2 id="chart-import-title" className="text-lg font-semibold text-slate-100">{t('reviewTitle')}</h2>
              <p className="text-xs text-slate-400">{t('validatedSchema', { version: pendingImport.schemaVersion })}</p>
            </header>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-400">{t('birthDateTime')}</dt><dd className="mt-1 break-all text-slate-100">{pendingImport.birthDetails.dateTimeStr}</dd></div>
              <div><dt className="text-xs text-slate-400">{t('timeZone')}</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.timeZone}</dd></div>
              <div><dt className="text-xs text-slate-400">{t('latitude')}</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.latitude}</dd></div>
              <div><dt className="text-xs text-slate-400">{t('longitude')}</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.longitude}</dd></div>
              <div><dt className="text-xs text-slate-400">{t('ayanamsa')}</dt><dd className="mt-1 text-slate-100">{pendingImport.birthDetails.ayanamsa}</dd></div>
            </dl>
            <p className="text-xs text-amber-200">{t('importNotice')}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingImport(undefined)}>{tCommon('cancel')}</Button>
              <Button type="button" onClick={handleConfirmImport}>{t('load')}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
