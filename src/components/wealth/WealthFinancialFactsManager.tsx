import React, { useEffect, useMemo, useState } from 'react';
import {
  WEALTH_FINANCIAL_CONCEPTS,
  type WealthFinancialConcept,
  type WealthFinancialDatum,
  type WealthFinancialPeriod
} from '../../domain/wealth/wealthFinancialData';
import { WealthFinancialFactsService } from '../../domain/wealth/wealthFinancialFactsService';

const MONETARY_CONCEPTS: ReadonlySet<WealthFinancialConcept> = new Set([
  'INCOME', 'SAVINGS', 'ASSETS', 'INHERITANCE', 'DEBT_LIABILITIES',
  'CASH_FLOW', 'LIQUIDITY', 'NET_WORTH', 'CONSUMPTION_LUXURY', 'TRADING_EXPOSURE'
]);

const PERIODS: readonly WealthFinancialPeriod[] = [
  'INSTANT', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'
];

const ERROR_MESSAGES = {
  INVALID_FACT: 'Check the entered value, currency, concept and reference date. No changes were saved.',
  CORRUPT: 'Saved financial facts are damaged or unsupported. They have been left unchanged.',
  UNAVAILABLE: 'Browser storage is unavailable. Your existing financial facts were not changed.',
  QUOTA: 'Browser storage is full. Remove an unused local record or free storage and try again.'
} as const;

