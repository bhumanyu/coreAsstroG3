import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Compass,
  Activity,
  Zap,
  TrendingUp,
  Vault,
  Trophy,
  Target,
  HelpCircle
} from 'lucide-react';
import type {
  LifeAnalysisWealthDetailViewModel,
  LifeAnalysisDomainSummaryViewModel
} from '../../product/life-analysis/lifeAnalysisTypes';
import type { WhyExperienceViewModel } from '../../product/life-analysis/lifeAnalysisEvidenceTypes';
import {
  formatEnum,
  getVargaBadgeClass,
  getEffectBadgeClass,
  getWealthDimensionColor
} from './lifeAnalysisUx';
import { DomainPromiseBadge } from './DomainPromiseBadge';
import { LifeAnalysisEvidencePanel } from './LifeAnalysisEvidencePanel';

interface WealthAnalysisCardProps {
  readonly detail?: LifeAnalysisWealthDetailViewModel;
  readonly summary?: LifeAnalysisDomainSummaryViewModel;
  readonly why?: WhyExperienceViewModel;
}

export const WealthAnalysisCard: React.FC<WealthAnalysisCardProps> = ({
  detail,
  summary,
  why
}) => {
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  if (!detail) {
    return null;
  }

  return (
    <article
      aria-labelledby="wealth-analysis-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="wealth-analysis-heading" className="text-base font-semibold text-slate-100">
              Wealth & Prosperity Domain (D2 / 2nd & 11th Houses)
            </h3>
            <p className="text-xs text-slate-400">
              Multi-dimensional analysis across accumulation, gains, fortune, and speculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {why && (
            <button
              type="button"
              onClick={() => setIsWhyOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Why this conclusion?</span>
            </button>
          )}
          {summary && <DomainPromiseBadge promise={summary.strength} />}
        </div>
      </div>

      {detail.headline && (
        <h4 className="text-sm font-semibold text-amber-300 font-serif-astro">
          {detail.headline}
        </h4>
      )}

      {detail.statement && (
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-astro">
          {detail.statement}
        </p>
      )}

      {/* Structural Factors — 3 Distinct Concepts: Natal Promise ≠ D2 Hora ≠ Timing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" aria-hidden="true" />
            Natal Promise
          </span>
          <p className="text-xs font-semibold text-slate-200">
            {formatEnum(detail.natalPromise)}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-purple-400" aria-hidden="true" />
            D2 Hora
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getVargaBadgeClass(
              detail.d2Relationship
            )}`}
          >
            {formatEnum(detail.d2Relationship)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Current Dasha
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadgeClass(
              detail.currentDashaEffect
            )}`}
          >
            {formatEnum(detail.currentDashaEffect)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" aria-hidden="true" />
            Current Transit
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadgeClass(
              detail.currentTransitEffect
            )}`}
          >
            {formatEnum(detail.currentTransitEffect)}
          </span>
        </div>
      </div>

      {/* 4 Wealth Dimensions Matrix */}
      <div className="space-y-2 pt-2">
        <span className="text-[11px] font-mono-code text-slate-400 block">
          4 Classical Wealth Dimensions (CW-04 Manifestation):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Vault className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Accumulation (2H)</span>
            </div>
            <span className={`text-xs font-semibold ${getWealthDimensionColor(detail.manifestationSynthesis?.dimensions.ACCUMULATION?.status ?? detail.accumulationStatus)}`}>
              {formatEnum(detail.manifestationSynthesis?.dimensions.ACCUMULATION?.status ?? detail.accumulationStatus)}
            </span>
            {detail.manifestationSynthesis?.dimensions.ACCUMULATION?.summary && (
              <p className="text-[11px] text-slate-400 leading-tight">
                {detail.manifestationSynthesis.dimensions.ACCUMULATION.summary}
              </p>
            )}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Gains (11H)</span>
            </div>
            <span className={`text-xs font-semibold ${getWealthDimensionColor(detail.manifestationSynthesis?.dimensions.GAINS?.status ?? detail.gainsStatus)}`}>
              {formatEnum(detail.manifestationSynthesis?.dimensions.GAINS?.status ?? detail.gainsStatus)}
            </span>
            {detail.manifestationSynthesis?.dimensions.GAINS?.summary && (
              <p className="text-[11px] text-slate-400 leading-tight">
                {detail.manifestationSynthesis.dimensions.GAINS.summary}
              </p>
            )}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Fortune (9H)</span>
            </div>
            <span className={`text-xs font-semibold ${getWealthDimensionColor(detail.manifestationSynthesis?.dimensions.FORTUNE?.status ?? detail.fortuneStatus)}`}>
              {formatEnum(detail.manifestationSynthesis?.dimensions.FORTUNE?.status ?? detail.fortuneStatus)}
            </span>
            {detail.manifestationSynthesis?.dimensions.FORTUNE?.summary && (
              <p className="text-[11px] text-slate-400 leading-tight">
                {detail.manifestationSynthesis.dimensions.FORTUNE.summary}
              </p>
            )}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Target className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <span>Speculation (5H)</span>
            </div>
            <span className={`text-xs font-semibold ${getWealthDimensionColor(detail.manifestationSynthesis?.dimensions.SPECULATION?.status ?? detail.speculationStatus)}`}>
              {formatEnum(detail.manifestationSynthesis?.dimensions.SPECULATION?.status ?? detail.speculationStatus)}
            </span>
            {detail.manifestationSynthesis?.dimensions.SPECULATION?.summary && (
              <p className="text-[11px] text-slate-400 leading-tight">
                {detail.manifestationSynthesis.dimensions.SPECULATION.summary}
              </p>
            )}
          </div>
        </div>

        {/* Note on independence of accumulation vs speculation */}
        <p className="text-[11px] text-slate-400/80 italic mt-1.5">
          Note: High accumulation capacity (2nd House) reflects wealth retention and stability, which functions independently from speculative risk tolerance (5th House). Speculation is strictly isolated.
        </p>
      </div>

      {/* Domain Evidence Modal Dialog */}
      {why && (
        <LifeAnalysisEvidencePanel
          isOpen={isWhyOpen}
          onClose={() => setIsWhyOpen(false)}
          title="Wealth & Prosperity Evidence"
          domain="WEALTH"
          why={why}
        />
      )}
    </article>
  );
};
