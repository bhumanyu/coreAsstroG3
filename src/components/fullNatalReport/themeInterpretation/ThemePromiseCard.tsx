import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ThemeInterpretationEvidence,
  EvidenceConfidence
} from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { ThemeConfidenceBadge } from './ThemeConfidenceBadge';
import { getPromiseStatusStyle } from './themeUiUtils';
import { Award, AlertTriangle, ShieldCheck } from 'lucide-react';
import { enumLabel } from '../../../i18n/enumLabels';

interface ThemePromiseCardProps {
  readonly title: string;
  readonly status: 'STRONG' | 'SUPPORTED' | 'MIXED' | 'ADVERSE' | 'UNAVAILABLE' | string;
  readonly confidence: EvidenceConfidence | string;
  readonly primarySupport: readonly ThemeInterpretationEvidence<any>[];
  readonly primaryChallenges: readonly ThemeInterpretationEvidence<any>[];
  readonly structuralEvidence?: readonly ThemeInterpretationEvidence<any>[];
  readonly id?: string;
}

export const ThemePromiseCard: React.FC<ThemePromiseCardProps> = ({
  title,
  status,
  confidence,
  primarySupport,
  primaryChallenges,
  id
}) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  const statusLabel = enumLabel(tEnum, 'themePromiseStatus', status);
  const statusStyle = getPromiseStatusStyle(status);

  const safeSupport = [...(primarySupport || [])];
  const safeChallenges = [...(primaryChallenges || [])];

  return (
    <div
      id={id}
      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold font-serif-astro text-slate-100">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <ThemeConfidenceBadge confidence={confidence} />
          <span
            aria-label={t('fullNatal.components.themeEvidence.natalPromiseStatus', { status: statusLabel })}
            className={`px-2.5 py-0.5 rounded text-xs font-mono-code font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        {t('fullNatal.components.themeEvidence.natalPromiseDescription')}
      </p>

      {/* Support and Challenge breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Structural Support */}
        <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-code font-bold uppercase text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> {t('fullNatal.components.themeEvidence.primarySupport')}
            </span>
            <span>({safeSupport.length})</span>
          </div>
          {safeSupport.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-300">
              {safeSupport.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className="flex items-start gap-1.5 leading-snug"
                >
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>{item.statement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {t('fullNatal.components.themeEvidence.noPrimarySupport')}
            </p>
          )}
        </div>

        {/* Structural Challenges */}
        <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-code font-bold uppercase text-rose-400">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {t('fullNatal.components.themeEvidence.primaryChallenges')}
            </span>
            <span>({safeChallenges.length})</span>
          </div>
          {safeChallenges.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-300">
              {safeChallenges.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className="flex items-start gap-1.5 leading-snug"
                >
                  <span className="text-rose-400 mt-1">•</span>
                  <span>{item.statement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {t('fullNatal.components.themeEvidence.noPrimaryChallenges')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
