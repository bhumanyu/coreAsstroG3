import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BirthFormModal, PRESET_PROFILES } from './components/BirthFormModal';
import { KundaliChart } from './components/KundaliChart';
import { PlanetFactsTable } from './components/PlanetFactsTable';
import { DivisionalChartsView } from './components/DivisionalChartsView';
import { NakshatraExplorer } from './components/NakshatraExplorer';
import { RelationshipMatrix } from './components/RelationshipMatrix';
import { EngineValidator } from './components/EngineValidator';
import { GocharaTransitView } from './components/GocharaTransitView';
import { FullNatalReportView } from './components/fullNatalReport/FullNatalReportView';
import { LifeAnalysisPage } from './components/lifeAnalysis/LifeAnalysisPage';
import { runLifeAnalysisProduct } from './product/life-analysis/lifeAnalysisProductService';
import type { LifeAnalysisProductState } from './product/life-analysis/lifeAnalysisTypes';
import type { AppTab } from './types/appTabs';
import { calculateHoroscope } from './engine/astroEngine';
import { BirthDetails, Planet, DignityStatus, ChartType } from './types';
import { PLANETS_METADATA } from './data/astroData';
import { Sparkles, Compass, ShieldCheck, Flame, Moon, Sun } from 'lucide-react';

export const App: React.FC = () => {
  const [birthDetails, setBirthDetails] = useState<BirthDetails>(
    PRESET_PROFILES[0].details
  );
  const [isBirthFormOpen, setIsBirthFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('life-analysis');
  const [lifeAnalysisState, setLifeAnalysisState] = useState<LifeAnalysisProductState>({ status: 'LOADING' });

  const horoscope = useMemo(() => {
    return calculateHoroscope(birthDetails);
  }, [birthDetails]);

  const lifeAnalysisRequestId = useRef(0);

  const executeLifeAnalysis = useCallback(() => {
    const requestId = ++lifeAnalysisRequestId.current;

    setLifeAnalysisState({
      status: 'LOADING'
    });

    void runLifeAnalysisProduct({
      horoscope,
      includeAiExplanation: true
    })
      .then((result) => {
        if (requestId !== lifeAnalysisRequestId.current) {
          return;
        }

        setLifeAnalysisState(result);
      })
      .catch((error) => {
        if (requestId !== lifeAnalysisRequestId.current) {
          return;
        }

        setLifeAnalysisState({
          status: 'ERROR',
          errorMessage:
            error instanceof Error
              ? error.message
              : String(error)
        });
      });
  }, [horoscope]);

  useEffect(() => {
    executeLifeAnalysis();
  }, [executeLifeAnalysis]);

  const handleLifeAnalysisRetry = () => {
    executeLifeAnalysis();
  };

  const handleResetPreset = () => {
    setBirthDetails(PRESET_PROFILES[0].details);
  };

  // Exalted & Combust Summary Count
  const exaltedPlanets = Object.values(horoscope.planetFacts).filter(
    (f) => f.dignity.status === DignityStatus.EXALTED
  );
  const combustPlanets = Object.values(horoscope.planetFacts).filter(
    (f) => f.state.condition !== 'NORMAL'
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        birthDetails={birthDetails}
        onOpenBirthForm={() => setIsBirthFormOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetPreset={handleResetPreset}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'life-analysis' && (
          <LifeAnalysisPage
            state={lifeAnalysisState}
            onRetry={handleLifeAnalysisRetry}
          />
        )}

        {activeTab === 'report' && (
          <FullNatalReportView report={horoscope.fullNatalAnalysis} />
        )}

        {activeTab === 'horoscope' && (
          <div className="space-y-6">
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

            {/* Primary Rasi Kundali Chart & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <KundaliChart
                  chart={horoscope.rasiChart}
                  title="Rasi Birth Chart (D1)"
                  subtitle={`Computed under ${birthDetails.ayanamsa} Ayanamsa`}
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
        )}

        {activeTab === 'planets' && (
          <PlanetFactsTable planetFacts={horoscope.planetFacts} />
        )}

        {activeTab === 'transit' && (
          <GocharaTransitView horoscope={horoscope} />
        )}

        {activeTab === 'divisional' && (
          <DivisionalChartsView horoscope={horoscope} />
        )}

        {activeTab === 'nakshatras' && <NakshatraExplorer />}

        {activeTab === 'relationships' && <RelationshipMatrix />}

        {activeTab === 'validator' && <EngineValidator />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono-code flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CoreAstro Engine • Ported to React & TypeScript</span>
          <span>Sidereal Astronomical Calculations & Classical Vedic Astrological Tables</span>
        </div>
      </footer>

      {/* Birth Form Modal */}
      <BirthFormModal
        isOpen={isBirthFormOpen}
        onClose={() => setIsBirthFormOpen(false)}
        currentDetails={birthDetails}
        onSave={(newDetails) => setBirthDetails(newDetails)}
      />
    </div>
  );
};
