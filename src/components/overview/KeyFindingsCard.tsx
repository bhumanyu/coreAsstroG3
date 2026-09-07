import React from 'react';
import type { OverviewFinding } from '../../product/analysis/overviewViewModel';
import { formatDirection, formatEvidenceRole } from './overviewFormat';
import { Layers, CheckCircle } from 'lucide-react';

export interface KeyFindingsCardProps {
  readonly findings: readonly OverviewFinding[];
}

export const FindingRow: React.FC<{ readonly finding: OverviewFinding }> = ({ finding }) => {
  const roleText = formatEvidenceRole(finding.role);
  const directionText = formatDirection(finding.direction);

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-1">
          {finding.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            {roleText}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
            {directionText}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {finding.statement}
      </p>

      {finding.evidenceIds.length > 0 && (
        <div className="flex items-center gap-2 pt-1 text-[10px] font-mono-code text-slate-400">
          <span>Sources: {finding.evidenceIds.length} evidential rule {finding.evidenceIds.length === 1 ? 'input' : 'inputs'}</span>
        </div>
      )}
    </div>
  );
};

export const KeyFindingsCard: React.FC<KeyFindingsCardProps> = ({ findings }) => {
  return (
    <section
      aria-label="Key Cross-Domain Findings"
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Key Cross-Domain Findings
            </h3>
            <span className="text-xs text-slate-400">
              High-priority astrological synthesis drivers
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {findings.length > 0 ? (
            findings.map((f, idx) => (
              <FindingRow key={`${f.id}-${idx}`} finding={f} />
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" aria-hidden="true" />
              <span>No prominent findings generated for the current astrological chart.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
