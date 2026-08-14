import React from 'react';
import {
  WealthSubthemeKey,
  WealthSubthemeSummary
} from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import { Award, AlertTriangle, Coins, TrendingUp, Sparkles, Flame } from 'lucide-react';

interface WealthSubthemeGridProps {
  readonly subthemes: Readonly<Record<WealthSubthemeKey, WealthSubthemeSummary>>;
  readonly id?: string;
}

export const WealthSubthemeGrid: React.FC<WealthSubthemeGridProps> = ({
  subthemes,
  id = 'wealth-subtheme-grid'
}) => {
  if (!subthemes) return null;

  const getSubthemeIcon = (key: WealthSubthemeKey) => {
    switch (key) {
      case 'ACCUMULATION':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'GAINS':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'FORTUNE':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'SPECULATION':
        return <Flame className="w-4 h-4 text-rose-400" />;
    }
  };

  const getStatusBadge = (status: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL') => {
    switch (status) {
      case 'SUPPORT':
        return (
          <span
            aria-label="Pillar Status: Supportive"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          >
            Supportive
          </span>
        );
      case 'CHALLENGE':
        return (
          <span
            aria-label="Pillar Status: Challenged"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30"
          >
            Challenged
          </span>
        );
      case 'MIXED':
        return (
          <span
            aria-label="Pillar Status: Mixed Support & Challenge"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30"
          >
            Mixed
          </span>
        );
      case 'NEUTRAL':
      default:
        return (
          <span
            aria-label="Pillar Status: Neutral"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300 border border-slate-700 uppercase"
          >
            Neutral
          </span>
        );
    }
  };

  const subthemeList: WealthSubthemeSummary[] = [
    subthemes.ACCUMULATION,
    subthemes.GAINS,
    subthemes.FORTUNE,
    subthemes.SPECULATION
  ].filter(Boolean);

  return (
    <div id={id} className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300 flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-400" /> Four Pillars of Wealth & Prosperity
        </h4>
        <span className="text-[11px] font-mono-code text-slate-400">
          Core Thematic Houses (2H, 11H, 9H, 5H)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {subthemeList.map((st) => (
          <div
            key={st.key}
            id={`${id}-${st.key.toLowerCase()}`}
            className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                    {getSubthemeIcon(st.key)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold font-serif-astro text-slate-100">
                      {st.title}
                    </h5>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      House {st.houseNumber} Focus
                    </span>
                  </div>
                </div>

                {getStatusBadge(st.status)}
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
                {st.summaryStatement}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono-code text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <Award className="w-3 h-3" /> {st.supportingEvidenceCount} Support
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {st.challengingEvidenceCount} Challenge
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
