import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExecutiveSummarySection, LifeTheme } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatLifeThemeLabel } from './reportUtils';
import { Award, AlertTriangle, Scale } from 'lucide-react';
import { ObservationAccordion, SectionAccordion } from './ObservationAccordion';
import { enumLabel } from '../../i18n/enumLabels';

interface ExecutiveSummaryCardProps {
  readonly section: ExecutiveSummarySection;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title={t('fullNatal.components.executiveSummary.unavailableTitle')} message={t('fullNatal.components.executiveSummary.unavailableMessage')} />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.executiveSummary')} />}

      {/* Headline & Confidence */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 p-5 rounded-2xl border border-indigo-500/30 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400">
            {t('fullNatal.components.executiveSummary.coreHeadline')}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            {t('fullNatal.components.executiveSummary.confidence', { value: enumLabel(tEnum, 'productConfidence', section.overallConfidence) })}
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
            <Award className="w-4 h-4 text-emerald-400" /> {t('fullNatal.components.executiveSummary.strongestThemes')}
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
            <p className="text-xs text-slate-500 italic">{t('fullNatal.components.executiveSummary.noneHighlighted')}</p>
          )}
        </div>

        {/* Challenged Themes */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> {t('fullNatal.components.executiveSummary.challengedThemes')}
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
            <p className="text-xs text-slate-500 italic">{t('fullNatal.components.executiveSummary.noneHighlighted')}</p>
          )}
        </div>

        {/* Mixed Themes */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-purple-500/30 space-y-2">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" /> {t('fullNatal.components.executiveSummary.mixedThemes')}
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
            <p className="text-xs text-slate-500 italic">{t('fullNatal.components.executiveSummary.noneHighlighted')}</p>
          )}
        </div>
      </div>

      {/* Key Observations */}
      {section.keyObservations && section.keyObservations.length > 0 && (
        <SectionAccordion title={t('fullNatal.components.executiveSummary.observations')} count={section.keyObservations.length}>
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
