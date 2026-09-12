/**
 * Reasoning Overall Conclusion Component (P-UI-08)
 *
 * Unified panel displaying both Career and Wealth conclusions side-by-side
 * regardless of the currently selected active domain.
 * Maintains PromiseStrength, ConclusionStatus, ProductConfidence, and Availability
 * as four separate canonical fields (§26).
 * Renders "Unavailable" when a domain is UNAVAILABLE — never fabricates (§32, §57).
 */

import React from 'react';
import type {
  ReasoningOverviewViewModel,
  ReasoningDomainOverviewItem,
  ReasoningDomain
} from '../../product/analysis/reasoningViewModel';
import {
  formatConclusionStatus,
  formatPromiseStrength,
  formatConfidence,
  formatAvailability,
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass,
  getAvailabilityBadgeClass
} from './reasoningFormat';
import {
  Briefcase,
  Coins,
  ShieldCheck,
  BrainCircuit,
  Compass,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export interface ReasoningOverallConclusionProps {
  readonly overview: ReasoningOverviewViewModel;
  readonly selectedDomain?: ReasoningDomain;
  readonly onSelectDomain?: (domain: ReasoningDomain) => void;
}

interface DomainConclusionCardProps {
  readonly item: ReasoningDomainOverviewItem;
  readonly isSelected?: boolean;
  readonly onSelect?: () => void;
}

const DomainConclusionCard: React.FC<DomainConclusionCardProps> = ({
  item,
  isSelected,
  onSelect
}) => {
  const isCareer = item.domain === 'CAREER';
  const Icon = isCareer ? Briefcase : Coins;
  const isUnavailable = item.availability === 'UNAVAILABLE' || item.status === 'UNAVAILABLE';

  const statusBadgeClass = getConclusionStatusBadgeClass(item.status);
  const strengthBadgeClass = getPromiseStrengthBadgeClass(item.strength);
  const availabilityBadgeClass = getAvailabilityBadgeClass(item.availability);

  return (
    <div
      id={`overall-conclusion-${item.domain.toLowerCase()}`}
      className={`relative flex flex-col justify-between rounded-xl p-5 transition-all border ${
        isSelected
          ? 'bg-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-950/30'
          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isCareer
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                {isCareer ? 'Career Domain' : 'Wealth Domain'}
              </h3>
              <span className="text-[11px] font-mono-code text-slate-400">
                {item.title || (isCareer ? 'Vocational Architecture' : 'Financial Synthesis')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-medium border ${availabilityBadgeClass}`}
              title="Availability Status"
            >
              {formatAvailability(item.availability)}
            </span>
            {isSelected && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Viewing
              </span>
            )}
          </div>
        </div>

        {/* Four Distinct Fields (§26) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono-code block mb-1">Conclusion Status</span>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusBadgeClass}`}>
              <BrainCircuit className="w-3 h-3" aria-hidden="true" />
              <span>{formatConclusionStatus(item.status)}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono-code block mb-1">Promise Strength</span>
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono-code font-medium border ${strengthBadgeClass}`}>
              <span>{formatPromiseStrength(item.strength)}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono-code block mb-1">Product Confidence</span>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono-code bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <ShieldCheck className="w-3 h-3 text-indigo-400" aria-hidden="true" />
              <span>{formatConfidence(item.confidence)}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono-code block mb-1">Data Availability</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono-code border ${availabilityBadgeClass}`}>
              {formatAvailability(item.availability)}
            </span>
          </div>
        </div>

        {/* Narrative / Headline / Statement */}
        <div className="pt-1">
          {isUnavailable ? (
            <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="font-semibold">
                  {item.headline ?? (isCareer ? 'Career Analysis Unavailable' : 'Wealth Analysis Unavailable')}
                </span>
              </div>
              {item.statement && (
                <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                  {item.statement}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {item.headline && (
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {item.headline}
                </h4>
              )}
              {item.statement && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {item.statement}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer / Selector */}
      {onSelect && (
        <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono-code">
            {isSelected ? 'Currently Selected' : 'Switch to this domain'}
          </span>
          <button
            type="button"
            id={`btn-select-domain-${item.domain.toLowerCase()}`}
            onClick={onSelect}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{isSelected ? 'Active Details' : 'View Reasoning'}</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export const ReasoningOverallConclusion: React.FC<ReasoningOverallConclusionProps> = ({
  overview,
  selectedDomain,
  onSelectDomain
}) => {
  return (
    <div
      id="reasoning-overall-conclusion-panel"
      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Overall Conclusion</h2>
            <p className="text-xs text-slate-400">
              Cross-domain synthesis comparing Career vocational strength and Wealth financial potential
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <span>Unified Summary</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DomainConclusionCard
          item={overview.career}
          isSelected={selectedDomain === 'CAREER'}
          onSelect={onSelectDomain ? () => onSelectDomain('CAREER') : undefined}
        />
        <DomainConclusionCard
          item={overview.wealth}
          isSelected={selectedDomain === 'WEALTH'}
          onSelect={onSelectDomain ? () => onSelectDomain('WEALTH') : undefined}
        />
      </div>
    </div>
  );
};
