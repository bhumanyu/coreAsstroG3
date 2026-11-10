import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChartExportControl } from './ChartExportControl';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { buildChartExport } from './chartExportMapper';

function jsonFile(value: unknown): File {
  const serialized = JSON.stringify(value);
  const file = new File([serialized], 'chart-export.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => serialized });
  return file;
}

describe('ChartExportControl import/export UX', () => {
  it('previews validated birth inputs and requires explicit confirmation before loading', async () => {
    const analysis = createProductAnalysis();
    const exported = buildChartExport({ analysis }, '2026-10-26T00:00:00Z');
    const onLoadBirthDetails = vi.fn();
    render(<ChartExportControl analysis={analysis} onLoadBirthDetails={onLoadBirthDetails} />);

    fireEvent.change(screen.getByLabelText('Import chart JSON'), { target: { files: [jsonFile(exported)] } });
    const dialog = await screen.findByRole('dialog', { name: 'Review imported chart inputs' });
    expect(within(dialog).getByText(exported.birth.timezone)).toBeInTheDocument();
    expect(within(dialog).getByText(/Only original birth inputs will be restored/)).toBeInTheDocument();
    expect(within(dialog).getByText(/imported conclusions are not reused/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onLoadBirthDetails).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Import chart JSON'), { target: { files: [jsonFile(exported)] } });
    const confirmedDialog = await screen.findByRole('dialog', { name: 'Review imported chart inputs' });
    fireEvent.click(within(confirmedDialog).getByRole('button', { name: 'Load imported chart' }));

    expect(onLoadBirthDetails).toHaveBeenCalledWith({
      dateTimeStr: exported.birth.dateTime,
      timeZone: exported.birth.timezone,
      latitude: exported.birth.latitude,
      longitude: exported.birth.longitude,
      ayanamsa: exported.birth.ayanamsa
    });
    expect(screen.getByRole('status')).toHaveTextContent(/chart and all deterministic conclusions will be recalculated/i);
  });

  it('keeps import available before analysis and rejects unsupported exports', async () => {
    const onLoadBirthDetails = vi.fn();
    render(<ChartExportControl onLoadBirthDetails={onLoadBirthDetails} />);
    expect(screen.getByRole('button', { name: 'Export chart and report JSON' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Import chart JSON'), {
      target: { files: [jsonFile({ schemaVersion: 99 })] }
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/unsupported schema version/i);
    expect(onLoadBirthDetails).not.toHaveBeenCalled();
  });
});
