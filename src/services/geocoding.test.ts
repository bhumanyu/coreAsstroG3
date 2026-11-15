import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupTimeZoneByCoordinates, searchPlacesDetailed } from './geocoding';

const validPlace = {
  name: 'London',
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: 'Europe/London'
};

function response(status: number, json: () => Promise<unknown> = async () => ({ results: [validPlace] })) {
  return { ok: status >= 200 && status < 300, status, json };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchPlacesDetailed', () => {
  it('returns SUCCESS for a valid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200)));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({
      status: 'SUCCESS',
      places: [{ ...validPlace }]
    });
  });

  it('returns NO_RESULTS for an empty results array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({ results: [] }))));

    await expect(searchPlacesDetailed('Unknown')).resolves.toEqual({
      status: 'NO_RESULTS',
      places: []
    });
  });

  it('returns HTTP_ERROR with the status code for a non-success response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(503)));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({
      status: 'HTTP_ERROR',
      statusCode: 503
    });
  });

  it('returns NETWORK_ERROR when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(searchPlacesDetailed('London')).resolves.toMatchObject({
      status: 'NETWORK_ERROR',
      message: 'offline'
    });
  });

  it('returns TIMEOUT when the bounded request timeout expires', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const result = searchPlacesDetailed('London', { timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toEqual({ status: 'TIMEOUT' });
  });

  it('returns ABORTED when the caller aborts', async () => {
    const abortController = new AbortController();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const result = searchPlacesDetailed('London', { signal: abortController.signal });
    abortController.abort();

    await expect(result).resolves.toEqual({ status: 'ABORTED' });
  });

  it('returns INVALID_RESPONSE when JSON parsing throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => {
      throw new SyntaxError('invalid json');
    })));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({ status: 'INVALID_RESPONSE' });
  });

  it('preserves an absent timezone as unresolved instead of substituting UTC', async () => {
    const { timezone: _timezone, ...placeWithoutTimezone } = validPlace;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({ results: [placeWithoutTimezone] }))));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({
      status: 'SUCCESS',
      places: [placeWithoutTimezone]
    });
  });

  it('preserves an empty provider timezone as unresolved', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({
      results: [{ ...validPlace, timezone: ' ' }]
    }))));

    await expect(searchPlacesDetailed('London')).resolves.toMatchObject({
      status: 'SUCCESS',
      places: [{ name: 'London', latitude: 51.5072, longitude: -0.1276 }]
    });
  });

  it('returns INVALID_RESPONSE for malformed payloads and non-finite coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({
      results: [{ ...validPlace, latitude: Number.NaN }]
    }))));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({ status: 'INVALID_RESPONSE' });
  });
});

describe('lookupTimeZoneByCoordinates', () => {
  it('returns the provider timezone for valid coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({
      timezone: 'Europe/London',
      current: { temperature_2m: 12 }
    }))));

    await expect(lookupTimeZoneByCoordinates(51.5072, -0.1276)).resolves.toBe('Europe/London');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.open-meteo.com/v1/forecast'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('returns undefined when the payload has no timezone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({
      current: { temperature_2m: 12 }
    }))));

    await expect(lookupTimeZoneByCoordinates(51.5072, -0.1276)).resolves.toBeUndefined();
  });

  it('returns undefined for out-of-range coordinates without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(lookupTimeZoneByCoordinates(91, 0)).resolves.toBeUndefined();
    await expect(lookupTimeZoneByCoordinates(0, 181)).resolves.toBeUndefined();
    await expect(lookupTimeZoneByCoordinates(Number.NaN, 0)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns undefined on HTTP errors and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(500)));
    await expect(lookupTimeZoneByCoordinates(51.5, -0.1)).resolves.toBeUndefined();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(lookupTimeZoneByCoordinates(51.5, -0.1)).resolves.toBeUndefined();
  });

  it('returns undefined when the request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const result = lookupTimeZoneByCoordinates(51.5, -0.1, { timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBeUndefined();
  });
});
