import React from 'react';
import { PlanetReportItem } from '../../types';
import { formatLongitude, formatPlanetName, formatSignName } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { Compass, Eye, Shield, Flame } from 'lucide-react';

interface PlanetAnalysisCardProps {
  readonly item: PlanetReportItem;
}

export const PlanetAnalysisCard: React.FC<PlanetAnalysisCardProps> = ({ item }) => {
  const nakshatraName = item.nakshatraMetadata?.englishName || item.nakshatraResult?.nakshatra || 'N/A';
  const pada = item.nakshatraResult?.padaNumber || 'N/A';
  const dignityStatus = typeof item.dignity === 'string' ? item.dignity : (item.dignity as { status?: string } | undefined)?.status || 'NEUTRAL';
  const stateCondition = item.state?.condition || 'NORMAL';
  const isRetrograde = item.state?.motion?.retrograde;

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4.5 space-y-3.5 hover:border-slate-700 transition-colors">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold text-slate-100 font-serif-astro">
            {formatPlanetName(item.planet)}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
            {formatSignName(item.sign)} • House {item.house}
          </span>
          <span className="text-xs font-mono-code text-slate-400">
            {formatLongitude(item.longitude)}
          </span>
        </div>

        {/* Dignity and State Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isRetrograde && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              [R] Retrograde
            </span>
          )}
          {stateCondition !== 'NORMAL' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              {stateCondition}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${
              dignityStatus === 'EXALTED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : dignityStatus === 'DEBILITATED'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : dignityStatus === 'MOOLATRIKONA' || dignityStatus === 'OWN_SIGN'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {dignityStatus}
          </span>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Nakshatra */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Nakshatra & Pada</span>
          <p className="font-semibold text-slate-200 font-mono-code">
            {nakshatraName} <span className="text-indigo-400">(Pada {pada})</span>
          </p>
        </div>

        {/* Functional Roles */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Functional Roles</span>
          <p className="font-semibold text-purple-300">
            {item.functionalRoles && item.functionalRoles.length > 0
              ? item.functionalRoles.join(', ')
              : 'None'}
          </p>
        </div>

        {/* Aspects Cast / Received Summary */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Aspect Interaction</span>
          <p className="text-slate-300 font-mono-code text-[11px]">
            Cast: <span className="text-indigo-300 font-bold">{item.castAspects?.length || 0}</span> | Received: <span className="text-purple-300 font-bold">{item.receivedAspects?.length || 0}</span>
          </p>
        </div>
      </div>

      {/* Evidence */}
      {item.evidence && item.evidence.length > 0 && (
        <EvidenceList evidence={item.evidence} title={`Evidence for ${formatPlanetName(item.planet)}`} />
      )}
    </div>
  );
};
