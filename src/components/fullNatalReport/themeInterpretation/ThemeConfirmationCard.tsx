import React from 'react';
import {
  formatVargaRelationship,
  formatYogaConfirmation,
  getVargaRelationshipStyle
} from './themeUiUtils';
import { Sparkles, Info } from 'lucide-react';
import { ThemeInterpretationEvidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';

interface ThemeConfirmationCardProps {
  readonly title: string;
  readonly relationship: string;
  readonly type?: 'VARGA' | 'YOGA';
  readonly statement?: string;
  readonly isAvailable?: boolean;
  readonly unavailableReason?: string;
  readonly evidence?: readonly ThemeInterpretationEvidence<any>[];
  readonly id?: string;
}

export const ThemeConfirmationCard: React.FC<ThemeConfirmationCardProps> = ({
  title,
  relationship,
  type = 'VARGA',
  statement,
  isAvailable = true,
  unavailableReason,
  evidence,
  id
}) => {
  const isActuallyAvailable =
    isAvailable && relationship !== 'UNAVAILABLE' && relationship !== 'ABSENT';

  const relLabel =
    type === 'VARGA'
      ? formatVargaRelationship(relationship)
      : formatYogaConfirmation(relationship);

  const style = getVargaRelationshipStyle(relationship);

  const filteredEvidence =
    evidence?.filter((ev) => Boolean(ev.statement && ev.statement.trim() !== (statement ?? '').trim())) || [];

  return (
    <div
      id={id}
      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h4 className="text-sm font-bold font-serif-astro text-slate-100">
            {title}
          </h4>
        </div>

        <span
          aria-label={`Confirmation Status: ${relLabel}`}
          className={`px-2.5 py-0.5 rounded text-xs font-mono-code font-bold uppercase border ${style.bg} ${style.text} ${style.border}`}
        >
          {relLabel}
        </span>
      </div>

      {isActuallyAvailable ? (
        <div className="space-y-2 text-xs">
          {statement && (
            <p className="text-slate-200 font-medium leading-relaxed font-sans">
              {statement}
            </p>
          )}
          {filteredEvidence.length > 0 && (
            <ul className="space-y-1 text-slate-300">
              {filteredEvidence.map((ev, idx) => (
                <li key={`${ev.id}-${idx}`} className="flex items-start gap-1.5">
                  <span className="text-teal-400">•</span>
                  <span>{ev.statement}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          {unavailableReason ||
            statement ||
            (type === 'VARGA'
              ? 'Divisional chart confirmation is unavailable or not configured.'
              : 'No special confirmatory yogas identified.')}
        </p>
      )}

      {/* Methodological boundary note */}
      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          Confirmation checks refine synthesis confidence and manifestation quality, but do not override root natal promise.
        </span>
      </div>
    </div>
  );
};
