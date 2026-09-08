import React from 'react';
import type { WealthEvidenceViewModel } from '../../product/analysis/wealthViewModel';
import {
  formatDirection,
  formatEvidenceRole,
  getDirectionBadgeClass,
  getEvidenceRoleBadgeClass
} from './wealthFormat';
import { FileText, GitFork, ArrowUpRight, BookOpen } from 'lucide-react';

export interface WealthEvidenceSectionProps {
  readonly evidence: readonly WealthEvidenceViewModel[];
  readonly onOpenReasoning?: () => void;
}

export const WealthEvidenceSection: React.FC<WealthEvidenceSectionProps> = ({
  evidence,
  onOpenReasoning
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Evidential Reasoning Provenance</h2>
            <p className="text-xs text-slate-400">Rule-based factors, Dhana yogas, and classical citations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {evidence.length} {evidence.length === 1 ? 'Factor' : 'Factors'}
          </span>
          {onOpenReasoning && (
            <button
              type="button"
              onClick={onOpenReasoning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Explore Reasoning Graph</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {evidence.map((item) => {
          const roleLabel = formatEvidenceRole(item.role);
          const directionLabel = formatDirection(item.direction);
          const roleClass = getEvidenceRoleBadgeClass(item.role);
          const directionClass = getDirectionBadgeClass(item.direction);

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code text-slate-400">
                    {item.id}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleClass}`}>
                    {roleLabel}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}>
                    {directionLabel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {item.statement}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono-code text-slate-400 border-t border-slate-900">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  <span>{item.source}</span>
                  {item.ruleId && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400">{item.ruleId}</span>
                    </>
                  )}
                </div>

                {item.derivedFromIds && item.derivedFromIds.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Derived from:</span>
                    <span className="text-slate-300 font-mono-code">
                      {item.derivedFromIds.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
