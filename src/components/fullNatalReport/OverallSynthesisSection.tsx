import React from 'react';
import { useTranslation } from 'react-i18next';
import { OverallSynthesisSection as OverallSynthesisSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatLifeThemeLabel } from './reportUtils';
import { Award, AlertTriangle, Scale, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { ObservationAccordion, SectionAccordion } from './ObservationAccordion';
import { enumLabel } from '../../i18n/enumLabels';

interface OverallSynthesisSectionProps {
  readonly section: OverallSynthesisSectionType;
}

export const OverallSynthesisSection: React.FC<OverallSynthesisSectionProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title={t('fullNatal.components.overallSynthesis.unavailableTitle')} message={t('fullNatal.components.overallSynthesis.unavailableMessage')} />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.overallSynthesis')} />}

      {/* Main Conclusion & Confidence */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-950 to-purple-950/60 p-5 rounded-2xl border border-indigo-500/40 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {t('fullNatal.components.overallSynthesis.finalConclusion')}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            {t('fullNatal.components.overallSynthesis.confidence', { value: enumLabel(tEnum, 'productConfidence', section.overallConfidence) })}
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
              <Award className="w-3.5 h-3.5" /> {t('fullNatal.components.overallSynthesis.strongestThemes')}
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
              <AlertTriangle className="w-3.5 h-3.5" /> {t('fullNatal.components.overallSynthesis.challengedThemes')}
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
              <Scale className="w-3.5 h-3.5" /> {t('fullNatal.components.overallSynthesis.mixedThemes')}
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
              <RefreshCw className="w-3.5 h-3.5" /> {t('fullNatal.components.overallSynthesis.repeatedSupportThemes')}
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
              <Clock className="w-3.5 h-3.5" /> {t('fullNatal.components.overallSynthesis.timingDependentThemes')}
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
        <SectionAccordion title={t('fullNatal.components.overallSynthesis.observations')} count={section.keyObservations.length}>
          {section.keyObservations.map((observation, index) => {
            const observationKey = observation.id || String(index);
            return (
              <ObservationAccordion
                key={observationKey}
                observation={observation}
                observationKey={observationKey}
              />
            );
          })}
        </SectionAccordion>
      )}
    </div>
  );
};
