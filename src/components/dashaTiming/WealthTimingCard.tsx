import React from 'react';
import { Coins, HelpCircle, Landmark, TrendingUp, Trophy, Target } from 'lucide-react';
import type { WealthTimingProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatPlanetName } from '../fullNatalReport/reportUtils';
import { formatEnum, getEffectBadgeClass } from '../lifeAnalysis/lifeAnalysisUx';
import { EmptyState } from '../fullNatalReport/EmptyState';

export interface WealthTimingCardProps {
  readonly timing?: WealthTimingProduct;
  readonly onOpenEvidence?: (evidenceIds: readonly string[]) => void;
}

export const WealthTimingCard: React.FC<WealthTimingCardProps> = ({
  timing,
  onOpenEvidence
}) => {
  if (!timing || timing.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title="Wealth Timing Unavailable"
        message="Wealth domain multi-dimensional timing matrix was not resolved for this period."
        icon={<Coins className="w-5 h-5 text-amber-400" aria-hidden="true" />}
      />
    );
  }

  const periods = [
    timing.mahadasha ? { ...timing.mahadasha, title: 'Mahadasha' } : undefined,
    timing.antardasha ? { ...timing.antardasha, title: 'Antardasha' } : undefined,
    timing.pratyantardasha ? { ...timing.pratyantardasha, title: 'Pratyantardasha' } : undefined
  ].filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <article
      aria-labelledby="wealth-timing-card-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="wealth-timing-card-heading" className="text-sm sm:text-base font-semibold text-slate-100">
              Wealth & Prosperity 4-Dimension Timing Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Per-dimension (Accumulation × Gains × Fortune × Speculation) × Per-period (MD × AD × PD) activations
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          4D Timing Matrix
        </span>
      </div>

      {/* Desktop/Tablet 4x3 Matrix Grid Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse font-mono-code">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase">
              <th className="py-2.5 px-3 font-semibold">Active Period</th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  Accumulation (2H)
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                  Gains (11H)
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  Fortune (9H)
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-purple-400" aria-hidden="true" />
                  Speculation (5H)
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {periods.map((p) => {
              const hasEvidence = p.evidenceIds && p.evidenceIds.length > 0;

              return (
                <tr key={p.period} className="hover:bg-slate-800/30 transition-colors">
                  {/* Period & Lord */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-200">
                      {p.period} ({p.title})
                    </div>
                    {p.planet && (
                      <div className="text-[11px] font-serif-astro text-amber-300">
                        {formatPlanetName(p.planet)}
                      </div>
                    )}
                  </td>

                  {/* Accumulation Cell */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getEffectBadgeClass(
                        p.dimensions.accumulation
                      )}`}
                    >
                      {formatEnum(p.dimensions.accumulation)}
                    </span>
                  </td>

                  {/* Gains Cell */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getEffectBadgeClass(
                        p.dimensions.gains
                      )}`}
                    >
                      {formatEnum(p.dimensions.gains)}
                    </span>
                  </td>

                  {/* Fortune Cell */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getEffectBadgeClass(
                        p.dimensions.fortune
                      )}`}
                    >
                      {formatEnum(p.dimensions.fortune)}
                    </span>
                  </td>

                  {/* Speculation Cell */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getEffectBadgeClass(
                        p.dimensions.speculation
                      )}`}
                    >
                      {formatEnum(p.dimensions.speculation)}
                    </span>
                  </td>

                  {/* Evidence / Why */}
                  <td className="py-3 px-3 text-right">
                    {hasEvidence && onOpenEvidence ? (
                      <button
                        type="button"
                        onClick={() => onOpenEvidence(p.evidenceIds)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors cursor-pointer text-[11px]"
                      >
                        <HelpCircle className="w-3 h-3" aria-hidden="true" />
                        <span>Why?</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Rule</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="sm:hidden space-y-3">
        {periods.map((p) => {
          const hasEvidence = p.evidenceIds && p.evidenceIds.length > 0;

          return (
            <div
              key={p.period}
              className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div>
                  <span className="font-mono-code font-bold text-xs text-slate-200">
                    {p.period} • {p.title}
                  </span>
                  {p.planet && (
                    <span className="block text-xs font-serif-astro text-amber-300">
                      {formatPlanetName(p.planet)}
                    </span>
                  )}
                </div>
                {hasEvidence && onOpenEvidence && (
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(p.evidenceIds)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono-code cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" aria-hidden="true" />
                    <span>Why?</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Accumulation (2H)</span>
                  <span className={`text-[10px] font-bold ${getEffectBadgeClass(p.dimensions.accumulation)} px-1.5 py-0.5 rounded border inline-block`}>
                    {formatEnum(p.dimensions.accumulation)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Gains (11H)</span>
                  <span className={`text-[10px] font-bold ${getEffectBadgeClass(p.dimensions.gains)} px-1.5 py-0.5 rounded border inline-block`}>
                    {formatEnum(p.dimensions.gains)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Fortune (9H)</span>
                  <span className={`text-[10px] font-bold ${getEffectBadgeClass(p.dimensions.fortune)} px-1.5 py-0.5 rounded border inline-block`}>
                    {formatEnum(p.dimensions.fortune)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Speculation (5H)</span>
                  <span className={`text-[10px] font-bold ${getEffectBadgeClass(p.dimensions.speculation)} px-1.5 py-0.5 rounded border inline-block`}>
                    {formatEnum(p.dimensions.speculation)}
                  </span>
                </div>
              </div>

              {p.statement && (
                <p className="text-xs text-slate-300 font-serif-astro leading-relaxed pt-1">
                  {p.statement}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 italic pt-1">
        Classical Principle: 2nd House treasury accumulation operates independently from 5th House speculative ventures across all planetary periods.
      </p>
    </article>
  );
};
