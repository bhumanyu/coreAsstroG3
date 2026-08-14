import React from 'react';
import { HouseReportItem } from '../../types';
import { formatPlanetName, formatSignName } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { Home, User, Eye } from 'lucide-react';

interface HouseAnalysisCardProps {
  readonly item: HouseReportItem;
}

export const HouseAnalysisCard: React.FC<HouseAnalysisCardProps> = ({ item }) => {
  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4.5 space-y-3 hover:border-slate-700 transition-colors">
      {/* House Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono-code font-bold text-xs">
            H{item.house}
          </span>
          <span className="text-sm font-bold text-slate-100 font-serif-astro">
            House {item.house} • {formatSignName(item.sign)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-code">
          <span className="text-slate-400">Lord:</span>
          <span className="text-indigo-300 font-bold">{formatPlanetName(item.lord)}</span>
          {item.lordHouse !== undefined && (
            <span className="text-purple-300 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              In H{item.lordHouse}
            </span>
          )}
          {item.lordSign !== undefined && (
            <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              In {formatSignName(item.lordSign)}
            </span>
          )}
        </div>
      </div>

      {/* Occupants & Received Aspects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3 text-indigo-400" /> Occupants ({item.occupants?.length || 0})
          </span>
          {item.occupants && item.occupants.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.occupants.map((p) => (
                <span key={p} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono-code text-[11px] font-semibold">
                  {formatPlanetName(p)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic block pt-0.5">Unoccupied</span>
          )}
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-400" /> Received Aspects ({item.receivedAspects?.length || 0})
          </span>
          {item.receivedAspects && item.receivedAspects.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.receivedAspects.map((asp: { sourcePlanet?: string; aspectingPlanet?: string; planet?: string }, idx: number) => {
                const pName = asp.sourcePlanet || asp.aspectingPlanet || asp.planet || 'Aspect';
                return (
                  <span key={idx} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded font-mono-code text-[11px]">
                    {formatPlanetName(pName)}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-500 italic block pt-0.5">No Aspects Received</span>
          )}
        </div>
      </div>

      {/* Evidence */}
      {item.evidence && item.evidence.length > 0 && (
        <EvidenceList evidence={item.evidence} title={`Evidence for House ${item.house}`} />
      )}
    </div>
  );
};
