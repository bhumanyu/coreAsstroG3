import React from 'react';
import type { ProductAnalysis } from '../../product/analysis/productAnalysisTypes';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../../product/analysis/wealthViewModel';
import { selectDashaViewModel } from '../../product/analysis/dashaViewModel';

function StateLabel({ value }: { value?: string }) {
  return <span className="inline-flex rounded-full border border-slate-600 px-2 py-0.5 text-xs font-mono">{value ?? 'UNAVAILABLE'}</span>;
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
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 print:text-slate-600">{label}</div>
      <div className="break-words text-sm text-slate-100 print:text-black">{value ?? 'Not available'}</div>
    </div>
  );
}

export interface ProductAnalysisReportViewProps {
  readonly analysis?: ProductAnalysis;
  readonly status?: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  readonly error?: string;
  readonly onRetry?: () => void;
}

export const ProductAnalysisReportView: React.FC<ProductAnalysisReportViewProps> = ({ analysis, status, error, onRetry }) => {
  if (status === 'LOADING') {
    return (
      <section aria-label="Career and Wealth product report" role="status" className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">Career & Wealth Product Analysis</h2>
        <p className="mt-2 text-sm text-slate-300 print:text-slate-700">LOADING — preparing the canonical analysis report. No previous or unrelated analysis is substituted.</p>
      </section>
    );
  }

  if (status === 'ERROR') {
    return (
      <section aria-label="Career and Wealth product report" role="alert" className="rounded-xl border border-rose-700/50 bg-rose-950/20 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">Career & Wealth Product Analysis</h2>
        <p className="mt-2 text-sm text-rose-200 print:text-slate-700">ERROR — {error ?? 'The canonical analysis report could not be prepared.'}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white print:hidden">Retry analysis</button>}
      </section>
    );
  }

  if (!analysis) {
    return (
      <section aria-label="Career and Wealth product report" className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-5 print:border-slate-300 print:bg-white">
        <h2 className="text-lg font-semibold text-slate-100 print:text-black">Career & Wealth Product Analysis</h2>
        <p className="mt-2 text-sm text-amber-200 print:text-slate-700">
          UNAVAILABLE — no canonical ProductAnalysis snapshot is attached to this report. Career and Wealth conclusions have not been reconstructed from the legacy natal report.
        </p>
      </section>
    );
  }

  // These selectors are pure projections. They do not calculate astrology or replace C11/CW-05.
  const career = selectCareerViewModel(analysis);
  const wealth = selectWealthViewModel(analysis);
  const dasha = selectDashaViewModel(analysis);
  const careerTimeline = analysis.career.eventTimeline;
  const wealthLifecycle = analysis.wealth.lifecycle;
  const selectedPeriod = analysis.selectedPeriod;
  const financialData = analysis.wealth.financialData;
  const sourceCounts = financialData?.data.reduce<Record<string, number>>((counts, datum) => {
    counts[datum.sourceClassification] = (counts[datum.sourceClassification] ?? 0) + 1;
    return counts;
  }, {}) ?? {};

  return (
    <div aria-label="Career and Wealth product report" className="mt-8 space-y-5 border-t border-slate-700 pt-8 print:border-slate-300">
      <header className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-300 print:text-slate-600">Canonical product analysis report</p>
        <h2 className="text-2xl font-bold text-slate-100 print:text-black">Career & Wealth Analysis</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label="Analysis status" value={analysis.status} />
          <Value label="Analysis as-of" value={analysis.asOf} />
          <Value label="Analysis ID" value={analysis.analysisId} />
          <Value label="Engine / rules" value={analysis.engineVersion + ' / ' + analysis.rulesVersion} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          This report is a presentation of the attached canonical analysis snapshot. It does not recalculate chart placements, Dasha, Career or Wealth conclusions.
        </p>
      </header>

      <ReportSection title="Career — C11 conclusion" status={analysis.career.status ?? analysis.status}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label="Promise strength" value={career.promise.strength} />
          <Value label="C11 confidence" value={career.conclusion.confidence} />
          <Value label="Profession qualification" value={career.profession.status} />
          <Value label="D10 relationship" value={career.d10.relationship} />
        </div>
        <Value label="Career conclusion" value={career.conclusion.statement ?? career.promise.statement} />
        <div className="grid grid-cols-3 gap-3">
          <Value label="Primary evidence" value={career.conclusion.primaryEvidenceCount} />
          <Value label="Supporting evidence" value={career.conclusion.supportingEvidenceCount} />
          <Value label="Challenging evidence" value={career.conclusion.challengingEvidenceCount} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200 print:text-black">Qualified profession candidates</h4>
          {career.profession.candidates.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300 print:text-black">
              {career.profession.candidates.map(candidate => (
                <li key={candidate.candidateId}>
                  {candidate.family} — {candidate.basis}; evidence: {candidate.domainEvidenceIds.join(', ') || 'not linked'}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400 print:text-slate-600">UNAVAILABLE — no qualified profession candidates are present in the canonical analysis.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Value label="Outcome qualification" value={career.outcomeQualification?.status ?? 'UNAVAILABLE'} />
          <Value label="Career event taxonomy" value={careerTimeline?.status ?? 'UNAVAILABLE'} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          Event-specific forecasts remain unavailable unless their individual rules are validated and release-enabled. Generic timing windows are not specific event claims.
        </p>
        {careerTimeline && (
          <Value label="Generic candidate windows" value={careerTimeline.genericWindows.length} />
        )}
      </ReportSection>

      <ReportSection title="Wealth — CW-05 conclusion" status={analysis.wealth.overall.status}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Value label="Promise" value={analysis.wealth.overall.promise} />
          <Value label="CW-05 confidence" value={wealth.conclusion.confidence} />
          <Value label="D2 relationship" value={analysis.wealth.d2.relationship} />
          <Value label="C04 lifecycle" value={wealthLifecycle?.status ?? 'UNAVAILABLE'} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(['accumulation', 'gains', 'fortune', 'speculation'] as const).map(dimension => (
            <div key={dimension} className="rounded-lg border border-slate-700 p-3 print:border-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold capitalize text-slate-200 print:text-black">{dimension}</span>
                <StateLabel value={analysis.wealth.dimensions[dimension].status} />
              </div>
              <p className="mt-1 text-sm text-slate-300 print:text-black">{analysis.wealth.dimensions[dimension].statement ?? 'No dimension statement is available.'}</p>
            </div>
          ))}
        </div>
        <Value label="D2 qualification" value={analysis.wealth.d2.statement} />
        <div className="grid grid-cols-2 gap-3">
          <Value label="Speculative propensity source" value={analysis.wealth.speculativePropensity?.source ?? 'UNAVAILABLE'} />
          <Value label="Speculative propensity" value={analysis.wealth.speculativePropensity?.status ?? 'UNAVAILABLE'} />
          <Value label="Actual exposure" value={analysis.wealth.riskAndSuitability?.actualExposure ?? 'UNAVAILABLE'} />
          <Value label="Trading history" value={analysis.wealth.riskAndSuitability?.tradingHistory ?? 'UNAVAILABLE'} />
          <Value label="Suitability" value={analysis.wealth.riskAndSuitability?.suitability ?? 'UNAVAILABLE'} />
        </div>
        <p className="text-xs text-slate-400 print:text-slate-600">
          Astrological indications are not actual income, assets, debt, liquidity, inheritance, realized gains or investment suitability. D2 and unvalidated lifecycle event rules remain unavailable.
        </p>
      </ReportSection>

      <ReportSection title="User-supplied financial facts — C01" status={financialData?.status ?? 'UNAVAILABLE'}>
        <Value label="Financial records supplied" value={financialData?.data.length ?? 0} />
        {Object.entries(sourceCounts).length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-slate-300 print:text-black">
            {Object.entries(sourceCounts).map(([source, count]) => <li key={source}>{source}: {count}</li>)}
          </ul>
        ) : <p className="text-sm text-slate-400 print:text-slate-600">No validated financial facts are attached. No financial values have been inferred.</p>}
      </ReportSection>

      <ReportSection title="Vimshottari Dasha and selected period" status={dasha.status}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Value label="Analysis as-of" value={dasha.hero.asOf} />
          <Value label="Current period" value={dasha.hero.currentPeriodLabel} />
          <Value label="Current hierarchy entries" value={dasha.hierarchy.length} />
        </div>
        {selectedPeriod?.status === 'OK' ? (
          <>
            <Value label="Selected MD–AD" value={selectedPeriod.synthesis.period.mahadashaId + ' / ' + selectedPeriod.synthesis.period.antardashaId} />
            <Value label="Selected interval" value={selectedPeriod.synthesis.period.interval.start + ' — ' + selectedPeriod.synthesis.period.interval.end} />
            <Value label="Temporal relation" value={selectedPeriod.synthesis.period.temporalRelation} />
            <Value label="Qualification status" value={selectedPeriod.synthesis.qualificationStatus} />
          </>
        ) : (
          <Value label="Selected period" value={selectedPeriod ? selectedPeriod.status + (selectedPeriod.error ? ': ' + selectedPeriod.error : '') : 'NOT_SELECTED'} />
        )}
      </ReportSection>

      <ReportSection title="Evidence, warnings and reproducibility" status={analysis.status}>
        <div className="grid grid-cols-2 gap-3">
          <Value label="Career evidence references" value={analysis.career.evidence.length} />
          <Value label="Wealth evidence references" value={analysis.wealth.evidence.length} />
          <Value label="Warnings" value={analysis.warnings.length} />
          <Value label="AI explanation status" value={analysis.ai.status} />
        </div>
        <details className="rounded-lg border border-slate-700 p-3 print:border-slate-300">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 print:text-black">Evidence references</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 print:text-black">Career</h4>
              <ul className="list-disc pl-5 text-xs text-slate-400 print:text-black">
                {analysis.career.evidence.map(item => <li key={item.id}>{item.id} — {item.title}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 print:text-black">Wealth</h4>
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
        <Value label="Methodology" value={analysis.methodology.ayanamsa + ' / ' + analysis.methodology.zodiacSystem + ' / ' + analysis.methodology.houseSystem} />
        <p className="text-xs text-slate-400 print:text-slate-600">
          This report reflects analysis ID {analysis.analysisId} as of {analysis.asOf}. Refreshing or changing birth details creates a different analysis snapshot.
        </p>
      </ReportSection>
    </div>
  );
};
