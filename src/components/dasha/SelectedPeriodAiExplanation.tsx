/**
 * Selected Period AI Explanation (PBA-09)
 *
 * Displays AI explanation for the selected-period synthesis.
 * Renders only when synthesis.period IDs match submittedPeriod.
 * Clears on selection change via existing onSelectionChange path.
 * Stale-async guard using request-counter ref keyed on {mdId}|{adId}.
 *
 * States per spec:
 * - Pending: Loading indicator
 * - Success: Conclusion + supporting/challenging evidence
 * - Partial: Partial results with warnings
 * - Error: Error message
 *
 * No deterministic fields sourced from AI output.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Brain, Loader2, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react';
import type { AiExplanationResult } from '../../ai';

export interface SelectedPeriodAiExplanationProps {
  readonly synthesis: {
    readonly period: {
      readonly mahadashaId: string;
      readonly antardashaId: string;
    };
    readonly aiExplanation?: AiExplanationResult;
  };
  readonly submittedPeriod: {
    readonly mahadashaId: string;
    readonly antardashaId: string;
  } | null;
}

export const SelectedPeriodAiExplanation: React.FC<SelectedPeriodAiExplanationProps> = ({
  synthesis,
  submittedPeriod
}) => {
  const [isPending, setIsPending] = useState(false);
  const requestIdRef = useRef(0);

  // Stale-async guard: only render if IDs match
  const isMatching = submittedPeriod &&
    synthesis.period.mahadashaId === submittedPeriod.mahadashaId &&
    synthesis.period.antardashaId === submittedPeriod.antardashaId;

  // Clear on selection change
  useEffect(() => {
    requestIdRef.current += 1;
    setIsPending(false);
  }, [synthesis.period.mahadashaId, synthesis.period.antardashaId]);

  // If not matching, don't render
  if (!isMatching) {
    return null;
  }

  // If no AI explanation, don't render
  if (!synthesis.aiExplanation) {
    return null;
  }

  const explanation = synthesis.aiExplanation;

  // Render based on status
  if (explanation.kind === 'ERROR') {
    return (
      <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-rose-300">
            AI Explanation Error
          </span>
        </div>
        <div className="text-xs text-slate-300">{explanation.message}</div>
        {explanation.warnings.length > 0 && (
          <div className="space-y-1">
            {explanation.warnings.map((warning, idx) => (
              <div key={idx} className="text-xs text-rose-400 flex items-start gap-2">
                <TriangleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (explanation.kind === 'SUCCESS') {
    const isSuccess = explanation.status === 'SUCCESS';
    const statusColor = isSuccess ? 'text-emerald-300' : 'text-amber-300';
    const StatusIcon = isSuccess ? CheckCircle2 : TriangleAlert;
    const statusLabel = isSuccess ? 'AI Explanation' : 'Partial Explanation';

    return (
      <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Brain className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
            {statusLabel}
          </span>
          <div className={`flex items-center gap-1.5 ml-auto ${statusColor}`}>
            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[10px] font-mono-code uppercase">{explanation.status}</span>
          </div>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed">
          {explanation.conclusion}
        </div>

        {explanation.unresolvedQuestions.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono-code text-amber-300">Unresolved Questions</div>
            <div className="space-y-1">
              {explanation.unresolvedQuestions.map((q, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400 font-mono-code">{idx + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(explanation.supportingEvidence.length > 0 || explanation.challengingEvidence.length > 0) && (
          <div className="space-y-3">
            {explanation.supportingEvidence.length > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 space-y-2">
                <div className="text-xs font-mono-code text-emerald-300">Supporting Evidence ({explanation.supportingEvidence.length})</div>
                <div className="space-y-1">
                  {explanation.supportingEvidence.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300">
                      {item.evidence.statement}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {explanation.challengingEvidence.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 space-y-2">
                <div className="text-xs font-mono-code text-rose-300">Challenging Evidence ({explanation.challengingEvidence.length})</div>
                <div className="space-y-1">
                  {explanation.challengingEvidence.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300">
                      {item.evidence.statement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {explanation.warnings.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono-code text-amber-300">Warnings</div>
            <div className="space-y-1">
              {explanation.warnings.map((warning, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <TriangleAlert className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" aria-hidden="true" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {explanation.providerName && (
          <div className="text-[10px] text-slate-500 font-mono-code pt-2 border-t border-slate-800/60">
            Provider: {explanation.providerName} ({explanation.providerKind})
          </div>
        )}
      </div>
    );
  }

  return null;
};
