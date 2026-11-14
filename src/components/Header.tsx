import React, { useState } from 'react';
import { Compass, Sparkles, Calendar, MapPin, Menu, X, ChevronDown } from 'lucide-react';
import type { AppPage } from '../app/navigation/navigationTypes';
import {
  PRODUCT_NAVIGATION,
  RESEARCH_NAVIGATION,
  mapLegacyPageToAppPage,
  mapAppPageToLegacyTab
} from '../app/navigation/navigation';
import type { BirthDetails } from '../types';
import type { AppTab } from '../types/appTabs';
import { BirthContext, buildBirthContext } from '../app/birthContext';
import { ThemeToggle } from './ui/ThemeToggle';
import { LanguageSwitcher } from './language/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export type { BirthContext };

export interface HeaderProps {
  activePage?: AppPage;
  onNavigate?: (page: AppPage) => void;
  birthContext?: BirthContext;
  onOpenBirthForm?: () => void;
  birthDetails?: BirthDetails;
  activeTab?: AppTab;
  setActiveTab?: (tab: AppTab) => void;
}

export const Brand: React.FC = () => {
  const { t } = useTranslation('common');
  return <div className="flex items-center space-x-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/25">
      <div className="w-full h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-900 rounded-[10px] flex items-center justify-center">
        <Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />
      </div>
    </div>
    <div>
      <h1 className="text-xl font-bold tracking-wide font-serif-astro text-slate-100 dark:text-slate-100 light:text-slate-900">CoreAstro</h1>
      <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">{t('brandDescriptor')}</p>
    </div>
  </div>;
};

export interface BirthContextButtonProps {
  birthContext?: BirthContext;
  onOpenBirthForm?: () => void;
}

export const BirthContextButton: React.FC<BirthContextButtonProps> = ({ birthContext, onOpenBirthForm }) => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  return (
    <button type="button" onClick={onOpenBirthForm}
      className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 shadow-sm transition-all hover:border-indigo-500/50 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 light:border-slate-300 light:bg-slate-100 light:text-slate-700 light:hover:bg-slate-200"
      title={t('editBirthDetails')}>
      <Calendar className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 shrink-0" aria-hidden="true" />
      <span className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-900">{birthContext?.name || tCommon('birthChart')}</span>
      {birthContext?.placeOfBirth && <><span className="text-slate-500" aria-hidden="true">•</span><span className="text-emerald-400 flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />{birthContext.placeOfBirth}</span></>}
      {birthContext?.formattedDate && <><span className="text-slate-500" aria-hidden="true">•</span><span className="font-mono-code text-slate-400">{birthContext.formattedDate} {birthContext.zoneLabel}</span></>}
      {birthContext?.ayanamsa && <><span className="text-slate-500" aria-hidden="true">•</span><span className="text-purple-400 font-semibold">{birthContext.ayanamsa}</span></>}
    </button>
  );
};

