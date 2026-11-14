import { buildForecastCacheKey, getCachedForecast, putCachedForecast } from './cache';
import { getEffectivePeriod } from './effectivePeriod';
import { getProvider } from './providers';
import type {
  ForecastQuery,
  HoroscopeEnvironment,
  HoroscopeProvider
} from './types';
import { isRashiForecast, parseForecastQuery } from './validation';

const PROVIDER_TIMEOUT_MS = 10_000;

export interface WorkerOptions {
  readonly providerTimeoutMs?: number;
}

function corsHeaders(request: Request, env: HoroscopeEnvironment): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  });
  const configuredOrigins = (env.ALLOWED_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = request.headers.get('Origin');

  if (configuredOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
  }
  return headers;
}

function jsonResponse(
  request: Request,
  env: HoroscopeEnvironment,
  body: unknown,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request, env)
  });
}

function isAllowedOrigin(request: Request, env: HoroscopeEnvironment): boolean {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return true;
  const configuredOrigins = (env.ALLOWED_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configuredOrigins.includes('*') || configuredOrigins.includes(requestOrigin);
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError' || /timeout|timed out/i.test(error.message));
}

async function fetchWithTimeout(
  provider: HoroscopeProvider,
  query: ForecastQuery,
  effectiveDate: Date,
  timeoutMs: number
) {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      const error = new Error('Forecast provider timeout.');
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      provider.fetchForecast(query, effectiveDate, controller.signal),
      timeout
    ]);
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

async function handleForecast(
  request: Request,
  env: HoroscopeEnvironment,
  provider: HoroscopeProvider,
  options: WorkerOptions
): Promise<Response> {
  const url = new URL(request.url);
  const validation = parseForecastQuery(url.searchParams);
  if (!validation.ok) {
    return jsonResponse(request, env, {
      code: 'INVALID_PARAMS',
      message: validation.message
    }, 400);
  }

  const query = validation.value;
  const effectiveDate = new Date();
  const effectivePeriod = getEffectivePeriod(query.period, query.timezone, effectiveDate);
  const cacheKey = buildForecastCacheKey(provider.cacheId, query, effectivePeriod);

  try {
    const cached = await getCachedForecast(env.HOROSCOPE_CACHE, cacheKey);
    if (cached !== undefined && isRashiForecast(cached, query)) {
      return jsonResponse(request, env, cached, 200);
    }
  } catch (error) {
    console.error('Horoscope cache read failed.', error);
  }

  let forecast: Awaited<ReturnType<HoroscopeProvider['fetchForecast']>>;
  try {
    forecast = await fetchWithTimeout(
      provider,
      query,
      effectiveDate,
      options.providerTimeoutMs ?? PROVIDER_TIMEOUT_MS
    );
  } catch (error) {
    const timedOut = isTimeoutError(error);
    console.error(timedOut ? 'Horoscope provider timed out.' : 'Horoscope provider failed.', error);
    return jsonResponse(request, env, {
      code: 'FORECAST_UNAVAILABLE',
      message: timedOut ? 'Forecast provider timed out.' : 'Forecast is temporarily unavailable.'
    }, timedOut ? 504 : 502);
  }

  if (!isRashiForecast(forecast, query)) {
    console.error('Horoscope provider returned an invalid response.');
    return jsonResponse(request, env, {
      code: 'FORECAST_UNAVAILABLE',
      message: 'Forecast provider returned an invalid response.'
    }, 502);
  }

  try {
    await putCachedForecast(env.HOROSCOPE_CACHE, cacheKey, forecast, query.period);
  } catch (error) {
    console.error('Horoscope cache write failed.', error);
  }

  return jsonResponse(request, env, forecast, 200);
}

export async function handleRequest(
  request: Request,
  env: HoroscopeEnvironment,
  provider: HoroscopeProvider = getProvider(env),
  options: WorkerOptions = {}
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/horoscopes') {
    return jsonResponse(request, env, {
      code: 'NOT_FOUND',
      message: 'Not found.'
    }, 404);
  }
  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(request, env, {
      code: 'ORIGIN_NOT_ALLOWED',
      message: 'Origin is not allowed.'
    }, 403);
  }
  if (request.method === 'OPTIONS') {
    const headers = corsHeaders(request, env);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type');
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'GET') {
    const response = jsonResponse(request, env, {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and OPTIONS are supported.'
    }, 405);
    response.headers.set('Allow', 'GET, OPTIONS');
    return response;
  }
  return handleForecast(request, env, provider, options);
}

export default {
  fetch(request: Request, env: HoroscopeEnvironment): Promise<Response> {
    return handleRequest(request, env);
  }
};
