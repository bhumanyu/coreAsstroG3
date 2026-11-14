import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';
import type { RashiForecast } from '../../services/horoscopeService';
import i18n from '../../i18n/i18n';
import { clearRashiForecastCache, RashiForecastCard } from './RashiForecastCard';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock('../../services/horoscopeService', async () => {
  const actual = await vi.importActual<typeof import('../../services/horoscopeService')>(
    '../../services/horoscopeService'
  );
  return {
    ...actual,
    fetchRashiForecast: fetchMock
  };
});

const sampleHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

function makeForecast(
  request: { sign: string; period: string; subtype: string; language: string },
  overrides: Partial<RashiForecast> = {}
): RashiForecast {
  return {
    sign: request.sign as RashiForecast['sign'],
    period: request.period as RashiForecast['period'],
    subtype: request.subtype as RashiForecast['subtype'],
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    title: `${request.sign} ${request.period} Horoscope`,
    summary: 'A practical day for focused plans.',
    content: 'Take a thoughtful approach to new commitments.',
    provider: 'starsapi',
    publishedAt: '2026-11-14T08:00:00Z',
    language: request.language as RashiForecast['language'],
    ...overrides
  };
}

beforeAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  clearRashiForecastCache();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (request: Parameters<typeof makeForecast>[0]) => makeForecast(request));
  void i18n.changeLanguage('en');
});

afterEach(() => {
  clearRashiForecastCache();
  void i18n.changeLanguage('en');
});

describe('RashiForecastCard', () => {
  it('defaults to the Moon sign in the supplied horoscope', async () => {
    render(<RashiForecastCard horoscope={sampleHoroscope} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({
        sign: String(sampleHoroscope.planetFacts[Planet.MOON].sign).toLowerCase(),
        period: 'daily',
        subtype: 'general',
        language: 'en'
      }));
    });
  });

  it('falls back to Aries when no chart is available', async () => {
    render(<RashiForecastCard />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({ sign: 'aries' }));
    });
    expect(await screen.findByText('aries daily Horoscope')).toBeInTheDocument();
  });

  it('requests the selected period and sign and reuses a cached forecast', async () => {
    render(<RashiForecastCard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await screen.findByText('aries daily Horoscope');

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText('aries weekly Horoscope');

    fireEvent.change(screen.getByRole('combobox', { name: 'Browse another Rashi' }), {
      target: { value: 'gemini' }
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    await screen.findByText('gemini weekly Horoscope');

    fireEvent.change(screen.getByRole('combobox', { name: 'Browse another Rashi' }), {
      target: { value: 'aries' }
    });
    await screen.findByText('aries weekly Horoscope');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith(expect.objectContaining({
      sign: 'gemini',
      period: 'weekly'
    }));
  });

  it('offers retry after an error and shows the language fallback notice', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network error'))
      .mockImplementationOnce(async (request: Parameters<typeof makeForecast>[0]) =>
        makeForecast(request, { language: 'en', languageFallback: true })
      );
    render(<RashiForecastCard />);

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Hindi unavailable — showing English.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('requests English while Hindi UI is disabled by the feature flag', async () => {
    await i18n.changeLanguage('hi');
    render(<RashiForecastCard />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({
      language: 'en'
    })));
    expect(screen.getByRole('heading', { name: 'सामान्य राशि भविष्यफल' })).toBeInTheDocument();
    expect(screen.getByText('चंद्र राशि पर आधारित, पूरी कुंडली पर नहीं')).toBeInTheDocument();
  });
});
