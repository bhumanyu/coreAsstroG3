import React from 'react';
import { Sparkles, BrainCircuit, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { PageHeading } from '../components/layout/PageHeading';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectReasoning, selectAi } from '../product/analysis/productAnalysisSelectors';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';

export interface ReasoningPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onNavigate?: (page: AppPage) => void;
}

export const ReasoningPage: React.FC<ReasoningPageProps> = ({
  productAnalysisState
}) => {
  if (productAnalysisState?.status === 'LOADING') {
    return <LifeAnalysisLoading />;
  }

  const reasoning = productAnalysisState?.analysis
    ? selectReasoning(productAnalysisState.analysis)
    : undefined;

  const ai = productAnalysisState?.analysis
    ? selectAi(productAnalysisState.analysis)
    : undefined;

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Explainable AI"
        title="Why This Result?"
        description="Transparent astrological reasoning hierarchy, deterministic rule triggers, and evidentiary provenance."
      />

      {reasoning && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">Reasoning Nodes</span>
            <span className="text-xl font-bold font-mono-code text-indigo-400">
              {reasoning.nodes.length}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">Primary Conclusions</span>
            <span className="text-xl font-bold font-mono-code text-indigo-400">
              {reasoning.primaryConclusions.length}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">Open Questions</span>
            <span className="text-xl font-bold font-mono-code text-indigo-400">
              {reasoning.unresolvedQuestions?.length ?? 0}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">AI Status</span>
            <span className="text-xl font-bold font-mono-code text-emerald-400">
              {ai?.status ?? 'READY'}
            </span>
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-md">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
          <BrainCircuit className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
          Astrological Reasoning & Evidence Trace
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          {ai?.conclusion
            ? ai.conclusion
            : 'The full evidentiary reasoning graph, planetary conflict reconciliations, rule execution trace, and classical justification links will be displayed here in the upcoming reasoning release.'}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            {ai?.providerInfo?.mode
              ? ai.providerInfo.mode
              : 'Deterministic Local Engine'}
          </span>
          {ai?.providerInfo?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Provider: {ai.providerInfo.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
