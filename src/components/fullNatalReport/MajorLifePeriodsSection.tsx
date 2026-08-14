import React from 'react';
import { MajorLifePeriodsSection as MajorLifePeriodsSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatLifeThemeLabel, formatConfidence } from './reportUtils';
import { Calendar, Compass } from 'lucide-react';

interface MajorLifePeriodsSectionProps {
  readonly section: MajorLifePeriodsSectionType;
}

export const MajorLifePeriodsSection: React.FC<MajorLifePeriodsSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.periods || section.periods.length === 0) {
    return <EmptyState title="Major Life Periods Unavailable" message="Major life period data was not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Major life period data is partial." />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.periods.map((period) => (
          <div key={`${period.planet}-${period.start}-${period.end}`} className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-slate-100 font-serif-astro">
                  {formatPlanetName(period.planet)} Period
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Confidence: {formatConfidence(period.confidence)}
              </span>
            </div>

            {/* Timeline Dates */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono-code text-xs flex justify-between text-slate-300">
              <span>Start: <strong className="text-indigo-300">{period.start}</strong></span>
              <span>End: <strong className="text-indigo-300">{period.end}</strong></span>
            </div>

            {/* Focus Houses */}
            {period.primaryFocusHouses && period.primaryFocusHouses.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-[10px] font-mono-code uppercase text-slate-400 block">
                  Primary Focus Houses
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono-code text-xs">
                  {period.primaryFocusHouses.map((h) => (
                    <span key={h} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded font-semibold">
                      House {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Themes ONLY IF non-empty */}
            {period.keyThemes && period.keyThemes.length > 0 && (
              <div className="text-xs space-y-1 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] font-mono-code uppercase text-slate-400 block">
                  Key Themes
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono-code text-xs">
                  {period.keyThemes.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                      {formatLifeThemeLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
