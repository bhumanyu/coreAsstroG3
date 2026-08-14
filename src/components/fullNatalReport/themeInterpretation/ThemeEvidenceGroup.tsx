import React, { useState } from 'react';
import { ThemeInterpretationEvidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { ThemeEvidenceItem } from './ThemeEvidenceItem';
import { formatEvidenceFamily } from './themeUiUtils';
import { ChevronDown, ChevronRight, Award, AlertTriangle, HelpCircle } from 'lucide-react';

interface ThemeEvidenceGroupProps {
  readonly title?: string;
  readonly family?: string;
  readonly evidence: readonly ThemeInterpretationEvidence<any>[];
  readonly status?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly id?: string;
  readonly defaultExpanded?: boolean;
}

export const ThemeEvidenceGroup: React.FC<ThemeEvidenceGroupProps> = ({
  title,
  family,
  evidence,
  status,
  id,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Safe copy without mutating frozen engine structures
  const items = [...(evidence || [])];
  if (items.length === 0) return null;

  const displayTitle = title || (family ? formatEvidenceFamily(family) : 'Evidence Group');

  const supporting = items.filter((e) => e.effect === 'SUPPORT');
  const challenging = items.filter((e) => e.effect === 'CHALLENGE');
  const neutral = items.filter((e) => e.effect === 'NEUTRAL' || !e.effect);

  const getStatusBadge = () => {
    if (!status) return null;
    switch (status) {
      case 'SUPPORT':
        return (
          <span
            aria-label="Family Status: Supportive"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          >
            Supportive
          </span>
        );
      case 'CHALLENGE':
        return (
          <span
            aria-label="Family Status: Challenged"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30"
          >
            Challenged
          </span>
        );
      case 'MIXED':
        return (
          <span
            aria-label="Family Status: Mixed Support & Challenge"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30"
          >
            Mixed
          </span>
        );
      case 'NEUTRAL':
      default:
        return (
          <span
            aria-label="Family Status: Neutral"
            className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300 border border-slate-700 uppercase"
          >
            Neutral
          </span>
        );
    }
  };

  return (
    <div
      id={id}
      className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 space-y-3"
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <h5 className="text-sm font-bold font-serif-astro text-slate-200">
            {displayTitle}
          </h5>
          <span className="text-xs font-mono-code text-slate-400">
            ({items.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-400">
            {supporting.length > 0 && (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Award className="w-3 h-3" /> {supporting.length}
              </span>
            )}
            {challenging.length > 0 && (
              <span className="text-rose-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {challenging.length}
              </span>
            )}
            {neutral.length > 0 && (
              <span className="text-slate-400 flex items-center gap-0.5">
                <HelpCircle className="w-3 h-3" /> {neutral.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-slate-800/70">
          {/* CRITICAL: when a family has both SUPPORT and CHALLENGE, render BOTH sections — never collapse to Neutral */}
          {supporting.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono-code font-bold uppercase text-emerald-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Supporting Factors ({supporting.length})
              </div>
              <div className="space-y-2">
                {supporting.map((ev, idx) => (
                  <ThemeEvidenceItem
                    key={`${ev.id}-${idx}`}
                    id={`${id || 'group'}-sup-${idx}`}
                    evidence={ev}
                  />
                ))}
              </div>
            </div>
          )}

          {challenging.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono-code font-bold uppercase text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Challenging Factors ({challenging.length})
              </div>
              <div className="space-y-2">
                {challenging.map((ev, idx) => (
                  <ThemeEvidenceItem
                    key={`${ev.id}-${idx}`}
                    id={`${id || 'group'}-ch-${idx}`}
                    evidence={ev}
                  />
                ))}
              </div>
            </div>
          )}

          {neutral.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono-code font-bold uppercase text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Neutral / Informational Evidence ({neutral.length})
              </div>
              <div className="space-y-2">
                {neutral.map((ev, idx) => (
                  <ThemeEvidenceItem
                    key={`${ev.id}-${idx}`}
                    id={`${id || 'group'}-neut-${idx}`}
                    evidence={ev}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
