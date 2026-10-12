import React, { useState } from 'react';
import { Compass, Sparkles, Calendar, MapPin, RefreshCw, Menu, X } from 'lucide-react';
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

export type { BirthContext };

export interface HeaderProps {
  activePage?: AppPage;
  onNavigate?: (page: AppPage) => void;
  birthContext?: BirthContext;
  onOpenBirthForm?: () => void;
  onResetPreset?: () => void;

  // Legacy props compatibility
  birthDetails?: BirthDetails;
  activeTab?: AppTab;
  setActiveTab?: (tab: AppTab) => void;
}

export const Brand: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/25">
        <div className="w-full h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-900 rounded-[10px] flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-wide font-serif-astro text-slate-100 dark:text-slate-100 light:text-slate-900">
          CoreAstro
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
          Vedic Astrology
        </p>
      </div>
    </div>
  );
};

export interface BirthContextButtonProps {
  birthContext?: BirthContext;
  onOpenBirthForm?: () => void;
}

export const BirthContextButton: React.FC<BirthContextButtonProps> = ({
  birthContext,
  onOpenBirthForm
}) => {
  return (
    <button
      type="button"
      onClick={onOpenBirthForm}
      className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-750 dark:bg-slate-800/80 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 hover:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      title="Edit Birth Details & Ayanamsa"
    >
      <Calendar className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 shrink-0" aria-hidden="true" />
      <span className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-900">
        {birthContext?.name || 'Birth Chart'}
      </span>
      {birthContext?.placeOfBirth && (
        <>
          <span className="text-slate-500 dark:text-slate-500 light:text-slate-400" aria-hidden="true">•</span>
          <span className="text-emerald-400 dark:text-emerald-400 light:text-emerald-600 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 shrink-0" aria-hidden="true" />
            {birthContext.placeOfBirth}
          </span>
        </>
      )}
      {birthContext?.formattedDate && (
        <>
          <span className="text-slate-500 dark:text-slate-500 light:text-slate-400" aria-hidden="true">•</span>
          <span className="font-mono-code text-slate-400 dark:text-slate-400 light:text-slate-600">
            {birthContext.formattedDate} {birthContext.zoneLabel}
          </span>
        </>
      )}
      {birthContext?.ayanamsa && (
        <>
          <span className="text-slate-500 dark:text-slate-500 light:text-slate-400" aria-hidden="true">•</span>
          <span className="text-purple-400 dark:text-purple-400 light:text-purple-600 font-semibold">
            {birthContext.ayanamsa}
          </span>
        </>
      )}
    </button>
  );
};

export interface ProductNavigationProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const ProductNavigation: React.FC<ProductNavigationProps> = ({
  activePage,
  onNavigate
}) => {
  return (
    <nav aria-label="Product Navigation" className="hidden lg:flex overflow-x-auto scrollbar-none gap-1 py-1">
      {PRODUCT_NAVIGATION.map((item) => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            title={item.description}
            className={`relative px-3.5 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all rounded-lg cursor-pointer flex items-center space-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isActive
                ? 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-400 light:text-indigo-700 light:bg-indigo-50 font-semibold shadow-sm border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-100 light:text-slate-600 light:hover:text-slate-900 hover:bg-slate-800/40 dark:hover:bg-slate-800/40 light:hover:bg-slate-100 border border-transparent'
            }`}
          >
            <span>{item.label}</span>
            <span
              aria-hidden="true"
              className={`absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-indigo-400 origin-left transition-transform duration-300 ${
                isActive ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export interface MobileProductNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const MobileProductNavigation: React.FC<MobileProductNavigationProps> = ({
  isOpen,
  onToggle,
  activePage,
  onNavigate
}) => {
  return (
    <div className="lg:hidden flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border-b border-slate-800/90 dark:border-slate-800/90 light:border-slate-200 px-4 py-4 space-y-4 shadow-2xl backdrop-blur-xl z-50">
          <div>
            <span className="text-[10px] uppercase font-mono-code font-bold tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 block mb-2">
              Product Views
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRODUCT_NAVIGATION.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex flex-col cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-400 light:text-indigo-700 light:bg-indigo-50 font-semibold border border-indigo-500/20'
                        : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-normal">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] uppercase font-mono-code font-bold tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 block mb-2">
              Research & Developer Tools
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {RESEARCH_NAVIGATION.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-400 light:text-indigo-700 light:bg-indigo-50 font-semibold'
                        : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activePage: propActivePage,
  onNavigate: propOnNavigate,
  birthContext: propBirthContext,
  onOpenBirthForm,
  onResetPreset,
  birthDetails,
  activeTab,
  setActiveTab
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Resolved activePage
  const resolvedActivePage: AppPage =
    propActivePage || (activeTab ? mapLegacyPageToAppPage(activeTab) : 'overview');

  // Resolved navigation handler
  const handleNavigate = (page: AppPage) => {
    if (propOnNavigate) {
      propOnNavigate(page);
    }
    if (setActiveTab) {
      const legacyTab = mapAppPageToLegacyTab(page);
      if (legacyTab) {
        setActiveTab(legacyTab);
      }
    }
  };

  // Resolved birth context
  const resolvedBirthContext: BirthContext | undefined = React.useMemo(() => {
    if (propBirthContext) return propBirthContext;
    if (!birthDetails) return undefined;
    return buildBirthContext(birthDetails);
  }, [propBirthContext, birthDetails]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 dark:bg-slate-950/85 light:bg-white/90 border-b border-indigo-500/15 dark:border-indigo-500/15 light:border-slate-200/90 shadow-sm transition-colors duration-200">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Brand />
          <MobileProductNavigation
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            activePage={resolvedActivePage}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Current Birth Details Badge, Theme Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <BirthContextButton
            birthContext={resolvedBirthContext}
            onOpenBirthForm={onOpenBirthForm}
          />

          {onResetPreset && (
            <button
              type="button"
              onClick={onResetPreset}
              className="p-2 bg-slate-800/80 hover:bg-slate-750 dark:bg-slate-800/80 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Reset to Vedic Epoch Default"
              aria-label="Reset to default preset"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {onOpenBirthForm && (
            <button
              type="button"
              onClick={onOpenBirthForm}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Chart</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80">
        <ProductNavigation
          activePage={resolvedActivePage}
          onNavigate={handleNavigate}
        />
      </div>
    </header>
  );
};
