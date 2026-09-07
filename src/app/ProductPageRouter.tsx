/**
 * ARCHITECTURAL CONSTRAINT:
 * Do NOT expand ProductPageRouter.tsx further. It is already approaching monolith territory.
 * Future page wiring, views, or secondary concerns must be extracted into per-page
 * modules/components rather than adding new branches or inline markup here.
 * Do not add new routing responsibilities in this file.
 */

import React from 'react';
import { Compass, Sun, Moon, Sparkles, ArrowLeft, FlaskConical } from 'lucide-react';
import type { AppState } from './AppState';
import type { AppPage, ResearchPage } from './navigation/navigationTypes';
import { RESEARCH_NAVIGATION, mapLegacyPageToAppPage } from './navigation/navigation';
import { LifeAnalysisPage } from '../components/lifeAnalysis/LifeAnalysisPage';
import { DashaTimingPage } from '../components/dashaTiming';
import { FullNatalReportView } from '../components/fullNatalReport/FullNatalReportView';
import { CareerPage } from '../pages/CareerPage';
import { WealthPage } from '../pages/WealthPage';
import { ReasoningPage } from '../pages/ReasoningPage';
import { KundaliChart } from '../components/KundaliChart';
import { PlanetFactsTable } from '../components/PlanetFactsTable';
import { DivisionalChartsView } from '../components/DivisionalChartsView';
import { NakshatraExplorer } from '../components/NakshatraExplorer';
import { RelationshipMatrix } from '../components/RelationshipMatrix';
import { EngineValidator } from '../components/EngineValidator';
import { GocharaTransitView } from '../components/GocharaTransitView';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';
import { DignityStatus, ChartType, Planet } from '../types';
import type { calculateHoroscope } from '../engine/astroEngine';
import type { buildDashaTimingViewModel } from '../product/dasha-timing';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';

export interface ProductPageRouterProps {
  readonly state: AppState;
  readonly horoscope?: ReturnType<typeof calculateHoroscope>;
  readonly dashaTimingViewModel?: ReturnType<typeof buildDashaTimingViewModel>;
  readonly lifeAnalysisState?: LifeAnalysisProductState;
  readonly onNavigate: (page: AppPage) => void;
  readonly onRetry: () => void;
}

