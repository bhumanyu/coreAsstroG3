import React from 'react';
import { AscendantSection as AscendantSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatLongitude, formatPlanetName, formatSignName } from './reportUtils';
import { Compass, User, Eye } from 'lucide-react';

interface AscendantSectionProps {
  readonly section: AscendantSectionType;
}

export const AscendantSection: React.FC<AscendantSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title="Ascendant Analysis Unavailable" message="Ascendant details were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Ascendant data is partial." />}

      {/* Main Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {section.sign !== undefined && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Lagna Sign</span>
            <span className="text-sm font-bold font-serif-astro text-slate-100">{formatSignName(section.sign)}</span>
          </div>
        )}

        {section.longitude !== undefined && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Lagna Longitude</span>
            <span className="text-sm font-mono-code text-slate-200">{formatLongitude(section.longitude)}</span>
          </div>
        )}

        {section.lord !== undefined && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Lagna Lord</span>
            <span className="text-sm font-bold text-indigo-300">{formatPlanetName(section.lord)}</span>
          </div>
        )}

        {section.lordHouse !== undefined && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Lord In House</span>
            <span className="text-sm font-mono-code font-bold text-purple-300">House {section.lordHouse}</span>
          </div>
        )}

        {section.lordSign !== undefined && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Lord In Sign</span>
            <span className="text-sm font-serif-astro text-slate-200">{formatSignName(section.lordSign)}</span>
          </div>
        )}
      </div>

      {/* Occupants & Received Aspects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Occupants */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Occupant Planets ({section.occupants.length})
          </span>
          {section.occupants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {section.occupants.map((planet) => (
                <span key={planet} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-mono-code font-semibold">
                  {formatPlanetName(planet)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No occupant planets in 1st House</p>
          )}
        </div>

        {/* Received Aspects */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" /> Received Graha Drishti ({section.receivedAspects.length})
          </span>
          {section.receivedAspects.length > 0 ? (
            <div className="space-y-1.5">
              {section.receivedAspects.map((aspect, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs flex items-center justify-between font-mono-code">
                  <span className="text-indigo-300 font-semibold">{formatPlanetName(aspect.sourcePlanet)}</span>
                  <span className="text-slate-400 text-[11px]">{aspect.aspectType} (from H{aspect.sourceHouse})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No received aspects on Lagna</p>
          )}
        </div>
      </div>
    </div>
  );
};
