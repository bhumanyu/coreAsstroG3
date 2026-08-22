import React from 'react';
import { Briefcase, HelpCircle, Activity } from 'lucide-react';
import type { CareerTimingProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { formatPlanetName } from '../fullNatalReport/reportUtils';
import { formatEnum, getEffectBadgeClass } from '../lifeAnalysis/lifeAnalysisUx';
import { EmptyState } from '../fullNatalReport/EmptyState';

export interface CareerTimingCardProps {
  readonly timing?: CareerTimingProduct;
  readonly onOpenEvidence?: (evidenceIds: readonly string[]) => void;
}

export const CareerTimingCard: React.FC<CareerTimingCardProps> = ({
  timing,
  onOpenEvidence
}) => {
  if (!timing || timing.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title="Career Timing Unavailable"
        message="Career domain timing activations were not resolved for this period."
        icon={<Briefcase className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const periods = [
    timing.mahadasha ? { ...timing.mahadasha, title: 'Mahadasha', periodKey: 'MD' as const } : null,
    timing.antardasha ? { ...timing.antardasha, title: 'Antardasha', periodKey: 'AD' as const } : null,
    timing.pratyantardasha ? { ...timing.pratyantardasha, title: 'Pratyantardasha', periodKey: 'PD' as const } : null
  ].filter(Boolean) as Array<{
    period: 'MD' | 'AD' | 'PD';
    planet?: any;
    effect: string;
    evidenceIds: readonly string[];
    statement?: string;
    title: string;
    periodKey: 'MD' | 'AD' | 'PD';
  }>;

  return (
    <article
      aria-labelledby="career-timing-card-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="career-timing-card-heading" className="text-sm sm:text-base font-semibold text-slate-100">
              Career & Vocation Domain Timing
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic activation of 10th house, D10 Dasamsa, and professional karakas
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Career Field Activations
        </span>
      </div>

      {periods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {periods.map((p) => {
            const hasEvidence = p.evidenceIds && p.evidenceIds.length > 0;

            return (
              <div
                key={p.period}
                className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[11px] font-bold text-slate-300">
                      {p.period} • {p.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${getEffectBadgeClass(
                        p.effect
                      )}`}
                    >
                      {formatEnum(p.effect)}
                    </span>
                  </div>

                  {p.planet && (
                    <p className="text-xs font-serif-astro font-semibold text-indigo-300">
                      Lord: {formatPlanetName(p.planet)}
                    </p>
                  )}

                  {p.statement && (
                    <p className="text-xs text-slate-300 leading-relaxed font-serif-astro">
                      {p.statement}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono-code">
                  <span className="text-slate-500">
                    {hasEvidence ? `${p.evidenceIds.length} evidence pts` : 'Rule derived'}
                  </span>
                  {hasEvidence && onOpenEvidence && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(p.evidenceIds)}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" aria-hidden="true" />
                      <span>Why?</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-slate-400 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
          No period timing activations were found for Career.
        </div>
      )}
    </article>
  );
};
