import React from 'react';
import { ThemeInterpretationEvidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { Clock, Info } from 'lucide-react';

interface ThemeTimingCardProps {
  readonly title?: string;
  readonly timingEvidence: readonly ThemeInterpretationEvidence<any>[];
  readonly id?: string;
}

export const ThemeTimingCard: React.FC<ThemeTimingCardProps> = ({
  title = 'Timing / Dasha Activation',
  timingEvidence,
  id
}) => {
  const safeItems = [...(timingEvidence || [])];

  return (
    <div
      id={id}
      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold font-serif-astro text-slate-100">
            {title}
          </h4>
        </div>
        <span className="text-xs font-mono-code text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          Vimshottari Windows
        </span>
      </div>

      {safeItems.length > 0 ? (
        <div className="space-y-2.5">
          {safeItems.map((item, idx) => {
            const timing = item.timingEvidence;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="font-mono-code font-bold text-slate-200 flex items-center gap-1.5">
                    {timing?.planet && (
                      <span className="text-indigo-300">{timing.planet}</span>
                    )}
                    {timing?.dashaLevel && (
                      <span className="text-[10px] text-slate-400 uppercase">
                        ({timing.dashaLevel})
                      </span>
                    )}
                  </div>

                  {timing?.relevanceType && (
                    <span className="text-[9px] font-mono-code bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase">
                      {timing.relevanceType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 font-sans leading-relaxed">
                  {item.statement}
                </p>

                {timing?.relevanceReason && (
                  <p className="text-[11px] text-slate-400 font-mono-code">
                    {timing.relevanceReason}
                  </p>
                )}

                {timing?.houses && timing.houses.length > 0 && (
                  <div className="text-[10px] font-mono-code text-slate-400">
                    Thematic Houses Activated: <span className="text-slate-200">{timing.houses.map((h) => `${h}H`).join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No current dasha period rulers have direct primary linkages to key thematic houses. The theme manifests through secondary transits and background natal dispositions.
        </p>
      )}

      {/* Methodological boundary note */}
      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          Timing activation highlights when thematic events are triggered in time; it does not alter the fundamental natal promise.
        </span>
      </div>
    </div>
  );
};
