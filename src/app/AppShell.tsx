/**
 * TRANSITIONAL CONTRACT NOTE:
 * AppShell currently and intentionally still owns horoscope calculation (`calculateHoroscope`),
 * dasha-timing view-model derivation (`buildDashaTimingViewModel`), and life-analysis product
 * execution (`runLifeAnalysisProduct`, lines ~17-81).
 *
 * This orchestration/data responsibility is TRANSITIONAL and must be removed/relocated in
 * P-UI-02 (Canonical ProductAnalysis aggregate). It is documented here so this boundary
 * is not mistaken for a permanent design.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calculateHoroscope } from '../engine/astroEngine';
import { buildDashaTimingViewModel } from '../product/dasha-timing';
import { runLifeAnalysisProduct } from '../product/life-analysis/lifeAnalysisProductService';
import { Header } from '../components/Header';
import { BirthContext, buildBirthContext } from './birthContext';
import { BirthFormModal, PRESET_PROFILES } from '../components/BirthFormModal';
import { ProductPageRouter } from './ProductPageRouter';
import { AppFooter } from './AppFooter';
import { AppState, INITIAL_APP_STATE, BirthDetails, LifeAnalysisProductState } from './AppState';
import { createAppController } from './AppController';

export const AppShell: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);

  const controller = useMemo(() => createAppController(setState), []);

  // Primary Astronomical & Astrological State Derivation
  const horoscope = useMemo(() => {
    return calculateHoroscope(state.birthDetails);
  }, [state.birthDetails]);

  // Dasha Timing ViewModel Derivation
  const dashaTimingViewModel = useMemo(() => {
    const careerTiming =
      state.lifeAnalysisState.status === 'READY'
        ? state.lifeAnalysisState.analysis?.careerDetail?.timing
        : undefined;
    const wealthTiming =
      state.lifeAnalysisState.status === 'READY'
        ? state.lifeAnalysisState.analysis?.wealthDetail?.timing
        : undefined;

    return buildDashaTimingViewModel(horoscope, careerTiming, wealthTiming);
  }, [horoscope, state.lifeAnalysisState]);

  // Request ID ref to prevent race conditions / stale results
  const lifeAnalysisRequestId = useRef(0);

  const executeLifeAnalysis = useCallback(() => {
    const requestId = ++lifeAnalysisRequestId.current;

    setState((prev) => ({
      ...prev,
      lifeAnalysisState: { status: 'LOADING' }
    }));

    void runLifeAnalysisProduct({
      horoscope,
      includeAiExplanation: true
    })
      .then((result: LifeAnalysisProductState) => {
        if (requestId !== lifeAnalysisRequestId.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          lifeAnalysisState: result
        }));
      })
      .catch((error: unknown) => {
        if (requestId !== lifeAnalysisRequestId.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          lifeAnalysisState: {
            status: 'ERROR',
            errorMessage:
              error instanceof Error
                ? error.message
                : String(error)
          }
        }));
      });
  }, [horoscope]);

  useEffect(() => {
    executeLifeAnalysis();
  }, [executeLifeAnalysis]);

  const handleLifeAnalysisRetry = () => {
    executeLifeAnalysis();
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
          horoscope={horoscope}
          dashaTimingViewModel={dashaTimingViewModel}
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
