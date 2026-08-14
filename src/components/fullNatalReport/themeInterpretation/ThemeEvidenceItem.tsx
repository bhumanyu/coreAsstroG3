import React from 'react';
import {
  ThemeInterpretationEvidence
} from '../../../engine/themeInterpretation/themeInterpretationTypes';
import {
  formatEvidenceEffect,
  formatEvidencePriority,
  getEffectStyle
} from './themeUiUtils';
import { Award, AlertTriangle, HelpCircle, ChevronRight } from 'lucide-react';

interface ThemeEvidenceItemProps {
  readonly evidence: ThemeInterpretationEvidence<any>;
  readonly id?: string;
}

export const ThemeEvidenceItem: React.FC<ThemeEvidenceItemProps> = ({
  evidence,
  id
}) => {
  const effectStyle = getEffectStyle(evidence.effect);
  const effectLabel = formatEvidenceEffect(evidence.effect);
  const priorityLabel = formatEvidencePriority(evidence.priority);

  const getEffectIcon = () => {
    switch (evidence.effect) {
      case 'SUPPORT':
        return <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'CHALLENGE':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'NEUTRAL':
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div
      id={id}
      className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="mt-0.5">{getEffectIcon()}</div>
          <div className="space-y-1">
            <p className="text-slate-200 font-medium leading-relaxed font-sans">
              {evidence.statement}
            </p>
            {evidence.conditional && (
              <span className="inline-block text-[10px] font-mono-code text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Conditional Activation
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            aria-label={`Effect: ${effectLabel}`}
            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${effectStyle.bg} ${effectStyle.text} ${effectStyle.border}`}
          >
            {effectLabel}
          </span>
          <span
            aria-label={`Strength: ${evidence.strength}`}
            className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300 border border-slate-700 uppercase"
          >
            {evidence.strength}
          </span>
          <span
            aria-label={`Priority: ${priorityLabel}`}
            className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 uppercase"
          >
            {priorityLabel}
          </span>
        </div>
      </div>

      {/* Planets and Houses */}
      {((evidence.planets && evidence.planets.length > 0) ||
        (evidence.houses && evidence.houses.length > 0)) && (
        <div className="flex flex-wrap gap-2 text-[11px] pt-1 text-slate-400 font-mono-code">
          {evidence.planets && evidence.planets.length > 0 && (
            <span>
              Planets: <span className="text-slate-200 font-semibold">{evidence.planets.join(', ')}</span>
            </span>
          )}
          {evidence.houses && evidence.houses.length > 0 && (
            <span>
              Houses: <span className="text-slate-200 font-semibold">{evidence.houses.map((h) => `${h}H`).join(', ')}</span>
            </span>
          )}
        </div>
      )}

      {/* Factors */}
      {evidence.factors && evidence.factors.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider font-semibold">
            Contributing Factors
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {evidence.factors.map((factor, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 rounded px-2 py-1 border border-slate-800/80 text-[11px] flex items-start justify-between gap-1"
              >
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">{factor.label}:</span>
                  <span className="text-slate-200">{factor.value}</span>
                </div>
                <span
                  className={`text-[9px] font-mono-code uppercase px-1 py-0.2 rounded shrink-0 ${
                    factor.role === 'PRIMARY'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : factor.role === 'CONFIRMATION'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : factor.role === 'CONFLICT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {factor.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Technical Evidence */}
      <details
        id={`${id || evidence.id}-technical`}
        className="pt-1 text-[11px] text-slate-400 group"
      >
        <summary className="cursor-pointer font-mono-code text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 select-none">
          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
          Technical Rule Details ({evidence.ruleId})
        </summary>
        <div className="mt-1.5 p-2 bg-slate-950/80 rounded border border-slate-800 font-mono-code text-[10px] space-y-1 text-slate-400">
          <div>Rule ID: <span className="text-slate-200">{evidence.ruleId}</span></div>
          <div>Evidence ID: <span className="text-slate-200">{evidence.id}</span></div>
          <div>Family: <span className="text-slate-200">{evidence.evidenceFamily}</span></div>
          {evidence.dimension && <div>Dimension: <span className="text-slate-200">{evidence.dimension}</span></div>}
        </div>
      </details>
    </div>
  );
};
