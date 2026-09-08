import React from 'react';
import type { ReasoningEvidenceViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatEvidenceRole,
  formatDirection,
  getEvidenceRoleBadgeClass,
  getDirectionBadgeClass
} from './reasoningFormat';
import { ReasoningProvenance } from './ReasoningProvenance';
import { ShieldCheck } from 'lucide-react';

export interface ReasoningEvidenceCardProps {
  readonly evidence: ReasoningEvidenceViewModel;
}

export const ReasoningEvidenceCard: React.FC<ReasoningEvidenceCardProps> = ({ evidence }) => {
  const roleLabel = formatEvidenceRole(evidence.role);
  const directionLabel = formatDirection(evidence.direction);
  const roleClass = getEvidenceRoleBadgeClass(evidence.role);
  const directionClass = getDirectionBadgeClass(evidence.direction);

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-200">{evidence.title}</span>
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
        {evidence.statement}
      </p>

      <ReasoningProvenance provenance={evidence.provenance} />
    </div>
  );
};
