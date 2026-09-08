import React from 'react';
import type { CareerEvidenceViewModel } from '../../product/analysis/careerViewModel';
import {
  formatEvidenceRole,
  formatDirection,
  getEvidenceRoleBadgeClass,
  getDirectionBadgeClass
} from './careerFormat';
import { Network, ArrowRight, ShieldCheck, Database, GitFork } from 'lucide-react';

export interface CareerEvidenceSectionProps {
  readonly evidence: readonly CareerEvidenceViewModel[];
  readonly onOpenReasoning?: () => void;
}

export const CareerEvidenceSection: React.FC<CareerEvidenceSectionProps> = ({
  evidence,
  onOpenReasoning
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Network className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Evidential Reasoning Provenance</h2>
            <p className="text-xs text-slate-400">Rule-based factors, planetary aspects, and classical yoga citations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {evidence.length} {evidence.length === 1 ? 'Evidence Rule' : 'Evidence Rules'}
          </span>

          {onOpenReasoning && (
            <button
              type="button"
              onClick={onOpenReasoning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <span>Explore Reasoning Graph</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
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
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-200">{item.title}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleClass}`}>
                    {roleLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}
                  >
                    {directionLabel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.statement}</p>

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/40 text-[11px] text-slate-400 font-mono-code">
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-500" aria-hidden="true" />
                  <span>Source: {item.source}</span>
                </div>

                {item.ruleId && <span className="text-slate-500">| Rule: {item.ruleId}</span>}

                {item.derivedFromIds.length > 0 && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <GitFork className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                    <span>Provenance: {item.derivedFromIds.join(', ')}</span>
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
