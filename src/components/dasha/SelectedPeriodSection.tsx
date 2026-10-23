/**
 * Selected Period Selection Section (P-UI-07)
 *
 * Cascading MD→AD selects for period selection.
 * Displays planet label, canonical start/end, PAST/CURRENT/FUTURE badge from DTO.
 * Invalid options rendered but disabled with diagnostic tooltip.
 */

import React, { useState } from 'react';
import type {
  ProductDashaPeriodOptions,
  ProductSelectableMahadasha,
  ProductSelectableAntardasha,
  ProductTemporalRelation
} from '../../product/analysis/productAnalysisTypes';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SelectedPeriodSectionProps {
  readonly dashPeriodOptions: ProductDashaPeriodOptions;
  readonly onSelect: (mahadashaId: string, antardashaId: string) => void;
  readonly isSubmitting?: boolean;
  readonly onSelectionChange?: () => void;
}

const TEMPORAL_BADGE_CLASSES: Record<ProductTemporalRelation, string> = {
  PAST: 'bg-slate-700/60 border-slate-600/80 text-slate-300',
  CURRENT: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  FUTURE: 'bg-blue-950/60 border-blue-800/80 text-blue-300',
  UNKNOWN: 'bg-amber-950/60 border-amber-800/80 text-amber-300'
};

const TEMPORAL_LABELS: Record<ProductTemporalRelation, string> = {
  PAST: 'Past',
  CURRENT: 'Current',
  FUTURE: 'Future',
  UNKNOWN: 'Unknown'
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const SelectedPeriodSection: React.FC<SelectedPeriodSectionProps> = ({
  dashPeriodOptions,
  onSelect,
  isSubmitting = false,
  onSelectionChange
}) => {
  const [selectedMahadashaId, setSelectedMahadashaId] = useState<string>('');
  const [selectedAntardashaId, setSelectedAntardashaId] = useState<string>('');

  const selectedMahadasha = dashPeriodOptions.mahadashas.find(
    md => md.id === selectedMahadashaId
  );
  const selectedAntardasha = selectedMahadasha?.antardashas.find(
    ad => ad.id === selectedAntardashaId
  );

  const canSubmit = Boolean(
    selectedMahadasha?.valid &&
    selectedAntardasha?.valid &&
    !isSubmitting
  );

  const handleSubmit = () => {
    if (canSubmit && selectedMahadashaId && selectedAntardashaId) {
      onSelect(selectedMahadashaId, selectedAntardashaId);
    }
  };

  const handleMahadashaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMahadashaId(e.target.value);
    setSelectedAntardashaId(''); // Clear AD on MD change
    onSelectionChange?.();
  };

  const handleAntardashaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAntardashaId(e.target.value);
    onSelectionChange?.();
  };

  return (
    <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <Calendar className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
          Select Dasha Period
        </span>
      </div>

      <div className="space-y-4">
        <fieldset disabled={isSubmitting}>
          <legend className="sr-only">Dasha period selection</legend>

          {/* Mahadasha Select */}
          <div className="space-y-2">
            <label htmlFor="mahadasha-select" className="text-xs font-mono-code text-slate-400">
              Mahadasha (Major Period)
            </label>
            <select
              id="mahadasha-select"
              value={selectedMahadashaId}
              onChange={handleMahadashaChange}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a Mahadasha</option>
              {dashPeriodOptions.mahadashas.map(md => (
                <option
                  key={md.id}
                  value={md.id}
                  disabled={!md.valid}
                  title={!md.valid ? md.diagnostics.join(', ') : undefined}
                >
                  {md.planet} — {formatDate(md.start)} → {formatDate(md.end)} ({TEMPORAL_LABELS[md.temporalRelation]})
                  {!md.valid && ' (Invalid)'}
                </option>
              ))}
            </select>
          </div>

          {/* Antardasha Select */}
          <div className="space-y-2">
            <label htmlFor="antardasha-select" className="text-xs font-mono-code text-slate-400">
              Antardasha (Sub-period)
            </label>
            <select
              id="antardasha-select"
              value={selectedAntardashaId}
              onChange={handleAntardashaChange}
              disabled={!selectedMahadashaId || isSubmitting}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedMahadashaId ? 'Select an Antardasha' : 'Select Mahadasha first'}
              </option>
              {selectedMahadasha?.antardashas.map(ad => (
                <option
                  key={ad.id}
                  value={ad.id}
                  disabled={!ad.valid}
                  title={!ad.valid ? ad.diagnostics.join(', ') : undefined}
                >
                  {ad.planet} — {formatDate(ad.start)} → {formatDate(ad.end)} ({TEMPORAL_LABELS[ad.temporalRelation]})
                  {!ad.valid && ' (Invalid)'}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Invalid Period Diagnostics */}
        {dashPeriodOptions.mahadashas.some(md => !md.valid) ||
          (selectedMahadasha && selectedMahadasha.antardashas.some(ad => !ad.valid)) ? (
          <section aria-label="Unavailable Dasha periods" className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono-code text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Unavailable Dasha periods</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300">
              {dashPeriodOptions.mahadashas.filter(md => !md.valid).map(md => (
                <li key={md.id}>
                  <span className="font-mono-code text-amber-400">{md.planet} MD:</span> {md.diagnostics.join(', ')}
                </li>
              ))}
              {selectedMahadasha && selectedMahadasha.antardashas.filter(ad => !ad.valid).map(ad => (
                <li key={ad.id}>
                  <span className="font-mono-code text-amber-400">{ad.planet} AD:</span> {ad.diagnostics.join(', ')}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Selected Period Info */}
        {selectedMahadasha && selectedAntardasha && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code text-slate-400">Selected Period</span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono-code ${TEMPORAL_BADGE_CLASSES[selectedAntardasha.temporalRelation]}`}
              >
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{TEMPORAL_LABELS[selectedAntardasha.temporalRelation]}</span>
              </div>
            </div>
            <div className="text-sm text-slate-200">
              <span className="font-semibold">{selectedMahadasha.planet}</span> MD →{' '}
              <span className="font-semibold">{selectedAntardasha.planet}</span> AD
            </div>
            <div className="text-xs text-slate-400 font-mono-code">
              {formatDate(selectedAntardasha.start)} - {formatDate(selectedAntardasha.end)}
            </div>
            {(!selectedMahadasha.valid || !selectedAntardasha.valid) && (
              <div className="flex items-start gap-2 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {!selectedMahadasha.valid && `MD: ${selectedMahadasha.diagnostics.join(', ')}. `}
                  {!selectedAntardasha.valid && `AD: ${selectedAntardasha.diagnostics.join(', ')}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live region for submission status */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {isSubmitting ? 'Analyzing the selected period…' : ''}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Analyzing selected period…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Analyze Selected Period</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
