import React from 'react';
import type { ReasoningConclusionViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatConfidence,
  formatConclusionStatus,
  formatPromiseStrength,
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass
} from './reasoningFormat';
import { Sparkles, ShieldCheck, CheckCircle2, XCircle, Database } from 'lucide-react';

export interface ReasoningConclusionProps {
  readonly conclusion: ReasoningConclusionViewModel;
}

export const ReasoningConclusion: React.FC<ReasoningConclusionProps> = ({ conclusion }) => {
  const formattedConfidence = formatConfidence(conclusion.confidence);
  const formattedStatus = formatConclusionStatus(conclusion.status);
  const formattedStrength = formatPromiseStrength(conclusion.strength);
  const statusBadgeClass = getConclusionStatusBadgeClass(conclusion.status);
  const strengthBadgeClass = getPromiseStrengthBadgeClass(conclusion.strength);

  const title = conclusion.integratedSynthesisAvailable
    ? 'Synthesized Astrological Verdict'
    : 'Astrological Reasoning Verdict';
  const subtitle = conclusion.integratedSynthesisAvailable
    ? 'Unified conclusion synthesizing foundational promise, divisional validation, and active planetary timing'
    : 'Natal promise and available evidentiary activations indicate…';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${statusBadgeClass}`}>
            {formattedStatus}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${strengthBadgeClass}`}>
            {formattedStrength}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {formattedConfidence}
          </span>
        </div>
      </div>

      {conclusion.headline && (
        <h3 className="text-sm font-semibold text-slate-100">
          {conclusion.headline}
        </h3>
      )}

      {conclusion.statement && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {conclusion.statement}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code">
          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/80">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            {conclusion.evidenceCount} Evidence Items
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            {conclusion.supportingEvidenceCount} Supporting
          </span>
          <span className="flex items-center gap-1.5 text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/60">
            <XCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
            {conclusion.challengingEvidenceCount} Challenging
          </span>
        </div>

        {conclusion.provenanceAvailable && (
          <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-800/60 font-mono-code">
            <Database className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
            <span>Rule Provenance Available</span>
          </div>
        )}
      </div>
    </div>
  );
};
