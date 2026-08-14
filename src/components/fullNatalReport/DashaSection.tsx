import React from 'react';
import { VimshottariSection } from '../../types';
import { DashaMahadashaInterpretation } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatConfidence } from './reportUtils';
import { Calendar, Clock, Anchor } from 'lucide-react';

interface DashaSectionProps {
  readonly section: VimshottariSection;
}

export const DashaSection: React.FC<DashaSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.mahadashas || section.mahadashas.length === 0) {
    return <EmptyState title="Vimshottari Dasha Unavailable" message="Vimshottari timeline calculations were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Vimshottari dasha calculations are partial." />}

      {/* Anchor & Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.birthAnchor && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <Anchor className="w-3.5 h-3.5 text-indigo-400" /> Birth Dasha Anchor
            </span>
            <p className="text-xs font-mono-code text-slate-200">
              Nakshatra: <span className="font-bold text-indigo-300">{section.birthAnchor.nakshatra}</span> | Lord: <span className="font-bold text-purple-300">{formatPlanetName(section.birthAnchor.nakshatraLord)}</span>
            </p>
          </div>
        )}
        {section.confidence && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Timeline Confidence
            </span>
            <p className="text-xs font-mono-code font-bold text-indigo-300">
              {formatConfidence(section.confidence)}
            </p>
          </div>
        )}
      </div>

      {/* Responsive Mahadasha Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Vimshottari Mahadasha Sequence ({section.mahadashas.length})
        </h4>

        {/* Desktop Timeline */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {section.mahadashas.map((m: DashaMahadashaInterpretation, idx: number) => (
            <div key={`${m.planet}-${m.start}-${m.end}`} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 hover:border-indigo-500/50 transition-colors font-mono-code text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-bold text-indigo-300 font-serif-astro text-sm">
                  {formatPlanetName(m.planet)}
                </span>
                <span className="text-[10px] text-slate-500">#{idx + 1}</span>
              </div>
              <div className="space-y-0.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Start:</span>
                  <span>{m.start}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End:</span>
                  <span>{m.end}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Vertical Cards */}
        <div className="md:hidden space-y-2">
          {section.mahadashas.map((m: DashaMahadashaInterpretation, idx: number) => (
            <div key={`${m.planet}-${m.start}-${m.end}`} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
              <div>
                <span className="font-bold text-indigo-300 font-serif-astro text-sm block">
                  {formatPlanetName(m.planet)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {m.start} — {m.end}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
