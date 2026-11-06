import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldCheck, ChevronRight, GitFork } from 'lucide-react';
import type { ProductEvidenceExperienceViewModel } from '../../product/analysis/productAnalysisTypes';

export interface EvidenceConfidencePanelProps {
  readonly model: ProductEvidenceExperienceViewModel;
}

const tone: Record<string, string> = {
  BLOCKED: 'border-rose-500/30 bg-rose-500/5 text-rose-200',
  WARNING: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
  UNAVAILABLE: 'border-slate-700 bg-slate-900 text-slate-300',
  CONFLICT: 'border-orange-500/30 bg-orange-500/5 text-orange-200',
  INFO: 'border-slate-700 bg-slate-900 text-slate-300'
};

export const EvidenceConfidencePanel: React.FC<EvidenceConfidencePanelProps> = ({ model }) => {
  const conflictIds = new Set(model.conflicts.map(item => item.id));
  return (
    <section aria-labelledby={`${model.domain.toLowerCase()}-evidence-confidence-title`}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 id={`${model.domain.toLowerCase()}-evidence-confidence-title`} className="text-base font-semibold text-slate-100">
            Evidence, confidence & limitations
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            What supports this conclusion, what is incomplete, and where evidence differs.
          </p>
        </div>
        <span className="text-xs rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200">
          {model.coverageLabel}
        </span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3" aria-label={`Confidence: ${model.confidenceLabel}`}>
          <p className="text-[11px] text-slate-400">Evidence confidence</p>
          <p className="mt-1 text-sm font-semibold text-indigo-200">{model.confidenceLabel}</p>
          <p className="mt-1 text-[11px] text-slate-400">Owned by {model.owner} domain synthesis</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
          <p className="text-[11px] text-slate-400">Promise strength</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{model.promiseStrengthLabel}</p>
          <p className="mt-1 text-[11px] text-slate-400">Strength describes the indication; confidence describes how well it is evidenced.</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">Evidence coverage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {model.layers.map(layer => (
            <div key={layer.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-200">{layer.label}</span>
                <span className={`text-[10px] rounded border px-1.5 py-0.5 ${layer.state === 'AVAILABLE' ? 'border-emerald-700/50 text-emerald-300' : layer.state === 'PARTIAL' ? 'border-amber-700/50 text-amber-300' : layer.state === 'BLOCKED' ? 'border-rose-700/50 text-rose-300' : 'border-slate-700 text-slate-400'}`}>
                  {layer.stateLabel}
                </span>
              </div>
              {layer.reason && <p className="mt-2 text-[11px] leading-5 text-slate-400">{layer.reason}</p>}
            </div>
          ))}
        </div>
      </div>

      {model.confidenceReasons.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Why this confidence level?</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-5 text-slate-300">
            {model.confidenceReasons.map((reason, index) => <li key={index}>{reason}</li>)}
          </ul>
        </div>
      )}

      {model.diagnostics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Limitations and diagnostics</h3>
          <div className="space-y-2">
            {model.diagnostics.map(diagnostic => {
              const Icon = diagnostic.state === 'BLOCKED' ? AlertCircle : diagnostic.state === 'WARNING' ? AlertTriangle : Info;
              return (
                <article key={diagnostic.id} className={`rounded-lg border p-3 ${tone[diagnostic.state] ?? tone.INFO}`}>
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold">{diagnostic.title}</h4>
                      <p className="mt-1 text-xs leading-5 opacity-90">{diagnostic.message}</p>
                      {diagnostic.technicalCode && (
                        <details className="mt-2 text-[10px] text-slate-400">
                          <summary className="cursor-pointer select-none">Technical detail</summary>
                          <code className="mt-1 block break-all">{diagnostic.technicalCode}</code>
                        </details>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-200">Evidence occurrences</h3>
          <span className="text-[11px] text-slate-400">{model.evidence.length} available</span>
        </div>
        {model.evidence.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
            No evidence occurrences are available for this conclusion. This is an evidence gap, not evidence of a negative outcome.
          </div>
        ) : (
          <div className="space-y-2">
            {model.evidence.map(item => (
              <article key={item.id} id={`d03-evidence-${item.id}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-100">{item.title}</h4>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{item.statement}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">{item.role.toLowerCase()}</span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] ${item.direction === 'SUPPORT' ? 'border-emerald-700/50 text-emerald-300' : item.direction === 'CHALLENGE' ? 'border-amber-700/50 text-amber-300' : item.direction === 'MIXED' || item.direction === 'UNAVAILABLE' ? 'border-orange-700/50 text-orange-300' : 'border-slate-700 text-slate-300'}`}>{item.direction.toLowerCase()}</span>
                    {conflictIds.has(item.id) && <span className="rounded border border-orange-700/50 px-2 py-0.5 text-[10px] text-orange-300">Mixed / challenging</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                  <span>Source: {item.sourceLabel}</span>
                </div>
                <details className="group rounded-lg border border-slate-800/80 px-2.5 py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" aria-hidden="true" />
                    Evidence provenance
                  </summary>
                  <div className="mt-2 space-y-2 text-[11px] text-slate-300">
                    {item.ruleId && <p>Rule reference: <code className="break-all text-slate-100">{item.ruleId}</code></p>}
                    <p>Evidence occurrence: <code className="break-all text-slate-100">{item.id}</code></p>
                    {item.resolvedRelatedEvidence.length > 0 && (
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-slate-400"><GitFork className="h-3 w-3" aria-hidden="true" /> Related evidence</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {item.resolvedRelatedEvidence.map(related => (
                            <li key={related.id}>
                              <a href={`#d03-evidence-${encodeURIComponent(related.id)}`} className="rounded border border-slate-700 px-2 py-1 text-indigo-300 hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                {related.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.unresolvedRelatedCount > 0 && (
                      <p className="text-amber-300">{item.unresolvedRelatedCount} related reference(s) are not available in this evidence list.</p>
                    )}
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
      {model.conflicts.length > 0 && (
        <div className="rounded-xl border border-orange-700/30 bg-orange-500/5 p-3">
          <h3 className="text-xs font-semibold text-orange-200">Conflicting or challenging evidence remains visible</h3>
          <p className="mt-1 text-xs text-slate-300">{model.conflicts.length} occurrence(s) contain mixed, unavailable, conflicting, or challenging semantics. They have not been suppressed from the evidence list.</p>
        </div>
      )}
    </section>
  );
};