export interface ProductNavigationProps { activePage: AppPage; onNavigate: (page: AppPage) => void; }
export const ProductNavigation: React.FC<ProductNavigationProps> = ({ activePage, onNavigate }) => {
  const { t } = useTranslation('navigation');
  const groups: { label: string; pages: AppPage[] }[] = [
    { label: 'groupHome', pages: ['home'] },
    { label: 'groupChart', pages: ['horoscope', 'planets', 'divisional', 'nakshatras'] },
    { label: 'groupInsights', pages: ['overview', 'career', 'wealth', 'dasha', 'reasoning'] },
    { label: 'groupReport', pages: ['detailed'] }
  ];
  return (
    <nav aria-label={t('productViews')} className="hidden lg:flex items-center gap-2 py-2">
      {groups.map((group) => {
        const active = group.pages.includes(activePage);
        return (
          <details key={group.label} className="group relative">
            <summary className={`flex list-none cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? 'border-indigo-500/20 bg-indigo-500/15 text-indigo-300' : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              {t(group.label)} <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
              {group.pages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={(event) => {
                    onNavigate(page);
                    event.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                  title={t(`descriptions.${page}`, { defaultValue: '' })}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${activePage === page ? 'bg-indigo-500/15 font-semibold text-indigo-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                  {t(page)}
                </button>
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
};

export interface MobileProductNavigationProps { isOpen: boolean; onToggle: () => void; activePage: AppPage; onNavigate: (page: AppPage) => void; }
export const MobileProductNavigation: React.FC<MobileProductNavigationProps> = ({ isOpen, onToggle, activePage, onNavigate }) => {
  const { t } = useTranslation('navigation');
  const primaryItems: { page: AppPage; label: string }[] = [
    { page: 'home', label: 'home' },
    { page: 'horoscope', label: 'kundliShort' },
    { page: 'overview', label: 'insightsShort' },
    { page: 'dasha', label: 'dasha' }
  ];
  const morePages: AppPage[] = [
    'planets', 'divisional', 'nakshatras', 'career', 'wealth', 'reasoning',
    'detailed', 'transit', 'relationships', 'validator'
  ];
  return <div className="lg:hidden flex items-center gap-2">
    <nav aria-label={t('productViews')} className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-none">
      {primaryItems.map(({ page, label }) => (
        <button
          key={page}
          type="button"
          onClick={() => onNavigate(page)}
          className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activePage === page ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          {t(label)}
        </button>
      ))}
    </nav>
    <ThemeToggle /><LanguageSwitcher />
    <button type="button" onClick={onToggle} aria-label={isOpen ? t('closeMenu') : t('openMenu')}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
      {isOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
      <span>{t('more')}</span>
    </button>
    {isOpen && <div className="absolute left-0 right-0 top-full z-50 max-h-[75vh] overflow-y-auto border-b border-slate-800/90 bg-slate-900/95 px-4 py-4 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {morePages.map((page) => {
          const item = [...PRODUCT_NAVIGATION, ...RESEARCH_NAVIGATION].find((entry) => entry.id === page);
          return (
            <button
              key={page}
              type="button"
              onClick={() => { onNavigate(page); onToggle(); }}
              className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${activePage === page ? 'border-indigo-500/30 bg-indigo-500/15 font-semibold text-indigo-300' : 'border-slate-800 text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="block">{t(page)}</span>
              {item && 'description' in item && item.description && <span className="mt-1 block text-[10px] font-normal text-slate-500">{t(`descriptions.${page}`, { defaultValue: item.description })}</span>}
            </button>
          );
        })}
      </div>
    </div>}
  </div>;
};

export const Header: React.FC<HeaderProps> = ({ activePage: propActivePage, onNavigate: propOnNavigate, birthContext: propBirthContext, onOpenBirthForm, birthDetails, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation('settings');
  const resolvedActivePage: AppPage = propActivePage || (activeTab ? mapLegacyPageToAppPage(activeTab) : 'home');
  const handleNavigate = (page: AppPage) => { propOnNavigate?.(page); if (setActiveTab) { const legacyTab = mapAppPageToLegacyTab(page); if (legacyTab) setActiveTab(legacyTab); } };
  const resolvedBirthContext: BirthContext | undefined = React.useMemo(() => {
    if (propBirthContext) return propBirthContext;
    if (!birthDetails) return undefined;
    return buildBirthContext(birthDetails);
  }, [propBirthContext, birthDetails]);
  const birthDetailsLabel = resolvedBirthContext ? t('editBirthDetails') : t('enterBirthDetails');

  return <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)] backdrop-blur-xl bg-slate-950/85 dark:bg-slate-950/85 light:bg-white/90 border-b border-indigo-500/15 dark:border-indigo-500/15 light:border-slate-200/90 shadow-sm transition-colors duration-200">
    <div className="max-w-7xl mx-auto space-y-3 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Brand />
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-2.5">
        {resolvedBirthContext && <BirthContextButton birthContext={resolvedBirthContext} onOpenBirthForm={onOpenBirthForm} />}
        <LanguageSwitcher className="hidden lg:inline-flex" />
        <div className="hidden lg:block"><ThemeToggle /></div>
        {onOpenBirthForm && <button type="button" onClick={onOpenBirthForm} className="flex shrink-0 items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>{birthDetailsLabel}</span></button>}
        </div>
      </div>
      <MobileProductNavigation isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} activePage={resolvedActivePage} onNavigate={handleNavigate} />
      <div className="border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80"><ProductNavigation activePage={resolvedActivePage} onNavigate={handleNavigate} /></div>
    </div>
  </header>;
};
