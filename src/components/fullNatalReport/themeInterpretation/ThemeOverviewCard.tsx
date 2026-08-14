import React from 'react';
import { EvidenceConfidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { ThemeStatusBadge } from './ThemeStatusBadge';
import { ThemeConfidenceBadge } from './ThemeConfidenceBadge';
import { Award, AlertTriangle, Compass, Clock } from 'lucide-react';

interface ThemeOverviewCardProps {
  readonly title: string;
  readonly status: string;
  readonly confidence: EvidenceConfidence | string;
  readonly summary: string;
  readonly keySupportingFactors: readonly string[];
  readonly keyChallengingFactors: readonly string[];
  readonly keyConditionalFactors?: readonly string[];
  readonly id?: string;
}

export const ThemeOverviewCard: React.FC<ThemeOverviewCardProps> = ({
  title,
  status,
  confidence,
  summary,
  keySupportingFactors,
  keyChallengingFactors,
  keyConditionalFactors,
  id
}) => {
  const safeSupport = [...(keySupportingFactors || [])];
  const safeChallenges = [...(keyChallengingFactors || [])];
  const safeConditional = [...(keyConditionalFactors || [])];

  return (
    <div
      id={id}
      className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold font-serif-astro text-slate-100">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Synthesized conclusion based on comprehensive multi-tiered astrological rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeConfidenceBadge confidence={confidence} />
          <ThemeStatusBadge status={status} />
        </div>
      </div>

      {/* Synthesis Summary */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <h4 className="text-xs font-mono-code font-bold uppercase text-indigo-300 mb-1.5">
          Executive Theme Synthesis
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed font-sans font-normal">
          {summary}
        </p>
      </div>

      {/* Key Factors Summary Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
        {/* Supporting Factors */}
        <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 space-y-2">
          <div className="text-xs font-mono-code font-bold uppercase text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Key Supporting Factors
            </span>
            <span>({safeSupport.length})</span>
          </div>
          {safeSupport.length > 0 ? (
            <ul className="space-y-1 text-slate-300">
              {safeSupport.map((f, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic text-[11px]">
              No dominant supporting factors highlighted.
            </p>
          )}
        </div>

        {/* Challenging Factors */}
        <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/20 space-y-2">
          <div className="text-xs font-mono-code font-bold uppercase text-rose-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Key Challenging Factors
            </span>
            <span>({safeChallenges.length})</span>
          </div>
          {safeChallenges.length > 0 ? (
            <ul className="space-y-1 text-slate-300">
              {safeChallenges.map((f, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic text-[11px]">
              No major challenging factors highlighted.
            </p>
          )}
        </div>

        {/* Conditional / Timing Factors */}
        <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-500/20 space-y-2 md:col-span-2 lg:col-span-1">
          <div className="text-xs font-mono-code font-bold uppercase text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Conditional & Timing
            </span>
            <span>({safeConditional.length})</span>
          </div>
          {safeConditional.length > 0 ? (
            <ul className="space-y-1 text-slate-300">
              {safeConditional.map((f, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic text-[11px]">
              Results operate steadily without critical dasha-gated dependencies.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
