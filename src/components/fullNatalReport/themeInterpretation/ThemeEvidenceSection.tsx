import React, { useState } from 'react';
import {
  ThemeInterpretationEvidence,
  EvidenceFamilySummary
} from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { ThemeEvidenceGroup } from './ThemeEvidenceGroup';
import { formatEvidenceDimension } from './themeUiUtils';
import { Layers, Shield, Sparkles, Clock } from 'lucide-react';

interface DomainGroupConfig {
  readonly domainName: string;
  readonly families: readonly string[];
  readonly description?: string;
}

interface ThemeEvidenceSectionProps {
  readonly evidence: readonly ThemeInterpretationEvidence<any>[];
  readonly groupedEvidence?: Readonly<Partial<Record<string, readonly ThemeInterpretationEvidence<any>[]>>>;
  readonly familySummaries?: Readonly<Partial<Record<string, EvidenceFamilySummary<any>>>>;
  readonly customDomainGroups?: readonly DomainGroupConfig[];
  readonly id?: string;
}

export const ThemeEvidenceSection: React.FC<ThemeEvidenceSectionProps> = ({
  evidence,
  groupedEvidence,
  familySummaries,
  customDomainGroups,
  id
}) => {
  const [selectedTab, setSelectedTab] = useState<'DIMENSION' | 'FAMILY'>('DIMENSION');

  // Copy without mutating frozen objects
  const allEvidence = [...(evidence || [])];
  if (allEvidence.length === 0) return null;

  // Group by dimension
  const structural = allEvidence.filter(
    (e) => e.dimension === 'NATAL_STRUCTURE' || (!e.dimension && (e.priority === 'PRIMARY' || e.priority === 'SECONDARY'))
  );
  const modifiers = allEvidence.filter(
    (e) => e.dimension === 'MODIFIER'
  );
  const confirmation = allEvidence.filter(
    (e) => e.dimension === 'CONFIRMATION' || e.priority === 'CONFIRMATORY'
  );
  const timing = allEvidence.filter(
    (e) => e.dimension === 'TIMING' || e.priority === 'TIMING'
  );

  return (
    <div id={id} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
        <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-400" /> Evidence Hierarchy & Detailed Factors ({allEvidence.length})
        </h4>

        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono-code">
          <button
            type="button"
            onClick={() => setSelectedTab('DIMENSION')}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedTab === 'DIMENSION'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Dimension
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('FAMILY')}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedTab === 'FAMILY'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Factor Family
          </button>
        </div>
      </div>

      {selectedTab === 'DIMENSION' ? (
        <div className="space-y-4">
          {/* Dimension 1: Natal Structure */}
          {structural.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold uppercase text-indigo-400">
                <Shield className="w-3.5 h-3.5" /> {formatEvidenceDimension('NATAL_STRUCTURE')} ({structural.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Core foundation: houses, lords, and direct architectural connections forming the fundamental promise.
              </p>
              <ThemeEvidenceGroup
                title="Natal Structural Evidence"
                evidence={structural}
                id={`${id || 'ev'}-dim-structural`}
              />
            </div>
          )}

          {/* Dimension 2: Modifiers */}
          {modifiers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold uppercase text-amber-400">
                <Sparkles className="w-3.5 h-3.5" /> {formatEvidenceDimension('MODIFIER')} ({modifiers.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Natural significators, functional nature, planetary strength (Shadbala), and special aspect modifiers.
              </p>
              <ThemeEvidenceGroup
                title="Modifiers & Natural Significators"
                evidence={modifiers}
                id={`${id || 'ev'}-dim-modifiers`}
              />
            </div>
          )}

          {/* Dimension 3: Confirmation */}
          {confirmation.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold uppercase text-teal-400">
                <Sparkles className="w-3.5 h-3.5" /> {formatEvidenceDimension('CONFIRMATION')} ({confirmation.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Special classical yogas and divisional chart confirmations supporting or refining the promise.
              </p>
              <ThemeEvidenceGroup
                title="Confirmation & Yogas"
                evidence={confirmation}
                id={`${id || 'ev'}-dim-confirmation`}
              />
            </div>
          )}

          {/* Dimension 4: Timing */}
          {timing.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold uppercase text-indigo-300">
                <Clock className="w-3.5 h-3.5" /> {formatEvidenceDimension('TIMING')} ({timing.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Vimshottari Dasha periods linking active period lords to thematic houses and promise activation.
              </p>
              <ThemeEvidenceGroup
                title="Timing & Dasha Activation"
                evidence={timing}
                id={`${id || 'ev'}-dim-timing`}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Custom Domain Groups (e.g. Wealth 2H+2L combined) if provided */}
          {customDomainGroups && customDomainGroups.length > 0 ? (
            customDomainGroups.map((group, idx) => {
              const groupEvidence = allEvidence.filter((e) =>
                group.families.includes(e.evidenceFamily)
              );
              if (groupEvidence.length === 0) return null;

              return (
                <div key={idx} className="space-y-1">
                  {group.description && (
                    <p className="text-[11px] text-slate-400 pl-1">{group.description}</p>
                  )}
                  <ThemeEvidenceGroup
                    title={group.domainName}
                    evidence={groupEvidence}
                    id={`${id || 'ev'}-domain-${idx}`}
                  />
                </div>
              );
            })
          ) : (
            /* Otherwise group by individual families */
            groupedEvidence &&
            Object.entries(groupedEvidence).map(([famKey, famEvidence]) => {
              if (!famEvidence || famEvidence.length === 0) return null;
              const summary = familySummaries?.[famKey];

              return (
                <ThemeEvidenceGroup
                  key={famKey}
                  family={famKey}
                  evidence={famEvidence}
                  status={summary?.status}
                  id={`${id || 'ev'}-fam-${famKey}`}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
