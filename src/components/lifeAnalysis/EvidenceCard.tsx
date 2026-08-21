import React from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Compass,
  FileCode,
  Link2
} from 'lucide-react';
import type {
  EvidenceDetailViewModel
} from '../../product/life-analysis/lifeAnalysisEvidenceTypes';
import { formatDomainDisplayName } from '../../product/life-analysis/domainPresentationUtils';
import { formatEnum } from './lifeAnalysisUx';

interface EvidenceCardProps {
  readonly evidence: EvidenceDetailViewModel;
  readonly allEvidenceMap?: ReadonlyMap<string, EvidenceDetailViewModel>;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  allEvidenceMap
}) => {
  // Resolve related evidence IDs strictly against the rendered set
  const validRelatedItems = evidence.relatedEvidenceIds
    .map((id) => allEvidenceMap?.get(id))
    .filter((item): item is EvidenceDetailViewModel => item !== undefined);

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'PRIMARY':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'SECONDARY':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'CONFIRMATION':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'TIMING':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'MODIFIER':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getPolarityBadgeClasses = (polarity: string) => {
    switch (polarity) {
      case 'CONFLICTING':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'CHALLENGING':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'NEUTRAL':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      case 'SUPPORTING':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    }
  };

  return (
    <article
      id={`evidence-card-${evidence.id}`}
      className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 space-y-3 transition-colors flex flex-col justify-between"
    >
      <div className="space-y-2">
        {/* Header Badges: Domain, Evidence Role, and Polarity Effect */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded font-mono-code font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700/80"
              title="Astrological Life Domain"
            >
              {formatDomainDisplayName(evidence.domain)}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono-code font-semibold uppercase tracking-wider border ${getRoleBadgeClasses(
                evidence.role
              )}`}
              title={`Evidence Role: ${evidence.role}`}
            >
              {formatEnum(evidence.role)}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded font-mono-code font-semibold uppercase tracking-wider border ${getPolarityBadgeClasses(
              evidence.displayPolarity
            )}`}
            title={`Directional Effect: ${evidence.displayPolarity}`}
          >
            {formatEnum(evidence.displayPolarity)}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
          {evidence.title}
        </h4>

        {/* Statement */}
        <p className="text-xs text-slate-300 leading-relaxed font-serif-astro">
          {evidence.statement}
        </p>
      </div>

      {/* "Why is this relevant?" Disclosure */}
      <details className="group/details pt-2 border-t border-slate-800/60">
        <summary className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer select-none flex items-center gap-1 font-medium transition-colors list-none">
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-open/details:rotate-90 text-indigo-400" aria-hidden="true" />
          <span>Why is this relevant?</span>
        </summary>

        <div className="mt-2.5 pt-2 border-t border-slate-800/40 space-y-2 text-[11px] text-slate-300">
          {/* Source Fact */}
          <div className="flex items-start gap-2">
            <Compass className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <span className="text-slate-400 font-medium">Source: </span>
              <span className="text-slate-200">{evidence.source.label}</span>
              <span className="text-slate-500 text-[10px] ml-1.5 font-mono-code">
                ({evidence.source.type})
              </span>
            </div>
          </div>

          {/* Rule Metadata (only when defined) */}
          {evidence.rule && (
            <div className="flex items-start gap-2 bg-slate-900/60 border border-slate-800/60 rounded-lg p-2">
              <FileCode className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-300 font-medium">
                    {evidence.rule.name}
                  </span>
                  <span className="text-[9px] font-mono-code uppercase px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {evidence.rule.category}
                  </span>
                </div>
                {evidence.rule.description && (
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {evidence.rule.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chart Fact (only when present) */}
          {evidence.chartFact && (
            <div className="flex items-start gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 mt-0.5 shrink-0" aria-hidden="true">
                •
              </div>
              <div>
                <span className="text-slate-400 font-medium">
                  {evidence.chartFact.label}:{' '}
                </span>
                <span className="text-slate-200 font-mono-code">
                  {evidence.chartFact.value}
                </span>
              </div>
            </div>
          )}

          {/* Related Evidence links (only linking to rendered items) */}
          {validRelatedItems.length > 0 && (
            <div className="flex items-start gap-2 pt-1">
              <Link2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Related Factors:</span>
                <div className="flex flex-wrap gap-1">
                  {validRelatedItems.map((rel) => (
                    <span
                      key={rel.id}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      title={rel.statement}
                    >
                      {rel.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Traceability Status */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono-code text-slate-500 border-t border-slate-800/40">
            <span className="truncate" title={evidence.id}>
              ID: {evidence.id}
            </span>
            <div className="flex items-center gap-1 text-emerald-400 font-sans font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Verified Traceable</span>
            </div>
          </div>
        </div>
      </details>
    </article>
  );
};
