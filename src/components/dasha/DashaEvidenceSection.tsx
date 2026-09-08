import React from 'react';
import type { DashaEvidenceViewModel } from '../../product/analysis/dashaViewModel';
import type { ProductEvidenceRole } from '../../product/analysis/productAnalysisTypes';
import {
  formatRole,
  formatDirection,
  getRoleBadgeClass,
  getDirectionBadgeClass
} from './dashaFormat';
import { Network, ArrowRight, ShieldCheck, Database } from 'lucide-react';

export interface DashaEvidenceSectionProps {
  readonly evidence: DashaEvidenceViewModel;
  readonly onOpenReasoning?: () => void;
}

const ROLES_ORDER: readonly ProductEvidenceRole[] = [
  'PRIMARY',
  'SUPPORTING',
  'CHALLENGING',
  'MODIFIER',
  'REFINEMENT',
  'CONFLICTING',
  'NEUTRAL'
];

export const DashaEvidenceSection: React.FC<DashaEvidenceSectionProps> = ({
  evidence,
  onOpenReasoning
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Network className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Evidential Reasoning Provenance</h2>
            <p className="text-xs text-slate-400">
              Rule-based factors, planetary aspects, and classical timing citations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-slate-800/60 border border-slate-700/80 text-slate-300">
            {evidence.total} {evidence.total === 1 ? 'Evidence Rule' : 'Evidence Rules'}
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

      {/* Role-Grouped Evidence List */}
      {evidence.total > 0 ? (
        <div className="space-y-4">
          {ROLES_ORDER.map((role) => {
            const items = evidence.groups[role] || [];
            if (items.length === 0) return null;

            const roleLabel = formatRole(role);
            const roleClass = getRoleBadgeClass(role);

            return (
              <div key={role} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleClass}`}
                  >
                    {roleLabel} ({items.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const directionLabel = formatDirection(item.direction);
                    const directionClass = getDirectionBadgeClass(item.direction);

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200 font-sans">
                            {item.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${directionClass}`}
                          >
                            {directionLabel}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {item.statement}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-[10px] font-mono-code text-slate-400">
                          {item.ruleId && (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                              <span>{item.ruleId}</span>
                            </span>
                          )}
                          {item.source && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Database className="w-3 h-3" aria-hidden="true" />
                              <span>{item.source}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
          No rule-based evidence items recorded.
        </div>
      )}
    </div>
  );
};
