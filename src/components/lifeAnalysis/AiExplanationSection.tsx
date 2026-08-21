import React from 'react';
import { Sparkles, Brain, AlertCircle } from 'lucide-react';
import type { AiExplanationResult } from '../../ai';
import { AiExplanationEvidenceList } from '../ai/AiExplanationEvidenceList';

interface AiExplanationSectionProps {
  readonly explanation?: AiExplanationResult;
}

export const AiExplanationSection: React.FC<AiExplanationSectionProps> = ({
  explanation
}) => {
  if (!explanation) {
    return (
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center flex items-center justify-center gap-3 text-slate-400">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="text-xs sm:text-sm font-medium text-slate-300">
          AI synthesis narrative explanation not requested or unavailable.
        </span>
      </section>
    );
  }

  if (explanation.kind === 'ERROR') {
    return (
      <section className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>AI Explanation Note</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Deterministic life domain analysis is fully computed and available above. AI natural language explanation could not be generated: {explanation.message}
        </p>
      </section>
    );
  }

  return (
    <section className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 space-y-6 shadow-lg shadow-purple-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                AI Synthesis Explanation
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                {explanation.task}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI explanation based on the verified deterministic analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono-code text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {explanation.routingMode}
          </span>
          <span>•</span>
          <span>{new Date(explanation.generatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Conclusion Statement */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono-code text-purple-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Synthesized Interpretation
        </h3>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif-astro">
          {explanation.conclusion}
        </p>
      </div>

      {/* Supporting / Challenging Evidence Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {explanation.supportingEvidence.length > 0 && (
          <AiExplanationEvidenceList
            title="Supporting Synthesis Factors"
            items={explanation.supportingEvidence}
            variant="supporting"
          />
        )}

        {explanation.challengingEvidence.length > 0 && (
          <AiExplanationEvidenceList
            title="Challenging Synthesis Factors"
            items={explanation.challengingEvidence}
            variant="challenging"
          />
        )}
      </div>
    </section>
  );
};
