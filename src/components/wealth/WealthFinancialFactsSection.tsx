import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WealthFinancialDataViewModel, WealthFinancialItemViewModel } from '../../product/analysis/wealthViewModel';
import { AlertCircle, FileCheck2, LockKeyhole } from 'lucide-react';

export interface WealthFinancialFactsSectionProps {
  readonly financialData: WealthFinancialDataViewModel;
}

const displayValue = (item: WealthFinancialItemViewModel): string => {
  if (item.availability !== 'AVAILABLE') return 'Unavailable';
  if (typeof item.value === 'string' || typeof item.value === 'number' || typeof item.value === 'boolean') {
    return String(item.value) + (item.currency ? ' ' + item.currency : '') + (item.unit ? ' ' + item.unit : '');
  }
  return 'Supplied value is present; structured detail is not rendered.';
};

const FinancialDatum: React.FC<{ item: WealthFinancialItemViewModel }> = ({ item }) => {
  const { t } = useTranslation('wealth');
  return <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-slate-200">{item.label}</h3>
      <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
        {item.availability === 'AVAILABLE' ? item.sourceClassification.replaceAll('_', ' ') : 'UNAVAILABLE'}
      </span>
    </div>
    <p className="text-base font-semibold text-slate-100">{displayValue(item)}</p>
    {item.availability === 'AVAILABLE' && (
      <dl className="grid grid-cols-1 gap-1 text-xs text-slate-400 sm:grid-cols-2">
        {item.period && <div><dt className="inline font-semibold text-slate-300">{t('financialFacts.period')}: </dt><dd className="inline">{item.period}</dd></div>}
        {item.asOf && <div><dt className="inline font-semibold text-slate-300">{t('financialFacts.asOf')}: </dt><dd className="inline">{item.asOf}</dd></div>}
      </dl>
    )}
    {item.unavailableReason && <p className="text-xs text-slate-400">{item.unavailableReason}</p>}
    {item.provenanceDetails.length > 0 && (
      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer">{t('financialFacts.sourceProvenance')}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {item.provenanceDetails.map((detail, index) => <li key={index}>{detail}</li>)}
        </ul>
      </details>
    )}
  </article>;
};

export const WealthFinancialFactsSection: React.FC<WealthFinancialFactsSectionProps> = ({ financialData }) => {
  const { t } = useTranslation('wealth');
  const factItems = financialData.items.filter(item => item.group === 'FINANCIAL_FACT');
  const indicationItems = financialData.items.filter(item => item.group === 'ASTROLOGICAL_INDICATION');
  const unavailableItems = financialData.items.filter(item => item.group === 'UNAVAILABLE');

  return (
    <section id="wealth-financial-facts" aria-labelledby="wealth-financial-facts-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <header className="flex items-start gap-3">
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300"><FileCheck2 className="h-5 w-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="wealth-financial-facts-heading" className="text-base font-semibold text-slate-100">{t('financialFacts.title')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('financialFacts.description')}</p>
        </div>
        <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{financialData.status}</span>
      </header>

      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
        <p>{t('financialFacts.privacyNotice')}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-400">{t('financialFacts.validatedCount')}</p><p className="mt-1 text-xl font-semibold text-slate-100">{factItems.length}</p></div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-400">{t('financialFacts.indicatorCount')}</p><p className="mt-1 text-xl font-semibold text-slate-100">{indicationItems.length}</p></div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-400">{t('financialFacts.unavailableCount')}</p><p className="mt-1 text-xl font-semibold text-slate-100">{unavailableItems.length}</p></div>
      </div>

      {factItems.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">{t('financialFacts.suppliedTitle')}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{factItems.map(item => <FinancialDatum key={item.id} item={item} />)}</div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <div><h3 className="text-sm font-medium text-slate-200">{t('financialFacts.emptyTitle')}</h3><p className="mt-1 text-xs text-slate-400">{t('financialFacts.emptyDescription')}</p></div>
        </div>
      )}

      {indicationItems.length > 0 && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <h3 className="text-sm font-semibold text-slate-200">{t('financialFacts.indicatorTitle')}</h3>
          <p className="text-xs text-slate-400">{t('disclaimers.financialValues')}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{indicationItems.map(item => <FinancialDatum key={item.id} item={item} />)}</div>
        </div>
      )}

      {unavailableItems.length > 0 && (
        <details className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-300">{t('financialFacts.unavailableDetails', { count: unavailableItems.length })}</summary>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {unavailableItems.map(item => <li key={item.id} className="rounded-lg border border-slate-800 p-3 text-xs"><p className="font-medium text-slate-200">{item.label}</p><p className="mt-1 text-slate-400">{item.unavailableReason || t('financialFacts.noValue')}</p></li>)}
          </ul>
        </details>
      )}

      {!financialData.classificationValid && <p role="status" className="text-xs text-amber-300">{t('financialFacts.invalidClassification')}</p>}
    </section>
  );
};
