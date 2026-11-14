import type { EffectivePeriod } from './effectivePeriod';
import type { ForecastQuery, HoroscopeCache } from './types';

export const CACHE_TTL_SECONDS = Object.freeze({
  daily: 6 * 60 * 60,
  weekly: 24 * 60 * 60,
  monthly: 7 * 24 * 60 * 60,
  yearly: 30 * 24 * 60 * 60
});

export function createCacheKey(
  provider: string,
  query: ForecastQuery,
  effectivePeriod: string
): string {
  return [
    provider,
    'vedic_moon',
    query.sign,
    query.period,
    query.subtype,
    query.language,
    effectivePeriod
  ].join('|');
}

export async function getCachedForecast(
  cache: HoroscopeCache,
  key: string
): Promise<unknown | undefined> {
  const serialized = await cache.get(key, 'text');
  if (serialized === null) return undefined;
  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    console.warn('Ignoring malformed horoscope cache entry.');
    return undefined;
  }
}

export async function putCachedForecast(
  cache: HoroscopeCache,
  key: string,
  value: unknown,
  period: ForecastQuery['period']
): Promise<void> {
  await cache.put(key, JSON.stringify(value), {
    expirationTtl: CACHE_TTL_SECONDS[period]
  });
}

export function buildForecastCacheKey(
  provider: string,
  query: ForecastQuery,
  period: EffectivePeriod
): string {
  return createCacheKey(provider, query, period.key);
}