export const ResearchToolsPanel: React.FC<{
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}> = ({ activePage, onNavigate }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
            Research & Classical Inspection Tools
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {RESEARCH_NAVIGATION.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ResearchPageHeader: React.FC<{
  title: string;
  onBack: () => void;
}> = ({ title, onBack }) => {
  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Product Overview</span>
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-mono-code text-slate-300">{title}</span>
      </div>
    </div>
  );
};

export const ProductPageRouter: React.FC<ProductPageRouterProps> = ({
  state,
  horoscope,
  dashaTimingViewModel,
  lifeAnalysisState,
  onNavigate,
  onRetry
}) => {
  const effectiveLifeAnalysisState: LifeAnalysisProductState =
    lifeAnalysisState ?? state.lifeAnalysisState ?? { status: 'LOADING' };

  switch (state.activePage) {
    case 'overview':
      return (
        <LifeAnalysisPage
          state={effectiveLifeAnalysisState}
          onRetry={onRetry}
          onNavigateToDashaTiming={() => onNavigate('dasha')}
        />
      );

    case 'career':
      return (
        <CareerPage
          productAnalysisState={state.productAnalysis}
          onRetry={onRetry}
          onNavigate={onNavigate}
        />
      );

    case 'wealth':
      return (
        <WealthPage
          productAnalysisState={state.productAnalysis}
          onRetry={onRetry}
          onNavigate={onNavigate}
        />
      );

    case 'dasha':
      if (!dashaTimingViewModel) {
        return <LifeAnalysisLoading />;
      }
      return (
        <DashaTimingPage
          viewModel={dashaTimingViewModel}
          onSelectTab={(tab) => onNavigate(mapLegacyPageToAppPage(tab))}
        />
      );

    case 'reasoning':
      return (
        <ReasoningPage
          productAnalysisState={state.productAnalysis}
          onNavigate={onNavigate}
        />
      );

    case 'detailed':
      if (!horoscope) {
        return <LifeAnalysisLoading />;
      }
      return (
        <div className="space-y-6">
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <FullNatalReportView
            report={horoscope.fullNatalAnalysis}
            onNavigateToDashaTiming={() => onNavigate('dasha')}
          />
        </div>
      );

    case 'horoscope': {
      if (!horoscope) {
        return <LifeAnalysisLoading />;
      }
      const exaltedPlanets = Object.values(horoscope.planetFacts).filter(
        (f) => f.dignity.status === DignityStatus.EXALTED
      );
      const combustPlanets = Object.values(horoscope.planetFacts).filter(
        (f) => f.state.condition !== 'NORMAL'
      );
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Horoscope & Charts"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />

          {/* Quick Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono-code text-slate-400">Lagna (Ascendant)</span>
                <p className="text-sm font-bold font-serif-astro text-slate-100">
                  {horoscope.rasiChart.ascendantSign}
                </p>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  {horoscope.rasiChart.ascendantLongitude.toFixed(2)}°
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono-code text-slate-400">Sun Sign</span>
                <p className="text-sm font-bold font-serif-astro text-slate-100">
                  {horoscope.planetFacts[Planet.SUN].sign}
                </p>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  {horoscope.planetFacts[Planet.SUN]?.nakshatraMetadata?.englishName || 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono-code text-slate-400">Moon Sign (Rasi)</span>
                <p className="text-sm font-bold font-serif-astro text-slate-100">
                  {horoscope.planetFacts[Planet.MOON].sign}
                </p>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  {horoscope.planetFacts[Planet.MOON]?.nakshatraResult
                    ? `${horoscope.planetFacts[Planet.MOON].nakshatraResult.nakshatra} (P${horoscope.planetFacts[Planet.MOON].nakshatraResult.padaNumber})`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono-code text-slate-400">Key Dignities</span>
                <p className="text-xs font-semibold text-slate-200">
                  {exaltedPlanets.length > 0 ? (
                    <span className="text-amber-300">
                      Exalted: {exaltedPlanets.map((p) => p.planet).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400">No Exalted Planets</span>
                  )}
                </p>
                <span className="text-[11px] text-slate-400 font-mono-code block">
                  {combustPlanets.length} Combust Planets
                </span>
              </div>
            </div>
          </div>

          {/* Primary Rasi Kundali Chart & Navamsa */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6">
              <KundaliChart
                chart={horoscope.rasiChart}
                title="Rasi Birth Chart (D1)"
                subtitle={`Computed under ${state.birthDetails.ayanamsa} Ayanamsa`}
              />
            </div>
            <div className="lg:col-span-6">
              <KundaliChart
                chart={horoscope.charts[ChartType.NAVAMSA]}
                title="Navamsa Chart (D9)"
                subtitle="Spouse, Soul Purpose & Strength"
              />
            </div>
          </div>

          {/* Full Facts Table */}
          <PlanetFactsTable planetFacts={horoscope.planetFacts} />
        </div>
      );
    }

    case 'planets':
      if (!horoscope) {
        return <LifeAnalysisLoading />;
      }
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Planets & Dignity"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <PlanetFactsTable planetFacts={horoscope.planetFacts} />
        </div>
      );

    case 'transit':
      if (!horoscope) {
        return <LifeAnalysisLoading />;
      }
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Transit Analysis"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <GocharaTransitView horoscope={horoscope} />
        </div>
      );

    case 'divisional':
      if (!horoscope) {
        return <LifeAnalysisLoading />;
      }
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Divisional Vargas"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <DivisionalChartsView horoscope={horoscope} />
        </div>
      );

    case 'nakshatras':
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Nakshatra Explorer"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <NakshatraExplorer />
        </div>
      );

    case 'relationships':
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Natural Relationships"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <RelationshipMatrix />
        </div>
      );

    case 'validator':
      return (
        <div className="space-y-6">
          <ResearchPageHeader
            title="Golden Vector Test Suite"
            onBack={() => onNavigate('overview')}
          />
          <ResearchToolsPanel
            activePage={state.activePage}
            onNavigate={onNavigate}
          />
          <EngineValidator />
        </div>
      );

    default:
      return (
        <LifeAnalysisPage
          state={effectiveLifeAnalysisState}
          onRetry={onRetry}
          onNavigateToDashaTiming={() => onNavigate('dasha')}
        />
      );
  }
};
