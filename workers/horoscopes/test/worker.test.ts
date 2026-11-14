import { describe, expect, it, vi } from 'vitest';
import { handleRequest } from '../src/index';
import { FixtureProvider } from '../src/providers/fixtureProvider';
import type {
  HoroscopeCache,
  HoroscopeEnvironment,
  HoroscopeProvider,
  RashiForecast
} from '../src/types';

function createCache(): HoroscopeCache {
  const values = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    })
  };
}

function env(overrides: Partial<HoroscopeEnvironment> = {}): HoroscopeEnvironment {
  return {
    HOROSCOPE_CACHE: createCache(),
    ...overrides
  };
}

describe('horoscope worker endpoint', () => {
  it('returns a cached forecast on the second valid request', async () => {
    const workerEnv = env();
    const provider = new FixtureProvider();
    const request = new Request('https://worker.test/api/horoscopes?sign=aries&period=daily');

    const first = await handleRequest(request, workerEnv, provider);
    const second = await handleRequest(request, workerEnv, provider);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({
      sign: 'aries',
      provider: 'starsapi',
      language: 'en'
    });
    expect(workerEnv.HOROSCOPE_CACHE.put).toHaveBeenCalledOnce();
  });

  it('returns normalized errors for invalid params and unknown routes', async () => {
    const invalid = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=weekly&timezone=Nope'),
      env(),
      new FixtureProvider()
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ code: 'INVALID_PARAMS' });

    const unknown = await handleRequest(
      new Request('https://worker.test/health'),
      env(),
      new FixtureProvider()
    );
    expect(unknown.status).toBe(404);
  });

  it('allows only configured origins and supports development wildcard CORS', async () => {
    const allowed = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily', {
        headers: { Origin: 'https://app.example' }
      }),
      env({ ALLOWED_ORIGIN: 'https://app.example,capacitor://localhost' }),
      new FixtureProvider()
    );
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://app.example');

    const denied = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily', {
        headers: { Origin: 'https://other.example' }
      }),
      env({ ALLOWED_ORIGIN: 'https://app.example' }),
      new FixtureProvider()
    );
    expect(denied.status).toBe(403);

    const wildcard = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily', {
        headers: { Origin: 'https://app.example' }
      }),
      env(),
      new FixtureProvider()
    );
    expect(wildcard.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('maps provider timeouts to 504 and other adapter errors to 502', async () => {
    const neverCompletes: HoroscopeProvider = {
      cacheId: 'fixture',
      fetchForecast: vi.fn(() => new Promise<RashiForecast>(() => {}))
    };
    const request = new Request('https://worker.test/api/horoscopes?sign=aries&period=daily');

    const timedOut = await handleRequest(request, env(), neverCompletes, { providerTimeoutMs: 1 });
    expect(timedOut.status).toBe(504);
    expect(await timedOut.json()).toMatchObject({ code: 'FORECAST_UNAVAILABLE' });

    const failedProvider: HoroscopeProvider = {
      cacheId: 'fixture',
      fetchForecast: vi.fn().mockRejectedValue(new Error('vendor down'))
    };
    const failed = await handleRequest(request, env(), failedProvider, { providerTimeoutMs: 100 });
    expect(failed.status).toBe(502);
  });
});
