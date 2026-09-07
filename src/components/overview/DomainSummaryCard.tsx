import React from 'react';
import type { OverviewDomain } from '../../product/analysis/overviewViewModel';
import {
  formatStrength,
  formatConfidence,
  formatDirection,
  formatEvidenceRole
} from './overviewFormat';
import { Briefcase, Coins, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface DomainSummaryCardProps {
  readonly domain: OverviewDomain;
  readonly domainKey: 'career' | 'wealth';
  readonly onOpen?: () => void;
}

export const DomainSummaryCard: React.FC<DomainSummaryCardProps> = ({
  domain,
  domainKey,
  onOpen
}) => {
  const isCareer = domainKey === 'career';
  const Icon = isCareer ? Briefcase : Coins;
  const iconColor = isCareer ? 'text-indigo-400' : 'text-amber-400';
  const iconBg = isCareer ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-amber-500/10 border-amber-500/20';

  const strengthText = formatStrength(domain.strength);
  const confidenceText = formatConfidence(domain.confidence);

  return (
    <div
      aria-label={`${domain.name} Summary`}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {domain.name}
              </h3>
              <span className="text-xs text-slate-400">
                {isCareer ? 'Vocation & Status Potential' : 'Financial Capacity & Prosperity'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono-code bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              {strengthText}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
              {confidenceText}
            </span>
          </div>
        </div>

        {/* Synthesis Summary */}
        <div className="mt-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {domain.summary || 'Summary unavailable for this domain.'}
          </p>
        </div>

        {/* Top Evidentiary Drivers */}
        {domain.topEvidence.length > 0 && (
          <div className="mt-5 space-y-2.5">
            <h4 className="text-xs font-mono-code uppercase font-semibold text-slate-400 tracking-wider">
              Top Evidentiary Drivers
            </h4>
            <div className="space-y-2">
              {domain.topEvidence.map((evidence, idx) => (
                <div
                  key={`${evidence.id}-${idx}`}
                  className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200 line-clamp-1">
                      {evidence.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-code font-semibold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                        {formatEvidenceRole(evidence.role)}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
                        {formatDirection(evidence.direction)}
                      </span>
                    </div>
                  </div>
                  {evidence.statement && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {evidence.statement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {onOpen && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Deterministic Analysis</span>
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer group"
          >
            <span>{isCareer ? 'Explore Career Details' : 'Explore Wealth Details'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
