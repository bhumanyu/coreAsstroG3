import React from 'react';
import { ThemeSynthesis } from '../../types';
import { formatLifeThemeLabel, formatConfidence } from './reportUtils';
import { Award, AlertTriangle, Clock } from 'lucide-react';

interface LifeThemeCardProps {
  readonly theme: ThemeSynthesis;
}

export const LifeThemeCard: React.FC<LifeThemeCardProps> = ({ theme }) => {
  const state = theme.state || 'SUPPORTED';

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold font-serif-astro text-slate-100">
            {theme.label || formatLifeThemeLabel(theme.theme)}
          </h4>
          {theme.timingDependent && (
            <span className="text-[10px] font-mono-code text-amber-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Timing / Dasha Dependent
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Confidence: {formatConfidence(theme.confidence)}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${
              state === 'STRONGLY_SUPPORTED' || state === 'SUPPORTED'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : state === 'CHALLENGED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : state === 'MIXED'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {state}
          </span>
        </div>
      </div>

      {theme.conclusion && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {theme.conclusion}
        </p>
      )}

      {/* Supporting / Weakening Factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        {theme.supportingFactors && theme.supportingFactors.length > 0 && (
          <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 text-[11px] space-y-1">
            <span className="font-mono-code font-bold text-emerald-400 flex items-center gap-1">
              <Award className="w-3 h-3" /> Supporting Factors ({theme.supportingFactors.length})
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {theme.supportingFactors.map((f, idx) => (
                <li key={idx}>{f.statement || f.ruleId || JSON.stringify(f)}</li>
              ))}
            </ul>
          </div>
        )}

        {theme.weakeningFactors && theme.weakeningFactors.length > 0 && (
          <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 text-[11px] space-y-1">
            <span className="font-mono-code font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Weakening Factors ({theme.weakeningFactors.length})
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {theme.weakeningFactors.map((f, idx) => (
                <li key={idx}>{f.statement || f.ruleId || JSON.stringify(f)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
