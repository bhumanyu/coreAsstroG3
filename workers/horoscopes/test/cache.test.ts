import { describe, expect, it, vi } from 'vitest';
import { CACHE_TTL_SECONDS, createCacheKey, putCachedForecast } from '../src/cache';
import type { ForecastQuery, HoroscopeCache } from '../src/types';

const query: ForecastQuery = {
  sign: 'aries',
  period: 'weekly',
  subtype: 'general',
  language: 'en',
  timezone: 'UTC'
};

describe('forecast cache', () => {
  it('keys entries by provider, zodiac system, sign, period, subtype, language, and bucket', () => {
    expect(createCacheKey('fixture', query, '2026-W46')).toBe(
      'fixture|vedic_moon|aries|weekly|general|en|2026-W46'
    );
  });

  it('applies period TTLs when writing successful forecasts', async () => {
    const cache: HoroscopeCache = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    };
    const forecast = { title: 'fixture' };

    await putCachedForecast(cache, 'key', forecast, 'weekly');

    expect(cache.put).toHaveBeenCalledWith('key', JSON.stringify(forecast), {
      expirationTtl: 24 * 60 * 60
    });
    expect(CACHE_TTL_SECONDS).toEqual({
      daily: 6 * 60 * 60,
      weekly: 24 * 60 * 60,
      monthly: 7 * 24 * 60 * 60,
      yearly: 30 * 24 * 60 * 60
    });
  });
});
