import React from 'react';
import { Layers, GitCommit, Sparkles, Home } from 'lucide-react';
import type { DashaCurrentPeriodsProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { DashaPeriodCard } from './DashaPeriodCard';
import { formatPlanetName } from '../fullNatalReport/reportUtils';
import { EmptyState } from '../fullNatalReport/EmptyState';

export interface CurrentDashaPanelProps {
  readonly current?: DashaCurrentPeriodsProduct;
}

export const CurrentDashaPanel: React.FC<CurrentDashaPanelProps> = ({ current }) => {
  if (!current || (!current.mahadasha && !current.antardasha && !current.pratyantardasha)) {
    return (
      <EmptyState
        title="Active Dasha Hierarchy Unavailable"
        message="Active Mahadasha, Antardasha, and Pratyantardasha periods were not resolved for the target timestamp."
        icon={<Layers className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const { mahadasha, antardasha, pratyantardasha, pair } = current;

  return (
    <section aria-labelledby="active-dasha-heading" className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="active-dasha-heading" className="text-base sm:text-lg font-semibold text-slate-100">
              Active Vimshottari Dasha Hierarchy
            </h2>
            <p className="text-xs text-slate-400">
              Three-tier planetary activation: Mahadasha (Major) → Antardasha (Sub) → Pratyantardasha (Sub-Sub)
            </p>
          </div>
        </div>
        <span className="text-xs font-mono-code text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 hidden sm:inline">
          MD / AD / PD Triple
        </span>
      </div>

      {/* 3-Tier Hierarchy Display */}
      <div className="space-y-4">
        {/* Tier 1: Mahadasha (Primary Prominence) */}
        {mahadasha && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-code text-indigo-300 font-bold uppercase tracking-wider pl-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Primary Activation (Mahadasha)
            </div>
            <DashaPeriodCard period={mahadasha} isPrimary />
          </div>
        )}

        {/* Tier 2 & 3: Antardasha & Pratyantardasha side-by-side or stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {antardasha && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono-code text-purple-300 font-bold uppercase tracking-wider pl-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Secondary Activation (Antardasha)
              </div>
              <DashaPeriodCard period={antardasha} />
            </div>
          )}

          {pratyantardasha && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono-code text-amber-300 font-bold uppercase tracking-wider pl-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Tertiary Activation (Pratyantardasha)
              </div>
              <DashaPeriodCard period={pratyantardasha} />
            </div>
          )}
        </div>

        {/* Mahadasha × Antardasha Pair Relationship Card */}
        {pair && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <GitCommit className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                <span>
                  Mahadasha × Antardasha Combined Field ({formatPlanetName(pair.mahadashaLord)} × {formatPlanetName(pair.antardashaLord)})
                </span>
              </div>
              <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Co-Activated Houses
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-code">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                  <Home className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                  Shared House Influence
                </span>
                <p className="font-bold text-indigo-300">
                  {pair.sharedHouses && pair.sharedHouses.length > 0
                    ? pair.sharedHouses.map(h => `House ${h}`).join(', ')
                    : 'Independent House Axis'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" aria-hidden="true" />
                  Combined Activated House Set
                </span>
                <p className="font-bold text-purple-300">
                  {pair.combinedHouseSet && pair.combinedHouseSet.length > 0
                    ? pair.combinedHouseSet.map(h => `H${h}`).join(', ')
                    : 'Standard Natal Network'}
                </p>
              </div>
            </div>

            {pair.relationshipEvidence && pair.relationshipEvidence.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[11px] font-mono-code text-slate-400 block">
                  Pair Interaction Evidence:
                </span>
                <div className="space-y-1.5">
                  {pair.relationshipEvidence.map((ev, idx) => (
                    <div
                      key={`${ev.ruleId}-${idx}`}
                      className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2"
                    >
                      <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                        {ev.ruleId}
                      </span>
                      <span className="leading-relaxed font-serif-astro">{ev.statement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
