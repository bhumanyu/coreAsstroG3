import React from 'react';
import { ExecutiveSummarySection, LifeTheme, SynthesisObservation } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatLifeThemeLabel, formatConfidence } from './reportUtils';
import { Award, AlertTriangle, Scale, Eye } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  readonly section: ExecutiveSummarySection;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title="Executive Summary Unavailable" message="Executive summary analysis was not provided." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Executive summary is partial." />}

      {/* Headline & Confidence */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 p-5 rounded-2xl border border-indigo-500/30 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400">
            Core Headline
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Confidence: {formatConfidence(section.overallConfidence)}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-bold font-serif-astro text-slate-100">
          {section.headline}
        </h3>
        {section.overallConclusion && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
            {section.overallConclusion}
          </p>
        )}
      </div>

      {/* Theme Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strongest Themes */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/30 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" /> Strongest Themes
          </span>
          {section.strongestThemes && section.strongestThemes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {section.strongestThemes.map((theme: LifeTheme) => (
                <span key={theme} className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {formatLifeThemeLabel(theme)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">None highlighted</p>
          )}
        </div>

        {/* Challenged Themes */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Challenged Themes
          </span>
          {section.challengedThemes && section.challengedThemes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {section.challengedThemes.map((theme: LifeTheme) => (
                <span key={theme} className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {formatLifeThemeLabel(theme)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">None highlighted</p>
          )}
        </div>

        {/* Mixed Themes */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-purple-500/30 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" /> Mixed / Balanced Themes
          </span>
          {section.mixedThemes && section.mixedThemes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {section.mixedThemes.map((theme: LifeTheme) => (
                <span key={theme} className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {formatLifeThemeLabel(theme)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">None highlighted</p>
          )}
        </div>
      </div>

      {/* Key Observations */}
      {section.keyObservations && section.keyObservations.length > 0 && (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Key Synthesis Observations
          </span>
          <div className="space-y-2">
            {section.keyObservations.map((obs: SynthesisObservation, idx: number) => (
              <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200 font-serif-astro">{obs.summary}</span>
                  {obs.type && (
                    <span className="text-[10px] font-mono-code text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase">
                      {obs.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
