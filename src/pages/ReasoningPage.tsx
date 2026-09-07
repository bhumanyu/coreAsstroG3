import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { PageHeading } from '../components/layout/PageHeading';

export const ReasoningPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Explainable AI"
        title="Why This Result?"
        description="Transparent astrological reasoning hierarchy, deterministic rule triggers, and evidentiary provenance."
      />

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-md">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
          <BrainCircuit className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
          Astrological Reasoning & Evidence Trace
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          The full evidentiary reasoning graph, planetary conflict reconciliations, rule execution trace, and classical justification links will be displayed here in the upcoming reasoning release.
        </p>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Deterministic Local Engine
          </span>
        </div>
      </div>
    </div>
  );
};
