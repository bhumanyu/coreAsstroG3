import React from 'react';
import type { ProductCareerAnalyticalAxes } from '../../product/analysis/productAnalysisTypes';

export interface CareerAnalyticalAxesSectionProps {
  readonly axes?: ProductCareerAnalyticalAxes;
}

function statusCopy(status: string, reason?: string): string {
  if (status === 'AVAILABLE') return 'Available in canonical Career output.';
  if (status === 'PARTIAL') return 'Partial evidence is available; limitations remain.';
  if (status === 'BLOCKED') return 'This axis is blocked by its canonical gate.';
  if (status === 'INSUFFICIENT') return 'The current evidence is insufficient for this axis.';
  if (status === 'NOT_APPLICABLE') return 'This axis is not applicable to the current profile.';
  return reason || 'This axis is unavailable in the current canonical Career output.';
}

export const CareerAnalyticalAxesSection: React.FC<CareerAnalyticalAxesSectionProps> = ({ axes }) => (
  <section id="career-risks" aria-labelledby="career-axes-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
    <header className="space-y-1">
      <h2 id="career-axes-heading" className="text-base font-semibold text-slate-100">Career Sustainability, Risk & Timing Context</h2>
      <p className="text-xs text-slate-400">B01 independent analytical axes. These are evidence dimensions, not a second Career score.</p>
    </header>
    {!axes ? (
      <p className="text-sm text-slate-400">Canonical analytical-axis projection is unavailable for this analysis.</p>
    ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AxisCard label="Natal promise" axis={axes.promise} renderResult={() => (
          axes.promise.result ? <p className="text-xs text-slate-300">{axes.promise.result.direction} · {axes.promise.result.strength}</p> : null
        )} />
        <AxisCard label="Activation" axis={axes.activation} renderResult={() => (
          axes.activation.result ? <p className="text-xs text-slate-300">{axes.activation.result.direction} · {axes.activation.result.effect} · Dominant level: {axes.activation.result.dominantLevel}</p> : null
        )} />
        <AxisCard label="Sustainability" axis={axes.sustainability} renderResult={() => (
          axes.sustainability.result ? <p className="text-xs text-slate-300">Assessment: {axes.sustainability.result.assessment}. Required evidence family: {axes.sustainability.result.requiredEvidenceFamily}.</p> : null
        )} />
        <AxisCard label="Risk and counter-evidence" axis={axes.risk} renderResult={() => (
          axes.risk.result ? <p className="text-xs text-slate-300">{axes.risk.result.assessment.replaceAll('_', ' ')} · {axes.risk.result.conflictCount} conflicts</p> : null
        )} />
        <AxisCard label="Timing" axis={axes.timing} renderResult={() => (
          axes.timing.result ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-300">{axes.timing.result.candidateWindows.length} indicative candidate window(s) · {axes.timing.result.untimedLevels.length} untimed level(s) · Guarantee: {axes.timing.result.guarantee}</p>
              {axes.timing.result.candidateWindows.map((window, index) => (
                <p key={`${window.level}-${window.planet ?? 'unknown'}-${index}`} className="text-xs text-slate-400">
                  {window.level} {window.planet ?? ''}: {window.dated ? `${window.start ?? 'Unknown'} to ${window.end ?? 'Unknown'}` : 'Untimed'} · {window.effect} · {window.direction}
                </p>
              ))}
            </div>
          ) : null
        )} />
      </div>
    )}
  </section>
);

type Axis = ProductCareerAnalyticalAxes['promise']
  | ProductCareerAnalyticalAxes['activation']
  | ProductCareerAnalyticalAxes['sustainability']
  | ProductCareerAnalyticalAxes['risk']
  | ProductCareerAnalyticalAxes['timing'];

const AxisCard: React.FC<{ label: string; axis: Axis; renderResult: () => React.ReactNode }> = ({ label, axis, renderResult }) => (
  <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-slate-200">{label}</h3>
      <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{axis.status}</span>
    </div>
    <p className="text-xs leading-relaxed text-slate-400">{statusCopy(axis.status, axis.unavailableReason)}</p>
    <p className="text-xs text-slate-300">Evidence coverage: {axis.coverage.status} · {axis.coverage.evidenceOccurrenceCount} occurrences</p>
    {axis.diagnostic && <p className="text-xs text-amber-300">{axis.diagnostic}</p>}
    {axis.coverage.missingSources.length > 0 && <p className="text-xs text-amber-300">Missing sources: {axis.coverage.missingSources.join(', ')}</p>}
    {axis.conflictingEvidenceOccurrenceIds.length > 0 && <p className="text-xs text-amber-300">Conflicting evidence occurrences: {axis.conflictingEvidenceOccurrenceIds.join(', ')}</p>}
    {renderResult()}
    <details className="text-[11px] text-slate-500">
      <summary className="cursor-pointer">Evidence and rule trace</summary>
      <p className="mt-2">Supporting: {axis.supportingEvidenceOccurrenceIds.join(', ') || 'None'}</p>
      <p>Conflicting: {axis.conflictingEvidenceOccurrenceIds.join(', ') || 'None'}</p>
      <p>Rules: {axis.ruleIds.join(', ') || 'None'}</p>
      <p>Method: {axis.methodVersion}</p>
    </details>
  </article>
);
