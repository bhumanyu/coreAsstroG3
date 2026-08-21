import React from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, CircleAlert, Info } from 'lucide-react';
import type { LifeAnalysisEvidenceViewModel } from '../../product/life-analysis/lifeAnalysisTypes';

interface EvidenceSectionProps {
  readonly evidence: readonly LifeAnalysisEvidenceViewModel[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({ evidence }) => {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPPORTING':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CHALLENGING':
        return <CircleAlert className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPPORTING':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'CHALLENGING':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <details className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200">
      <summary className="p-5 flex items-center justify-between cursor-pointer list-none select-none hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Why? Astrological Evidence & Traceability</span>
              <span className="text-xs font-mono-code text-slate-400">
                ({evidence.length} facts)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Click to expand the deterministic evidence basis powering this synthesis
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="p-5 pt-0 border-t border-slate-800/60 mt-2 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {evidence.map((item) => (
            <article
              key={item.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono-code text-indigo-400 truncate">
                  {item.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${getRoleBadge(
                    item.role
                  )}`}
                >
                  {getRoleIcon(item.role)}
                  {item.role}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-serif-astro">
                {item.statement}
              </p>

              <div className="pt-1 text-[10px] font-mono-code text-slate-500 uppercase tracking-wider">
                Source: {item.source}
              </div>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
};
