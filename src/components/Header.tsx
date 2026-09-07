import React, { useState } from 'react';
import { Compass, Sparkles, Calendar, MapPin, RefreshCw, Menu, X } from 'lucide-react';
import type { AppPage } from '../app/navigation/navigationTypes';
import { PRODUCT_NAVIGATION, RESEARCH_NAVIGATION, mapLegacyPageToAppPage } from '../app/navigation/navigation';
import type { BirthDetails } from '../types';
import type { AppTab } from '../types/appTabs';

export interface BirthContext {
  name?: string;
  placeOfBirth?: string;
  formattedDate?: string;
  zoneLabel?: string;
  ayanamsa?: string;
}

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
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-wide font-serif-astro text-slate-100">
          CoreAstro
        </h1>
        <p className="text-xs text-slate-400">
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
      onClick={onOpenBirthForm}
      className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition-all cursor-pointer shadow-sm"
      title="Edit Birth Details & Ayanamsa"
    >
      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
      <span className="font-medium">{birthContext?.name || 'Birth Chart'}</span>
      {birthContext?.placeOfBirth && (
        <>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {birthContext.placeOfBirth}
          </span>
        </>
      )}
      {birthContext?.formattedDate && (
        <>
          <span className="text-slate-500">•</span>
          <span className="font-mono-code text-slate-400">
            {birthContext.formattedDate} {birthContext.zoneLabel}
          </span>
        </>
      )}
      {birthContext?.ayanamsa && (
        <>
          <span className="text-slate-500">•</span>
          <span className="text-purple-400 font-semibold">{birthContext.ayanamsa}</span>
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
    <nav aria-label="Product Navigation" className="hidden lg:flex overflow-x-auto no-scrollbar">
      {PRODUCT_NAVIGATION.map((item) => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.description}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center space-x-1.5 ${
              isActive
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>{item.label}</span>
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
    <div className="lg:hidden">
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-4 shadow-xl z-50">
          <div>
            <span className="text-[10px] uppercase font-mono-code font-bold tracking-wider text-slate-400 block mb-2">
              Product Views
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PRODUCT_NAVIGATION.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex flex-col ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-mono-code font-bold tracking-wider text-slate-400 block mb-2">
              Research & Developer Tools
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {RESEARCH_NAVIGATION.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
      setActiveTab(page as AppTab);
    }
  };

  // Resolved birth context
  const resolvedBirthContext: BirthContext | undefined = React.useMemo(() => {
    if (propBirthContext) return propBirthContext;
    if (!birthDetails) return undefined;

    const tz = birthDetails.timeZone || 'UTC';
    const isoClean =
      birthDetails.dateTimeStr &&
      (birthDetails.dateTimeStr.includes('Z') ||
        birthDetails.dateTimeStr.includes('+') ||
        (birthDetails.dateTimeStr.length > 10 && birthDetails.dateTimeStr.slice(10).includes('-')))
        ? birthDetails.dateTimeStr
        : birthDetails.dateTimeStr
          ? birthDetails.dateTimeStr + 'Z'
          : new Date().toISOString();
    const formattedDate = new Date(isoClean).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz
    });

    const zoneLabel =
      {
        UTC: 'UTC',
        'Asia/Kolkata': 'IST',
        'America/New_York': 'EST',
        'Europe/London': 'GMT',
        'Asia/Tokyo': 'JST'
      }[tz] || tz;

    return {
      name: (birthDetails as any).name || 'Birth Chart',
      placeOfBirth: (birthDetails as any).placeOfBirth,
      formattedDate,
      zoneLabel,
      ayanamsa: birthDetails.ayanamsa
    };
  }, [propBirthContext, birthDetails]);

  return (
    <header className="bg-slate-900/90 border-b border-indigo-500/20 sticky top-0 z-40 backdrop-blur-md relative">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Current Birth Details Badge & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BirthContextButton
            birthContext={resolvedBirthContext}
            onOpenBirthForm={onOpenBirthForm}
          />

          {onResetPreset && (
            <button
              onClick={onResetPreset}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset to Vedic Epoch Default"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenBirthForm && (
            <button
              onClick={onOpenBirthForm}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Chart</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <ProductNavigation
          activePage={resolvedActivePage}
          onNavigate={handleNavigate}
        />
      </div>
    </header>
  );
};
