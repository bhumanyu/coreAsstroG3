import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CareerThemeInterpretationMetadata
} from '../../../engine/themeInterpretation/themeInterpretationTypes';
import {
  WealthThemeInterpretationMetadata
} from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import { formatCompleteness } from './themeUiUtils';
import { Terminal, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

interface ThemeMetadataCardProps {
  readonly metadata:
    | CareerThemeInterpretationMetadata
    | WealthThemeInterpretationMetadata;
  readonly id?: string;
}

export const ThemeMetadataCard: React.FC<ThemeMetadataCardProps> = ({
  metadata,
  id
}) => {
  const { t } = useTranslation('reports');
  const completenessLabel = formatCompleteness(metadata.dataCompleteness);

  return (
    <details
      id={id}
      className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-3 group text-xs"
    >
      <summary className="cursor-pointer font-mono-code text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between select-none">
        <span className="flex items-center gap-1.5 font-bold uppercase">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
          {t('theme.metadata.title')}
        </span>
        <span
          aria-label={t('theme.metadata.completenessAria', { status: completenessLabel })}
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
            metadata.dataCompleteness === 'COMPLETE'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : metadata.dataCompleteness === 'PARTIAL'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {completenessLabel}
        </span>
      </summary>

      <div className="pt-3 border-t border-slate-800/60 space-y-3 font-mono-code text-[11px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">{t('theme.metadata.evaluatedRules')}</span>
            <span className="text-sm font-bold text-slate-100">{metadata.evaluatedRulesCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">{t('theme.metadata.triggeredRules')}</span>
            <span className="text-sm font-bold text-emerald-400">{metadata.triggeredRulesCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">{t('theme.metadata.evidenceItems')}</span>
            <span className="text-sm font-bold text-indigo-300">{metadata.evidenceItemCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">{t('theme.metadata.vargaStatus')}</span>
            <span className="text-sm font-bold text-slate-200">{metadata.vargaConfirmationStatus}</span>
          </div>
        </div>

        {/* Represented Families */}
        {metadata.evidenceFamiliesRepresented && metadata.evidenceFamiliesRepresented.length > 0 && (
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">
              {t('theme.metadata.evidenceFamilies', { count: metadata.evidenceFamiliesRepresented.length })}
            </span>
            <div className="flex flex-wrap gap-1">
              {metadata.evidenceFamiliesRepresented.map((fam, idx) => (
                <span
                  key={idx}
                  className="bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]"
                >
                  {fam}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Errors if any */}
        {metadata.ruleErrors && metadata.ruleErrors.length > 0 ? (
          <div className="bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg space-y-1 text-rose-300">
            <div className="flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> {t('theme.metadata.ruleNotices', { count: metadata.ruleErrors.length })}
            </div>
            <ul className="space-y-0.5 text-[10px]">
              {metadata.ruleErrors.map((err, idx) => (
                <li key={idx}>
                  {err.ruleId}: {err.error}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
            <CheckCircle className="w-3 h-3" /> {t('theme.metadata.allRulesClean')}
          </div>
        )}
      </div>
    </details>
  );
};
