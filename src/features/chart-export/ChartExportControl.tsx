import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { ProductAnalysis, ProductSelectedPeriodResult } from '../../product/analysis/productAnalysisTypes';
import { downloadChartExport, type ChartExportBrowser } from './chartExportService';

export interface ChartExportControlProps {
  readonly analysis: ProductAnalysis;
  readonly selectedPeriod?: ProductSelectedPeriodResult;
  readonly browser?: ChartExportBrowser;
}

export const ChartExportControl: React.FC<ChartExportControlProps> = ({ analysis, selectedPeriod, browser }) => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const handleExport = () => {
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
  return (
    <div className="mb-4">
      <Button type="button" variant="outline" onClick={handleExport}>Export chart and report JSON</Button>
      {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="mt-2 text-sm text-emerald-300">{message}</p>}
    </div>
  );
};