function conceptLabel(concept: WealthFinancialConcept): string {
  return concept.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

function displayValue(item: WealthFinancialDatum<unknown>): string {
  if (typeof item.value === 'number') {
    return item.value.toLocaleString() + (item.currency ? ' ' + item.currency : '');
  }
  return String(item.value ?? 'Unavailable');
}

export interface WealthFinancialFactsManagerProps {
  readonly service?: WealthFinancialFactsService;
}

export const WealthFinancialFactsManager: React.FC<WealthFinancialFactsManagerProps> = ({ service: suppliedService }) => {
  const service = useMemo(() => suppliedService ?? new WealthFinancialFactsService(), [suppliedService]);
  const [facts, setFacts] = useState<readonly WealthFinancialDatum<unknown>[]>([]);
  const [concept, setConcept] = useState<WealthFinancialConcept>('INCOME');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [period, setPeriod] = useState<WealthFinancialPeriod>('MONTHLY');
  const [asOf, setAsOf] = useState('');
  const [label, setLabel] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deletingFact, setDeletingFact] = useState<WealthFinancialDatum<unknown> | undefined>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [storageReady, setStorageReady] = useState(false);

  const monetary = MONETARY_CONCEPTS.has(concept);

  const refresh = () => {
    const result = service.listFacts();
    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error]);
      setStorageReady(false);
      return;
    }
    setFacts(result.value);
    setError('');
    setStorageReady(true);
  };

  useEffect(() => {
    refresh();
  }, [service]);

  const resetForm = () => {
    setConcept('INCOME');
    setValue('');
    setCurrency('INR');
    setPeriod('MONTHLY');
    setAsOf('');
    setLabel('');
    setSourceNote('');
    setEditingId(undefined);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedValue = monetary ? Number(value) : value.trim();
    const result = service.saveFact({
      concept,
      value: normalizedValue,
      ...(monetary ? { currency: currency.trim().toUpperCase(), period } : {}),
      asOf: asOf + 'T00:00:00Z',
      ...(label.trim() ? { label: label.trim() } : {}),
      ...(sourceNote.trim() ? { sourceNote: sourceNote.trim() } : {})
    }, editingId);

    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error]);
      setStatus('');
      return;
    }
    setError('');
    setStatus(editingId ? 'Financial fact updated on this browser/device.' : 'Financial fact saved on this browser/device.');
    resetForm();
    refresh();
  };

  const handleEdit = (fact: WealthFinancialDatum<unknown>) => {
    setEditingId(fact.id);
    setConcept(fact.concept);
    setValue(String(fact.value ?? ''));
    setCurrency(fact.currency ?? 'INR');
    setPeriod(fact.period ?? 'MONTHLY');
    setAsOf(fact.asOf?.slice(0, 10) ?? '');
    setLabel(fact.userReportedProvenance?.label ?? '');
    setSourceNote(fact.userReportedProvenance?.sourceNote ?? '');
    setError('');
    setStatus('');
  };

  const handleDelete = () => {
    if (!deletingFact) return;
    const result = service.deleteFact(deletingFact.id);
    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error]);
      setStatus('');
      return;
    }
    setDeletingFact(undefined);
    setError('');
    setStatus('Financial fact deleted from this browser/device.');
    refresh();
  };

  return (
    <section aria-labelledby="wealth-facts-manager-heading" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <header className="space-y-1">
        <h2 id="wealth-facts-manager-heading" className="text-base font-semibold text-slate-100">Manage user-reported financial facts</h2>
        <p className="text-xs text-slate-400">Add, edit or delete values you explicitly report. Records are stored only in this browser/device; they are not synced, transmitted or encrypted. Anyone with access to this browser profile may be able to read them.</p>
        <p className="text-xs text-amber-200">These records are separate from astrological indications and CW-05. They do not change chart calculations, confidence, financial suitability or predictions.</p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Financial concept
          <select aria-label="Financial concept" value={concept} onChange={event => setConcept(event.target.value as WealthFinancialConcept)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            {WEALTH_FINANCIAL_CONCEPTS.map(item => <option key={item} value={item}>{conceptLabel(item)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          {monetary ? 'Amount / value' : 'Description'}
          <input
            aria-label={monetary ? 'Amount / value' : 'Description'}
            type={monetary ? 'number' : 'text'}
            min={monetary ? 0 : undefined}
            step={monetary ? '0.01' : undefined}
            value={value}
            onChange={event => setValue(event.target.value)}
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>
        {monetary && (
          <>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Currency (ISO 4217)
              <input aria-label="Currency" maxLength={3} value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Reporting period
              <select aria-label="Reporting period" value={period} onChange={event => setPeriod(event.target.value as WealthFinancialPeriod)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                {PERIODS.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Reference date
          <input aria-label="Reference date" type="date" value={asOf} onChange={event => setAsOf(event.target.value)} required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Label (optional)
          <input aria-label="Financial fact label" value={label} onChange={event => setLabel(event.target.value)} maxLength={100} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-300">
          Source note (optional)
          <textarea aria-label="Source note" value={sourceNote} onChange={event => setSourceNote(event.target.value)} maxLength={500} rows={2} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button type="submit" disabled={!storageReady || !value.trim() || !asOf} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {editingId ? 'Update financial fact' : 'Save financial fact'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel edit</button>}
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {status && <p role="status" className="text-sm text-emerald-300">{status}</p>}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">Saved financial facts ({facts.length})</h3>
        {facts.length === 0 ? (
          <p className="text-sm text-slate-400">No user-reported financial facts are stored on this browser/device.</p>
        ) : (
          <ul className="space-y-2">
            {facts.map(fact => (
              <li key={fact.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{fact.userReportedProvenance?.label || conceptLabel(fact.concept)}</p>
                    <p className="mt-1 text-sm text-slate-300">{displayValue(fact)}</p>
                    <p className="mt-1 text-xs text-slate-500">{fact.asOf?.slice(0, 10)}{fact.period ? ' · ' + fact.period : ''} · Reported by user</p>
                    {fact.userReportedProvenance?.sourceNote && <p className="mt-1 text-xs text-slate-400">{fact.userReportedProvenance.sourceNote}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEdit(fact)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Edit</button>
                    <button type="button" onClick={() => setDeletingFact(fact)} className="rounded-lg border border-rose-800 px-3 py-1.5 text-xs text-rose-300">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deletingFact && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-financial-fact-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 id="delete-financial-fact-title" className="text-lg font-semibold text-slate-100">Delete financial fact?</h3>
            <p className="text-sm text-slate-300">Delete this user-reported record from this browser/device? It cannot be recovered after deletion.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingFact(undefined)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">Cancel</button>
              <button type="button" onClick={handleDelete} className="rounded-lg border border-rose-800 bg-rose-950 px-3 py-2 text-sm text-rose-200">Delete financial fact</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
