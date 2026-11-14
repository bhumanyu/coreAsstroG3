import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleRequest } from '../src/index';
import { FixtureProvider } from '../src/providers/fixtureProvider';
import { StarsApiProvider } from '../src/providers/starsApiProvider';
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

  it('returns 405 with the supported methods for other endpoint methods', async () => {
    const response = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily', { method: 'POST' }),
      env(),
      new FixtureProvider()
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, OPTIONS');
    expect(await response.json()).toMatchObject({ code: 'METHOD_NOT_ALLOWED' });
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

  it.each([400, 503])('maps StarsAPI HTTP %i to FORECAST_UNAVAILABLE', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, error: { code: 'VENDOR_ERROR', message: 'Unavailable' } }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )));
    const response = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily'),
      env(),
      new StarsApiProvider('test-secret')
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 'FORECAST_UNAVAILABLE' });
    vi.unstubAllGlobals();
  });

  it('aborts the StarsAPI fetch when the provider timeout expires', async () => {
    const fetchMock = vi.fn((_input: URL, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await handleRequest(
      new Request('https://worker.test/api/horoscopes?sign=aries&period=daily'),
      env(),
      new StarsApiProvider('test-secret'),
      { providerTimeoutMs: 1 }
    );
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(response.status).toBe(504);
    expect(init.signal?.aborted).toBe(true);
    vi.unstubAllGlobals();
  });

  it('serves forecasts when KV reads or writes fail', async () => {
    const readFailureCache: HoroscopeCache = {
      get: vi.fn().mockRejectedValue(new Error('KV read failed')),
      put: vi.fn().mockResolvedValue(undefined)
    };
    const writeFailureCache: HoroscopeCache = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockRejectedValue(new Error('KV write failed'))
    };
    const request = new Request('https://worker.test/api/horoscopes?sign=aries&period=daily');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const readFailure = await handleRequest(request, env({ HOROSCOPE_CACHE: readFailureCache }), new FixtureProvider());
    const writeFailure = await handleRequest(request, env({ HOROSCOPE_CACHE: writeFailureCache }), new FixtureProvider());

    expect(readFailure.status).toBe(200);
    expect(writeFailure.status).toBe(200);
    expect(await readFailure.json()).toMatchObject({ sign: 'aries' });
    expect(await writeFailure.json()).toMatchObject({ sign: 'aries' });
    expect(consoleError).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });
});
