import React from 'react';
import { OverallSynthesisSection as OverallSynthesisSectionType, SynthesisObservation } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatLifeThemeLabel, formatConfidence } from './reportUtils';
import { Award, AlertTriangle, Scale, Clock, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface OverallSynthesisSectionProps {
  readonly section: OverallSynthesisSectionType;
}

export const OverallSynthesisSection: React.FC<OverallSynthesisSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title="Overall Synthesis Unavailable" message="Overall synthesis was excluded from the natal analysis report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Overall synthesis contains partial data." />}

      {/* Main Conclusion & Confidence */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-950 to-purple-950/60 p-5 rounded-2xl border border-indigo-500/40 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Final Synthesis Conclusion
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Overall Confidence: {formatConfidence(section.overallConfidence)}
          </span>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
          {section.overallConclusion}
        </p>
      </div>

      {/* Themes Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Strongest */}
        {section.strongestThemes && section.strongestThemes.length > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
            <span className="text-[10px] font-mono-code font-bold uppercase text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Strongest Themes
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-xs">
              {section.strongestThemes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded">
                  {formatLifeThemeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Challenged */}
        {section.challengedThemes && section.challengedThemes.length > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
            <span className="text-[10px] font-mono-code font-bold uppercase text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Challenged Themes
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-xs">
              {section.challengedThemes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                  {formatLifeThemeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mixed */}
        {section.mixedThemes && section.mixedThemes.length > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-purple-500/30 space-y-1.5">
            <span className="text-[10px] font-mono-code font-bold uppercase text-purple-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Mixed Themes
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-xs">
              {section.mixedThemes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                  {formatLifeThemeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Repeated Support */}
        {section.repeatedSupportThemes && section.repeatedSupportThemes.length > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-indigo-500/30 space-y-1.5">
            <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Repeated Support Themes
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-xs">
              {section.repeatedSupportThemes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                  {formatLifeThemeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timing Dependent */}
        {section.timingDependentThemes && section.timingDependentThemes.length > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
            <span className="text-[10px] font-mono-code font-bold uppercase text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Timing Dependent Themes
            </span>
            <div className="flex flex-wrap gap-1 font-mono-code text-xs">
              {section.timingDependentThemes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                  {formatLifeThemeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Observations */}
      {section.keyObservations && section.keyObservations.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-mono-code font-bold uppercase text-indigo-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Overall Synthesis Observations ({section.keyObservations.length})
          </h4>
          <div className="space-y-2">
            {section.keyObservations.map((obs: SynthesisObservation, idx: number) => (
              <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 font-serif-astro">{obs.summary}</span>
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
