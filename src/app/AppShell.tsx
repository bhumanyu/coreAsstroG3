import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '../components/Header';
import { BirthContext, buildBirthContext } from './birthContext';
import { BirthFormModal, PRESET_PROFILES } from '../components/BirthFormModal';
import { ProductPageRouter } from './ProductPageRouter';
import { AppFooter } from './AppFooter';
import { AppState, INITIAL_APP_STATE, BirthDetails } from './AppState';
import { createAppController } from './AppController';

export const AppShell: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);

  const controller = useMemo(() => createAppController(setState), []);

  useEffect(() => {
    void controller.analyze(state.birthDetails);
  }, [controller, state.birthDetails]);

  const handleLifeAnalysisRetry = () => {
    void controller.analyze(state.birthDetails);
  };

  const handleResetPreset = () => {
    controller.resetPreset();
    setState((prev) => ({
      ...prev,
      birthDetails: PRESET_PROFILES[0].details
    }));
  };

  const handleSaveBirthDetails = (newDetails: BirthDetails) => {
    setState((prev) => ({
      ...prev,
      birthDetails: newDetails,
      isBirthFormOpen: false
    }));
  };

  // Derive presentational birth context for Header using shared mapper
  const birthContext: BirthContext = useMemo(() => {
    return buildBirthContext(state.birthDetails);
  }, [state.birthDetails]);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans">
      <Header
        activePage={state.activePage}
        onNavigate={controller.navigate}
        birthContext={birthContext}
        onOpenBirthForm={controller.openBirthForm}
        onResetPreset={handleResetPreset}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProductPageRouter
          state={state}
          horoscope={state.horoscope}
          dashaTimingViewModel={state.dashaTimingViewModel}
          lifeAnalysisState={state.lifeAnalysisState}
          onNavigate={controller.navigate}
          onRetry={handleLifeAnalysisRetry}
        />
      </main>

      <AppFooter />

      <BirthFormModal
        isOpen={state.isBirthFormOpen}
        onClose={controller.closeBirthForm}
        currentDetails={state.birthDetails}
        onSave={handleSaveBirthDetails}
      />
    </div>
  );
};
