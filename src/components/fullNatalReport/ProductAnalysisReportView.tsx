import React from 'react';
import type { ProductAnalysis } from '../../product/analysis/productAnalysisTypes';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../../product/analysis/wealthViewModel';
import { selectDashaViewModel } from '../../product/analysis/dashaViewModel';
import { useTranslation } from 'react-i18next';
import { enumLabel, enumLabelWithFallback } from '../../i18n/enumLabels';

function StateLabel({ value }: { value?: string }) {
  const { t } = useTranslation('enums');
  return <span className="inline-flex rounded-full border border-slate-600 px-2 py-0.5 text-xs font-mono">{enumLabel(t, 'wealthDimensionStatus', value ?? 'UNAVAILABLE')}</span>;
}

function ReportSection({ title, status, children }: { title: string; status?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="break-inside-avoid rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-3 print:border-slate-300 print:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100 print:text-black">{title}</h3>
        <StateLabel value={status} />
      </div>
      {children}
    </section>
  );
}

function Value({ label, value }: { label: string; value?: string | number | null }) {
  const { t } = useTranslation('reports');
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 print:text-slate-600">{label}</div>
      <div className="break-words text-sm text-slate-100 print:text-black">{value ?? t('product.notAvailable')}</div>
    </div>
  );
}

function reportStatusLabel(tEnum: (key: string) => string, value: string): string {
  const productStatusLabel = enumLabel(tEnum, 'productStatus', value);
  if (productStatusLabel !== value) return productStatusLabel;
  const availabilityLabel = enumLabel(tEnum, 'productAvailability', value);
  if (availabilityLabel !== value) return availabilityLabel;
  return enumLabel(tEnum, 'conclusionStatus', value);
}

export interface ProductAnalysisReportViewProps {
  readonly analysis?: ProductAnalysis;
  readonly analysisStatus?: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  readonly analysisError?: string;
  readonly onRetryAnalysis?: () => void;
}

