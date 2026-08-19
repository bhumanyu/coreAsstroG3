import React from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import type { AiExplanationEvidence } from '../../ai/product/aiExplanationTypes';

interface AiExplanationEvidenceListProps {
  readonly title: string;
  readonly items: readonly AiExplanationEvidence[];
  readonly variant: 'supporting' | 'challenging';
}

export const AiExplanationEvidenceList: React.FC<AiExplanationEvidenceListProps> = ({
  title,
  items,
  variant
}) => {
  const supporting = variant === 'supporting';

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        {supporting ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <CircleAlert className="w-4 h-4 text-amber-400" />
        )}
        <h3 className="font-semibold text-slate-100">{title}</h3>
        <span className="text-[10px] font-mono-code text-slate-500">
          {items.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map(({ evidence }) => (
          <article
            key={evidence.id}
            className="rounded-xl bg-slate-950/60 border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono-code text-indigo-400">
                {evidence.id}
              </span>
              <div className="flex gap-2">
                {evidence.priority && (
                  <span className="text-[9px] uppercase tracking-wide text-slate-500">
                    {evidence.priority}
                  </span>
                )}
                <span className="text-[9px] uppercase tracking-wide text-slate-500">
                  {evidence.strength}
                </span>
              </div>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {evidence.statement}
            </p>

            <div className="mt-2 flex flex-wrap gap-2 text-[9px] uppercase tracking-wide text-slate-500">
              <span>Source: {evidence.source}</span>
              <span>•</span>
              <span>Effect: {evidence.effect}</span>
              {evidence.varga && (
                <>
                  <span>•</span>
                  <span>{evidence.varga}</span>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
