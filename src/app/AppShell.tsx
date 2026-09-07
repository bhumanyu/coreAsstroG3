import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calculateHoroscope } from '../engine/astroEngine';
import { buildDashaTimingViewModel } from '../product/dasha-timing';
import { runLifeAnalysisProduct } from '../product/life-analysis/lifeAnalysisProductService';
import { Header, BirthContext } from '../components/Header';
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

  // Derive presentational birth context for Header
  const birthContext: BirthContext = useMemo(() => {
    const b = state.birthDetails;
    const tz = b.timeZone || 'UTC';
    const isoClean =
      b.dateTimeStr &&
      (b.dateTimeStr.includes('Z') ||
        b.dateTimeStr.includes('+') ||
        (b.dateTimeStr.length > 10 && b.dateTimeStr.slice(10).includes('-')))
        ? b.dateTimeStr
        : b.dateTimeStr
          ? b.dateTimeStr + 'Z'
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
      name: (b as any).name || 'Birth Chart',
      placeOfBirth: (b as any).placeOfBirth,
      formattedDate,
      zoneLabel,
      ayanamsa: b.ayanamsa
    };
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
