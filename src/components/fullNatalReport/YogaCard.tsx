import React from 'react';
import { YogaReportItem } from '../../types';
import { YogaModifier } from '../../engine/yoga/yogaTypes';
import { formatPlanetName, formatYogaCategory } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { Sparkles } from 'lucide-react';

interface YogaCardProps {
  readonly yoga: YogaReportItem;
}

export const YogaCard: React.FC<YogaCardProps> = ({ yoga }) => {
  const status = yoga.finalStatus || 'PRESENT';

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
      {/* Yoga Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold font-serif-astro text-slate-100">
              {yoga.type}
            </h4>
          </div>
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block mt-0.5">
            Category: {formatYogaCategory(yoga.category)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {yoga.strength && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Strength: {yoga.strength}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${
              status === 'STRONG'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : status === 'WEAKENED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : status === 'CANCELLED'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Involved Planets and Houses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Involved Planets</span>
          <span className="font-semibold text-indigo-300 font-mono-code">
            {yoga.planets && yoga.planets.length > 0
              ? yoga.planets.map(formatPlanetName).join(', ')
              : 'N/A'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Involved Houses</span>
          <span className="font-semibold text-purple-300 font-mono-code">
            {yoga.houses && yoga.houses.length > 0
              ? yoga.houses.map((h: number) => `H${h}`).join(', ')
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Supporting / Weakening / Cancellation Factors */}
      {(yoga.supportingFactors?.length || yoga.weakeningFactors?.length || yoga.cancellationFactors?.length) ? (
        <div className="space-y-1.5 text-xs pt-1">
          {yoga.supportingFactors && yoga.supportingFactors.length > 0 && (
            <div className="text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/20 text-[11px]">
              <span className="font-mono-code font-bold uppercase block text-[10px]">Supporting Factors:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-0.5">
                {yoga.supportingFactors.map((f: YogaModifier | string | any, idx: number) => (
                  <li key={idx}>{typeof f === 'string' ? f : f.reason || f.type || JSON.stringify(f)}</li>
                ))}
              </ul>
            </div>
          )}

          {yoga.weakeningFactors && yoga.weakeningFactors.length > 0 && (
            <div className="text-amber-400 bg-amber-950/30 p-2 rounded border border-amber-500/20 text-[11px]">
              <span className="font-mono-code font-bold uppercase block text-[10px]">Weakening Factors:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-0.5">
                {yoga.weakeningFactors.map((f: YogaModifier | string | any, idx: number) => (
                  <li key={idx}>{typeof f === 'string' ? f : f.reason || f.type || JSON.stringify(f)}</li>
                ))}
              </ul>
            </div>
          )}

          {yoga.cancellationFactors && yoga.cancellationFactors.length > 0 && (
            <div className="text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-500/20 text-[11px]">
              <span className="font-mono-code font-bold uppercase block text-[10px]">Cancellation Factors:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-0.5">
                {yoga.cancellationFactors.map((f: YogaModifier | string | any, idx: number) => (
                  <li key={idx}>{typeof f === 'string' ? f : f.reason || f.type || JSON.stringify(f)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Evidence */}
      {yoga.evidence && yoga.evidence.length > 0 && (
        <EvidenceList evidence={yoga.evidence} title={`Evidence for ${yoga.type}`} />
      )}
    </div>
  );
};
