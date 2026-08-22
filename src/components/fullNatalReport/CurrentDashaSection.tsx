import React from 'react';
import { CurrentDashaSection as CurrentDashaSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatConfidence } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { Sparkles, Calendar } from 'lucide-react';

interface CurrentDashaSectionProps {
  readonly section: CurrentDashaSectionType;
  readonly onNavigateToDashaTiming?: () => void;
}

export const CurrentDashaSection: React.FC<CurrentDashaSectionProps> = ({
  section,
  onNavigateToDashaTiming
}) => {
  if (section.status === 'UNAVAILABLE' || !section.current) {
    return <EmptyState title="Active Dasha Period Unavailable" message="Active dasha calculations were not provided in the report." />;
  }

  const { current } = section;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {section.status === 'PARTIAL' ? (
          <PartialStateNotice message="Active dasha period details are partial." />
        ) : <div />}
        {onNavigateToDashaTiming && (
          <button
            type="button"
            onClick={onNavigateToDashaTiming}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors cursor-pointer"
          >
            <span>Open Dedicated Dasha & Timing View</span>
          </button>
        )}
      </div>

      {/* Main Active Dasha Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mahadasha */}
        {current.mahadasha && (
          <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400 block">
              Major Period (Mahadasha)
            </span>
            <p className="text-xl font-bold font-serif-astro text-slate-100">
              {formatPlanetName(current.mahadasha.planet)}
            </p>
            <p className="text-xs font-mono-code text-slate-300">
              {current.mahadasha.start} — {current.mahadasha.end}
            </p>
          </div>
        )}

        {/* Antardasha */}
        {current.antardasha && (
          <div className="bg-gradient-to-b from-purple-950/40 to-slate-950 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-purple-400 block">
              Sub-Period (Antardasha)
            </span>
            <p className="text-xl font-bold font-serif-astro text-slate-100">
              {formatPlanetName(current.antardasha.planet)}
            </p>
            <p className="text-xs font-mono-code text-slate-300">
              {current.antardasha.start} — {current.antardasha.end}
            </p>
          </div>
        )}

        {/* Pratyantardasha */}
        {current.pratyantardasha && (
          <div className="bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-400 block">
              Sub-Sub-Period (Pratyantardasha)
            </span>
            <p className="text-xl font-bold font-serif-astro text-slate-100">
              {formatPlanetName(current.pratyantardasha.planet)}
            </p>
            <p className="text-xs font-mono-code text-slate-300">
              {current.pratyantardasha.start} — {current.pratyantardasha.end}
            </p>
          </div>
        )}
      </div>

      {/* Confidence */}
      {current.confidence && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs font-mono-code flex items-center justify-between">
          <span className="text-slate-400">Interpretation Confidence:</span>
          <span className="font-bold text-indigo-300">{formatConfidence(current.confidence)}</span>
        </div>
      )}

      {/* Evidence */}
      {current.evidence && current.evidence.length > 0 && (
        <EvidenceList evidence={current.evidence} title="Active Dasha Interpretation Evidence" />
      )}
    </div>
  );
};
