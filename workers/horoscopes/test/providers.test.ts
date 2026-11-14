import { describe, expect, it, vi } from 'vitest';
import { FixtureProvider } from '../src/providers/fixtureProvider';
import { getProvider } from '../src/providers';
import { StarsApiProvider } from '../src/providers/starsApiProvider';
import { isRashiForecast, parseForecastQuery } from '../src/validation';

const parsedQuery = parseForecastQuery(new URLSearchParams('sign=taurus&period=monthly'));
if (!parsedQuery.ok) throw new Error(parsedQuery.message);

describe('horoscope providers', () => {
  it('returns deterministic fixture data that matches the frontend response contract', async () => {
    const provider = new FixtureProvider();
    const forecast = await provider.fetchForecast(parsedQuery.value, new Date('2026-11-14T08:00:00Z'));
    expect(forecast).toMatchObject({
      sign: 'taurus',
      period: 'monthly',
      subtype: 'general',
      provider: 'starsapi',
      language: 'en'
    });
    expect(forecast.summary).toContain('Taurus');
    expect(forecast.summary).toContain('monthly');
    expect(isRashiForecast(forecast, parsedQuery.value)).toBe(true);
  });

  it('marks fixture English as a fallback for Hindi requests', async () => {
    const hindi = parseForecastQuery(new URLSearchParams('sign=leo&period=daily&language=hi'));
    if (!hindi.ok) throw new Error(hindi.message);
    const forecast = await new FixtureProvider().fetchForecast(hindi.value, new Date('2026-11-14T08:00:00Z'));
    expect(forecast).toMatchObject({ language: 'en', languageFallback: true });
    expect(isRashiForecast(forecast, hindi.value)).toBe(true);
  });

  it('selects fixture by default and StarsAPI only when its secret is present', () => {
    expect(getProvider({ HOROSCOPE_CACHE: { get: vi.fn(), put: vi.fn() } })).toBeInstanceOf(FixtureProvider);
    expect(getProvider({
      HOROSCOPE_CACHE: { get: vi.fn(), put: vi.fn() },
      STARSAPI_KEY: 'test-secret'
    })).toBeInstanceOf(StarsApiProvider);
  });

  it('keeps the StarsAPI adapter as an explicit not-implemented license gate', async () => {
    await expect(new StarsApiProvider('test-secret').fetchForecast(
      parsedQuery.value,
      new Date('2026-11-14T08:00:00Z')
    )).rejects.toThrow('StarsApiProvider not implemented — pending license confirmation');
  });
});