export const ProductAnalysisReportView: React.FC<ProductAnalysisReportViewProps> = ({ analysis, analysisStatus, analysisError, onRetryAnalysis }) => {
  const { t: errorT } = useTranslation('errors');
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  if (analysisStatus === 'LOADING') {
    return (
      <section aria-label={errorT('productReport')} role="status" className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">{errorT('productAnalysis')}</h2>
        <p className="mt-2 text-sm text-slate-300 print:text-slate-700">{errorT('reportLoading')}</p>
      </section>
    );
  }

  if (analysisStatus === 'ERROR') {
    return (
      <section aria-label={errorT('productReport')} role="alert" className="rounded-xl border border-rose-700/50 bg-rose-950/20 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">{errorT('productAnalysis')}</h2>
        <p className="mt-2 text-sm text-rose-200 print:text-slate-700">{errorT('chartAnalysisFailed', { message: analysisError ?? errorT('canonicalAnalysisUnavailable') })}</p>
        {onRetryAnalysis && <button type="button" onClick={onRetryAnalysis} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white print:hidden">{errorT('retryChartAnalysis')}</button>}
      </section>
    );
  }

  if (!analysis) {
    return (
      <section aria-label={errorT('productReport')} className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">{errorT('productAnalysis')}</h2>
        <p className="mt-2 text-sm text-amber-200 print:text-slate-700">
          {errorT('productAnalysisUnavailable')}
        </p>
      </section>
    );
  }

  // These selectors are pure projections. They do not calculate astrology or replace C11/CW-05.
  const career = selectCareerViewModel(analysis);
  const wealth = selectWealthViewModel(analysis);
  const dasha = selectDashaViewModel(analysis);
  const careerTimeline = analysis.career.eventTimeline;
  const selectedPeriod = analysis.selectedPeriod;
  const financialData = analysis.wealth.financialData;
  const sourceCounts = financialData?.data.reduce<Record<string, number>>((counts, datum) => {
    counts[datum.sourceClassification] = (counts[datum.sourceClassification] ?? 0) + 1;
    return counts;
  }, {}) ?? {};

  return (
    <div aria-label={t('product.ariaLabel')} className="mt-8 space-y-5 border-t border-slate-700 pt-8 print:border-slate-300">
      <header className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-300 print:text-slate-600">{t('product.eyebrow')}</p>
        <h2 className="text-2xl font-bold text-slate-100 print:text-black">{t('product.title')}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label={t('product.labels.analysisStatus')} value={enumLabel(tEnum, 'productStatus', analysis.status)} />
          <Value label={t('product.labels.analysisAsOf')} value={analysis.asOf} />
          <Value label={t('product.labels.analysisId')} value={analysis.analysisId} />
          <Value label={t('product.labels.engineRules')} value={analysis.engineVersion + ' / ' + analysis.rulesVersion} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          {t('product.snapshotDescription')}
        </p>
      </header>

      <ReportSection title={t('product.sections.career')} status={reportStatusLabel(tEnum, analysis.career.status ?? analysis.status)}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label={t('product.labels.promiseStrength')} value={enumLabelWithFallback(tEnum, 'promiseStrength', 'productDirection', career.promise.strength)} />
          <Value label={t('product.labels.careerConfidence')} value={enumLabel(tEnum, 'productConfidence', career.conclusion.confidence)} />
          <Value label={t('product.labels.professionQualification')} value={enumLabel(tEnum, 'professionStatus', career.profession.status)} />
          <Value label={t('product.labels.d10Relationship')} value={enumLabel(tEnum, 'divisionalRelationship', career.d10.relationship)} />
        </div>
        <Value label={t('product.labels.careerConclusion')} value={career.conclusion.statement ?? career.promise.statement} />
        <div className="grid grid-cols-3 gap-3">
          <Value label={t('product.labels.primaryEvidence')} value={career.conclusion.primaryEvidenceCount} />
          <Value label={t('product.labels.supportingEvidence')} value={career.conclusion.supportingEvidenceCount} />
          <Value label={t('product.labels.challengingEvidence')} value={career.conclusion.challengingEvidenceCount} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200 print:text-black">{t('product.qualifiedProfessionCandidates')}</h4>
          {career.profession.candidates.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300 print:text-black">
              {career.profession.candidates.map(candidate => (
                <li key={candidate.candidateId}>
                  {enumLabel(tEnum, 'professionFamily', candidate.family)} — {enumLabel(tEnum, 'professionBasis', candidate.basis)}; {t('product.evidence')}: {candidate.domainEvidenceIds.join(', ') || t('product.notLinked')}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400 print:text-slate-600">{t('product.noQualifiedProfessionCandidates')}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Value label={t('product.labels.outcomeQualification')} value={career.outcomeQualification
            ? enumLabel(tEnum, 'careerOutcomeStatus', career.outcomeQualification.status)
            : enumLabel(tEnum, 'productAvailability', 'UNAVAILABLE')} />
          <Value label={t('product.labels.careerEventTaxonomy')} value={enumLabel(tEnum, 'careerEventTimelineStatus', careerTimeline?.status ?? 'UNAVAILABLE')} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          {t('product.eventForecastDisclaimer')}
        </p>
        {careerTimeline && (
          <Value label={t('product.labels.genericCandidateWindows')} value={careerTimeline.genericWindows.length} />
        )}
      </ReportSection>

      <ReportSection title={t('product.sections.wealth')} status={reportStatusLabel(tEnum, analysis.wealth.overall.status)}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label={t('product.labels.wealthPromise')} value={enumLabelWithFallback(tEnum, 'promiseStrength', 'productDirection', analysis.wealth.overall.promise)} />
          <Value label={t('product.labels.wealthConfidence')} value={enumLabel(tEnum, 'productConfidence', wealth.conclusion.confidence)} />
          <Value label={t('product.labels.d2Relationship')} value={enumLabel(tEnum, 'divisionalRelationship', analysis.wealth.d2.relationship)} />
          <Value label={t('product.labels.c04Lifecycle')} value={enumLabel(tEnum, 'wealthLifecycleAvailability', wealth.lifecycle.status)} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(['accumulation', 'gains', 'fortune', 'speculation'] as const).map(dimension => (
            <div key={dimension} className="rounded-lg border border-slate-700 p-3 print:border-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold capitalize text-slate-200 print:text-black">{dimension}</span>
                <StateLabel value={enumLabel(tEnum, 'wealthDimensionStatus', analysis.wealth.dimensions[dimension].status)} />
              </div>
              <p className="mt-1 text-sm text-slate-300 print:text-black">{analysis.wealth.dimensions[dimension].statement ?? t('product.noDimensionStatement')}</p>
            </div>
          ))}
        </div>
        <Value label={t('product.labels.d2Qualification')} value={analysis.wealth.d2.statement} />
        <div className="grid grid-cols-2 gap-3">
          <Value label={t('product.labels.speculativePropensitySource')} value={analysis.wealth.speculativePropensity
            ? enumLabel(tEnum, 'speculativePropensitySource', analysis.wealth.speculativePropensity.source)
            : enumLabel(tEnum, 'productAvailability', 'UNAVAILABLE')} />
          <Value label={t('product.labels.speculativePropensity')} value={analysis.wealth.speculativePropensity
            ? enumLabel(tEnum, 'speculativePropensity', analysis.wealth.speculativePropensity.status)
            : enumLabel(tEnum, 'productAvailability', 'UNAVAILABLE')} />
          <Value label={t('product.labels.actualExposure')} value={enumLabel(tEnum, 'productAvailability', analysis.wealth.riskAndSuitability?.actualExposure ?? 'UNAVAILABLE')} />
          <Value label={t('product.labels.tradingHistory')} value={enumLabel(tEnum, 'productAvailability', analysis.wealth.riskAndSuitability?.tradingHistory ?? 'UNAVAILABLE')} />
          <Value label={t('product.labels.suitability')} value={enumLabel(tEnum, 'productAvailability', analysis.wealth.riskAndSuitability?.suitability ?? 'UNAVAILABLE')} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          {t('product.wealthDisclaimer')}
        </p>
      </ReportSection>

      <ReportSection title={t('product.sections.financialFacts')} status={enumLabel(tEnum, 'wealthFinancialDataStatus', financialData?.status ?? 'UNAVAILABLE')}>
        <Value label={t('product.labels.financialRecordsSupplied')} value={financialData?.data.length ?? 0} />
        {Object.entries(sourceCounts).length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-slate-300 print:text-black">
            {Object.entries(sourceCounts).map(([source, count]) => <li key={source}>{source}: {count}</li>)}
          </ul>
        ) : <p className="text-sm text-slate-400 print:text-slate-600">{t('product.noFinancialFacts')}</p>}
      </ReportSection>

      <ReportSection title={t('product.sections.dasha')} status={reportStatusLabel(tEnum, dasha.status)}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Value label={t('product.labels.analysisAsOf')} value={dasha.hero.asOf} />
          <Value label={t('product.labels.currentPeriod')} value={dasha.hero.currentPeriodLabel} />
          <Value label={t('product.labels.currentHierarchyEntries')} value={dasha.hierarchy.length} />
        </div>
        {selectedPeriod?.status === 'OK' ? (
          <>
            <Value label={t('product.labels.selectedMdAd')} value={selectedPeriod.synthesis.period.mahadashaId + ' / ' + selectedPeriod.synthesis.period.antardashaId} />
            <Value label={t('product.labels.selectedInterval')} value={selectedPeriod.synthesis.period.interval.start + ' — ' + selectedPeriod.synthesis.period.interval.end} />
            <Value label={t('product.labels.temporalRelation')} value={enumLabel(tEnum, 'temporalRelation', selectedPeriod.synthesis.period.temporalRelation)} />
            <Value label={t('product.labels.qualificationStatus')} value={enumLabel(tEnum, 'productQualificationStatus', selectedPeriod.synthesis.qualificationStatus)} />
          </>
        ) : (
          <Value label={t('product.labels.selectedPeriod')} value={selectedPeriod ? enumLabel(tEnum, 'selectedPeriodStatus', selectedPeriod.status) + (selectedPeriod.error ? ': ' + selectedPeriod.error : '') : 'NOT_SELECTED'} />
        )}
      </ReportSection>

      <ReportSection title={t('product.sections.evidence')} status={enumLabel(tEnum, 'productStatus', analysis.status)}>
        <div className="grid grid-cols-2 gap-3">
          <Value label={t('product.labels.careerEvidenceReferences')} value={analysis.career.evidence.length} />
          <Value label={t('product.labels.wealthEvidenceReferences')} value={analysis.wealth.evidence.length} />
          <Value label={t('product.labels.warnings')} value={analysis.warnings.length} />
          <Value label={t('product.labels.aiExplanationStatus')} value={enumLabel(tEnum, 'aiAvailability', analysis.ai.status)} />
        </div>
        <details className="rounded-lg border border-slate-700 p-3 print:border-slate-300">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 print:text-black">{t('product.evidenceReferences')}</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 print:text-black">{t('product.career')}</h4>
              <ul className="list-disc pl-5 text-xs text-slate-400 print:text-black">
                {analysis.career.evidence.map(item => <li key={item.id}>{item.id} — {item.title}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 print:text-black">{t('product.wealth')}</h4>
              <ul className="list-disc pl-5 text-xs text-slate-400 print:text-black">
                {analysis.wealth.evidence.map(item => <li key={item.id}>{item.id} — {item.title}</li>)}
              </ul>
            </div>
          </div>
        </details>
        {analysis.warnings.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-amber-200 print:text-black">
            {analysis.warnings.map((warning, index) => <li key={warning.code + '-' + index}>{warning.domain} / {warning.code}: {warning.message}</li>)}
          </ul>
        )}
        <Value label={t('product.labels.methodology')} value={analysis.methodology.ayanamsa + ' / ' + analysis.methodology.zodiacSystem + ' / ' + analysis.methodology.houseSystem} />
        <p className="text-xs text-slate-400 print:text-slate-600">
          {t('product.snapshotFootnote', { analysisId: analysis.analysisId, asOf: analysis.asOf })}
        </p>
      </ReportSection>
    </div>
  );
};
