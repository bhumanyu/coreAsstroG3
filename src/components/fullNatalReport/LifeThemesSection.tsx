import React from 'react';
import { useTranslation } from 'react-i18next';
import { LifeThemesSection as LifeThemesSectionType, ThemeSynthesis, LifeTheme } from '../../types';
import { LifeThemeCard } from './LifeThemeCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { CareerThemePanel } from './themeInterpretation/CareerThemePanel';
import { WealthThemePanel } from './themeInterpretation/WealthThemePanel';
import { ThemeInterpretationUnavailable } from './themeInterpretation/ThemeInterpretationUnavailable';
import { ThemeStatusBadge } from './themeInterpretation/ThemeStatusBadge';
import { ThemeConfidenceBadge } from './themeInterpretation/ThemeConfidenceBadge';
import { Compass, Briefcase, Coins, Layers } from 'lucide-react';
import { ObservationAccordion, SectionAccordion } from './ObservationAccordion';

interface LifeThemesSectionProps {
  readonly section: LifeThemesSectionType;
}

export const LifeThemesSection: React.FC<LifeThemesSectionProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title={t('fullNatal.components.lifeThemes.unavailableTitle')}
        message={t('fullNatal.components.lifeThemes.unavailableMessage')}
      />
    );
  }

  const themes = section.themes || [];
  const synthesis = section.synthesis || [];
  const career = section.career;
  const wealth = section.wealth;

  const hasDetailedThemes = Boolean(career || wealth);

  if (themes.length === 0 && !hasDetailedThemes) {
    return (
      <div className="space-y-4">
        {section.status === 'PARTIAL' && (
          <PartialStateNotice message={t('fullNatal.components.partial.lifeThemes')} />
        )}
        <EmptyState
          title={t('fullNatal.components.lifeThemes.noThemesTitle')}
          message={t('fullNatal.components.lifeThemes.noThemesMessage')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section.status === 'PARTIAL' && (
        <PartialStateNotice message={t('fullNatal.components.partial.lifeThemes')} />
      )}

      {/* Life Themes Overview Header when Career or Wealth interpretations are available */}
      {hasDetailedThemes && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold font-serif-astro text-slate-100">
                {t('fullNatal.components.lifeThemes.overview')}
              </h4>
            </div>
            <span className="text-[11px] font-mono-code text-slate-400">
              {t('fullNatal.components.lifeThemes.deterministicInterpretations')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {career && (
              <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-serif-astro text-slate-200">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    {t('fullNatal.components.lifeThemes.careerProfessionalLife')}
                  </div>
                  <ThemeStatusBadge status={career.conclusion.status} />
                </div>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">
                  {career.conclusion.summary}
                </p>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                  <ThemeConfidenceBadge confidence={career.conclusion.confidence} />
                  <span className="font-mono-code text-slate-400">
                    {t('fullNatal.components.lifeThemes.promise')} {career.careerNatalPromise.status}
                  </span>
                </div>
              </div>
            )}

            {wealth && (
              <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-serif-astro text-slate-200">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    {t('fullNatal.components.lifeThemes.wealthProsperity')}
                  </div>
                  <ThemeStatusBadge status={wealth.conclusion.status} />
                </div>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">
                  {wealth.conclusion.summary}
                </p>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                  <ThemeConfidenceBadge confidence={wealth.conclusion.confidence} />
                  <span className="font-mono-code text-slate-400">
                    {t('fullNatal.components.lifeThemes.promise')} {wealth.wealthNatalPromise.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Individual Themes with Dedicated Panels for Career & Wealth */}
      {themes.length > 0 ? (
        <div className="space-y-6">
          {themes.map((theme: ThemeSynthesis, idx: number) => {
            const isCareer =
              theme.theme === LifeTheme.CAREER_STATUS ||
              (theme.theme as string) === 'CAREER_STATUS';
            const isWealth =
              theme.theme === LifeTheme.WEALTH_FINANCE ||
              (theme.theme as string) === 'WEALTH_PROSPERITY' ||
              (theme.theme as string) === 'WEALTH_FINANCE';

            if (isCareer) {
              if (career) {
                return (
                  <CareerThemePanel
                    key={`${theme.theme}-${idx}`}
                    id={`theme-panel-career`}
                    career={career}
                  />
                );
              }
              return (
                <div key={`${theme.theme}-${idx}`} className="space-y-3">
                  <ThemeInterpretationUnavailable themeName={t('fullNatal.components.lifeThemes.careerStatus')} />
                  <LifeThemeCard theme={theme} />
                </div>
              );
            }

            if (isWealth) {
              if (wealth) {
                return (
                  <WealthThemePanel
                    key={`${theme.theme}-${idx}`}
                    id={`theme-panel-wealth`}
                    wealth={wealth}
                  />
                );
              }
              return (
                <div key={`${theme.theme}-${idx}`} className="space-y-3">
                  <ThemeInterpretationUnavailable themeName={t('fullNatal.components.lifeThemes.wealthProsperity')} />
                  <LifeThemeCard theme={theme} />
                </div>
              );
            }

            // General / other life theme card
            return (
              <div key={`${theme.theme}-${idx}`} className="space-y-2">
                <LifeThemeCard theme={theme} />
              </div>
            );
          })}
        </div>
      ) : (
        // When themes array is empty but career/wealth objects exist
        <div className="space-y-6">
          {career && <CareerThemePanel id="theme-panel-career" career={career} />}
          {wealth && <WealthThemePanel id="theme-panel-wealth" wealth={wealth} />}
        </div>
      )}

      {/* Synthesis Observations */}
      {synthesis.length > 0 && (
        <SectionAccordion title={t('fullNatal.components.lifeThemes.observations')} count={synthesis.length}>
          {synthesis.map((observation, index) => {
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
