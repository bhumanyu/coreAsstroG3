import React from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductPageRouter } from './ProductPageRouter';
import { INITIAL_APP_STATE, type AppState } from './AppState';
import type { AppPage } from './navigation/navigationTypes';
import { calculateHoroscope } from '../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import type { Horoscope } from '../types';

let readyHoroscope: Horoscope;

beforeAll(() => {
  readyHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
});

function renderResearchPage(activePage: AppPage) {
  const state: AppState = {
    ...INITIAL_APP_STATE,
    activePage,
    horoscope: readyHoroscope,
    productAnalysis: { status: 'READY', horoscope: readyHoroscope },
    lifeAnalysisState: { status: 'READY' }
  };
  return render(
    <ProductPageRouter
      state={state}
      horoscope={readyHoroscope}
      dashaTimingViewModel={undefined}
      lifeAnalysisState={state.lifeAnalysisState}
      onNavigate={() => undefined}
      onRetry={() => undefined}
      onSelectPeriod={async () => undefined}
    />
  );
}

describe('ProductPageRouter lazy research pages', () => {
  it('loads Nakshatra Explorer on direct navigation', async () => {
    renderResearchPage('nakshatras');
    expect(await screen.findByText('Calculate Nakshatra & Pada by Longitude')).toBeInTheDocument();
  });

  it('loads Engine Validator on direct navigation', async () => {
    renderResearchPage('validator');
    expect(await screen.findByText('Golden Vector Engine Validation')).toBeInTheDocument();
  });

  it('loads Relationship Matrix on direct navigation', async () => {
    renderResearchPage('relationships');
    expect(await screen.findByText('Natural Relationships (Naisargika Sambandha)')).toBeInTheDocument();
  });

  it('loads Divisional Charts on direct navigation', async () => {
    renderResearchPage('divisional');
    expect(await screen.findByText('Divisional Vargas Inspection (D1, D3, D9, D10)')).toBeInTheDocument();
  });

  it('loads Transit Analysis on direct navigation', async () => {
    renderResearchPage('transit');
    expect(await screen.findByText('Vedic Planetary Gochara (Transit Analysis)')).toBeInTheDocument();
  });
});
