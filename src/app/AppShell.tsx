import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { BirthContext, buildBirthContext } from './birthContext';
import { BirthFormModal, PRESET_PROFILES } from '../components/BirthFormModal';
import { ProductPageRouter } from './ProductPageRouter';
import { AppFooter } from './AppFooter';
import { AppState, INITIAL_APP_STATE, BirthDetails } from './AppState';
import { createAppController, type AppController } from './AppController';
import { ThemeProvider } from '../context/ThemeContext';
import { ChartProfileManager } from '../features/chart-profiles/ChartProfileManager';
import { ChartExportControl } from '../features/chart-export/ChartExportControl';
import { ChartShareControls } from '../features/chart-sharing/ChartShareControls';

interface AppShellContentProps {
  readonly controllerFactory?: (setState: React.Dispatch<React.SetStateAction<AppState>>) => AppController;
}

export const AppShellContent: React.FC<AppShellContentProps> = ({
  controllerFactory = createAppController
}) => {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);

  const controller = useMemo(() => controllerFactory(setState), [controllerFactory]);

  const runAnalysisSafely = useCallback(async (birthDetails: BirthDetails) => {
    try {
      await controller.analyze(birthDetails);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis calculation failed.';
      setState((prev) => ({
        ...prev,
        productAnalysis: { status: 'ERROR', error: message },
        lifeAnalysisState: { status: 'ERROR', errorMessage: message }
      }));
    }
  }, [controller]);

  useEffect(() => {
    void runAnalysisSafely(state.birthDetails);
  }, [runAnalysisSafely, state.birthDetails]);

  const handleLifeAnalysisRetry = useCallback(() => {
    void runAnalysisSafely(state.birthDetails);
  }, [runAnalysisSafely, state.birthDetails]);

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
    <div className="min-h-screen bg-transparent text-slate-100 dark:text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-200">
      <Header
        activePage={state.activePage}
        onNavigate={controller.navigate}
        birthContext={birthContext}
        onOpenBirthForm={controller.openBirthForm}
        onResetPreset={handleResetPreset}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ChartProfileManager
          currentBirthDetails={state.birthDetails}
          onRestoreBirthDetails={handleSaveBirthDetails}
        />
        <ChartShareControls
          currentBirthDetails={state.birthDetails}
          onLoadBirthDetails={handleSaveBirthDetails}
        />
        {state.productAnalysis.analysis && (
          <ChartExportControl
            analysis={state.productAnalysis.analysis}
            selectedPeriod={state.productAnalysis.analysis.selectedPeriod}
          />
        )}
        <ProductPageRouter
          state={state}
          horoscope={state.horoscope}
          dashaTimingViewModel={state.dashaTimingViewModel}
          lifeAnalysisState={state.lifeAnalysisState}
          onNavigate={controller.navigate}
          onRetry={handleLifeAnalysisRetry}
          onSelectPeriod={controller.selectPeriod}
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

export const AppShell: React.FC = () => {
  return (
    <ThemeProvider>
      <AppShellContent />
    </ThemeProvider>
  );
};
