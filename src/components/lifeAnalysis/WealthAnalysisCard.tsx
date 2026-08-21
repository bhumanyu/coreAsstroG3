import React from 'react';
import { Coins, ShieldCheck, Compass, Activity, Zap, TrendingUp, Vault, Trophy, Target } from 'lucide-react';
import type {
  LifeAnalysisWealthDetailViewModel,
  LifeAnalysisDomainSummaryViewModel
} from '../../product/life-analysis/lifeAnalysisTypes';

interface WealthAnalysisCardProps {
  readonly detail?: LifeAnalysisWealthDetailViewModel;
  readonly summary?: LifeAnalysisDomainSummaryViewModel;
}

export const WealthAnalysisCard: React.FC<WealthAnalysisCardProps> = ({
  detail,
  summary
}) => {
  if (!detail) {
    return null;
  }

  const getVargaBadge = (rel: string) => {
    switch (rel) {
      case 'CONFIRMS':
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'MODIFIES':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CONFLICTS':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getEffectBadge = (effect: string) => {
    switch (effect) {
      case 'SUPPORT':
      case 'TRIGGER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CHALLENGE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MODIFIER':
      case 'MIXED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getDimensionStatusBadge = (status: string) => {
    switch (status) {
      case 'STRONGLY_SUPPORTED':
        return 'text-emerald-400';
      case 'SUPPORTED':
        return 'text-indigo-400';
      case 'MIXED':
        return 'text-amber-400';
      case 'CHALLENGED':
      case 'LIMITED':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Wealth & Prosperity Domain (D2 / 2nd & 11th Houses)
            </h3>
            <p className="text-xs text-slate-400">
              Multi-dimensional analysis across accumulation, gains, fortune, and speculation
            </p>
          </div>
        </div>

        {summary && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {summary.strength.replace(/_/g, ' ')}
            </span>
          </div>
        )}
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

      {/* Structural Factors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            Natal Promise
          </span>
          <p className="text-xs font-semibold text-slate-200">
            {detail.natalPromise.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-purple-400" />
            D2 Hora
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getVargaBadge(
              detail.d2Relationship
            )}`}
          >
            {detail.d2Relationship}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            Current Dasha
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadge(
              detail.currentDashaEffect
            )}`}
          >
            {detail.currentDashaEffect}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Current Transit
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadge(
              detail.currentTransitEffect
            )}`}
          >
            {detail.currentTransitEffect}
          </span>
        </div>
      </div>

      {/* 4 Wealth Dimensions Matrix */}
      <div className="space-y-2 pt-2">
        <span className="text-[11px] font-mono-code text-slate-400 block">
          4 Classical Wealth Dimensions:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Vault className="w-3.5 h-3.5 text-indigo-400" />
              <span>Accumulation (2H)</span>
            </div>
            <span className={`text-xs font-semibold ${getDimensionStatusBadge(detail.accumulationStatus)}`}>
              {detail.accumulationStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gains (11H)</span>
            </div>
            <span className={`text-xs font-semibold ${getDimensionStatusBadge(detail.gainsStatus)}`}>
              {detail.gainsStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Fortune (9H)</span>
            </div>
            <span className={`text-xs font-semibold ${getDimensionStatusBadge(detail.fortuneStatus)}`}>
              {detail.fortuneStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Speculation (5H)</span>
            </div>
            <span className={`text-xs font-semibold ${getDimensionStatusBadge(detail.speculationStatus)}`}>
              {detail.speculationStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
